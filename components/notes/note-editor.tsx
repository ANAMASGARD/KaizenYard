"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelf, useRoom } from "@liveblocks/react/suspense";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";
import { togglePin } from "@/lib/notes/actions";
import { createSlashCommandExtension } from "@/lib/notes/slash-command";
import {
  loadSpeechPrefs,
  type SpeechLanguageId,
} from "@/lib/notes/speech-languages";
import type { NoteRecord, TiptapJson } from "@/lib/notes/types";
import { useNoteAutosave } from "@/lib/notes/use-note-autosave";
import { useWebSpeechTts } from "@/lib/notes/use-web-speech-tts";
import type { NoteRole } from "@/lib/notes/room";
import { colorForUserId } from "@/lib/liveblocks/user-color";
import { NoteBubbleMenu } from "@/components/notes/note-bubble-menu";
import { NoteEditorHeader } from "@/components/notes/note-editor-header";
import { NoteSelectionMenu } from "@/components/notes/note-selection-menu";
import { NoteToolbar } from "@/components/notes/note-toolbar";
import { SlashCommandList } from "@/components/notes/slash-command-list";
import { cn } from "@/lib/utils";

type NoteEditorProps = {
  note: NoteRecord;
  onTitleUpdated: (title: string, updatedAt: string) => void;
  onPinnedUpdated: (pinned: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onShare: () => void;
};

function NoteEditorInner({
  note,
  yDoc,
  provider,
  noteRole,
  onTitleUpdated,
  onPinnedUpdated,
  onDuplicate,
  onDelete,
  onShare,
}: NoteEditorProps & {
  yDoc: Y.Doc;
  provider: LiveblocksYjsProvider;
  noteRole: NoteRole;
}) {
  const self = useSelf();
  const readOnly = noteRole === "viewer";
  const seededRef = useRef(false);
  const scheduleRef = useRef<
    (patch: { title?: string; content?: TiptapJson }) => void
  >(() => {});
  const [title, setTitle] = useState(note.title);
  const [lastEdited, setLastEdited] = useState(note.updatedAt);
  const [ttsLanguage, setTtsLanguage] = useState<SpeechLanguageId>(() => {
    if (typeof window === "undefined") return "auto";
    return loadSpeechPrefs().ttsLang;
  });

  const {
    speak,
    stop: stopTts,
    isSpeaking,
    supported: ttsSupported,
    error: ttsError,
  } = useWebSpeechTts({ languageId: ttsLanguage });

  useEffect(() => {
    stopTts();
  }, [note.id, stopTts]);

  useEffect(() => {
    const syncLanguage = () => {
      setTtsLanguage(loadSpeechPrefs().ttsLang);
    };

    window.addEventListener("storage", syncLanguage);
    return () => window.removeEventListener("storage", syncLanguage);
  }, []);

  const slashExtension = useMemo(
    () => createSlashCommandExtension(SlashCommandList),
    [],
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({ undoRedo: false }),
      Placeholder.configure({
        placeholder: "Press / for commands…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      CharacterCount,
      Collaboration.configure({ document: yDoc }),
      CollaborationCaret.configure({
        provider,
        user: {
          name: "You",
          color: "#f5d547",
        },
      }),
      slashExtension,
    ],
    [yDoc, provider, slashExtension],
  );

  const { status, schedule, saveNow } = useNoteAutosave({
    noteId: note.id,
    onSaved: (result) => {
      setLastEdited(result.updatedAt);
      if (result.title !== undefined) {
        onTitleUpdated(result.title, result.updatedAt);
      }
    },
  });

  useEffect(() => {
    scheduleRef.current = schedule;
  }, [schedule]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: !readOnly,
      extensions,
      onUpdate: ({ editor: ed }) => {
        scheduleRef.current({ content: ed.getJSON() as TiptapJson });
      },
    },
    [note.id, readOnly, extensions],
  );

  useEffect(() => {
    const seedIfNeeded = () => {
      if (!editor || editor.isDestroyed || seededRef.current) return;

      const fragment = yDoc.getXmlFragment("default");
      if (fragment.length === 0 && note.content) {
        editor.commands.setContent(note.content, { emitUpdate: false });
      }
      seededRef.current = true;
    };

    if (provider.synced) {
      seedIfNeeded();
    }

    const onSync = (synced: boolean) => {
      if (synced) seedIfNeeded();
    };

    provider.on("sync", onSync);
    return () => {
      provider.off("sync", onSync);
    };
  }, [editor, note.content, yDoc, provider]);

  useEffect(() => {
    if (!editor || editor.isDestroyed || !self?.id) return;
    editor.commands.updateUser({
      name: self.info.name,
      color: colorForUserId(self.id),
    });
  }, [editor, self?.id, self?.info.name]);

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      setTitle(nextTitle);
      schedule({ title: nextTitle });
    },
    [schedule],
  );

  async function handleTogglePin() {
    try {
      const saved = await togglePin(note.id);
      onPinnedUpdated(saved.pinned);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to pin note");
    }
  }

  const handleTranscript = useCallback(
    (text: string) => {
      if (!editor || editor.isDestroyed || readOnly) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      editor.chain().focus().insertContent(`${trimmed} `).run();
      void saveNow({ content: editor.getJSON() as TiptapJson });
    },
    [editor, readOnly, saveNow],
  );

  const getNoteText = useCallback(() => {
    if (!editor || editor.isDestroyed) return "";
    return editor.getText();
  }, [editor]);

  const handleSttStart = useCallback(() => {
    setTtsLanguage(loadSpeechPrefs().ttsLang);
    stopTts();
  }, [stopTts]);

  const wordCount = editor?.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <NoteEditorHeader
        title={title}
        pinned={note.pinned}
        noteRole={noteRole}
        saveStatus={status}
        wordCount={wordCount}
        lastEdited={lastEdited}
        onTitleChange={handleTitleChange}
        onTogglePin={() => void handleTogglePin()}
        onShare={onShare}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onTranscript={handleTranscript}
        onSttStart={handleSttStart}
        onSpeechLanguageChange={setTtsLanguage}
        getNoteText={getNoteText}
        speak={speak}
        stopTts={stopTts}
        isSpeaking={isSpeaking}
        ttsSupported={ttsSupported}
        ttsError={ttsError}
      />

      {!readOnly ? <NoteToolbar editor={editor} /> : null}

      {!readOnly ? (
        <NoteBubbleMenu
          editor={editor}
          noteId={note.id}
          speak={speak}
          stopTts={stopTts}
          isSpeaking={isSpeaking}
          ttsSupported={ttsSupported}
          ttsError={ttsError}
        />
      ) : (
        <NoteSelectionMenu
          editor={editor}
          speak={speak}
          stop={stopTts}
          isSpeaking={isSpeaking}
          supported={ttsSupported}
          error={ttsError}
        />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <EditorContent
          editor={editor}
          className={cn(
            "note-editor prose prose-neutral dark:prose-invert max-w-none font-sans",
            "[&_.ProseMirror]:min-h-[50vh] [&_.ProseMirror]:outline-none",
            "[&_.ProseMirror_h1]:font-head [&_.ProseMirror_h2]:font-head [&_.ProseMirror_h3]:font-head",
            "[&_.ProseMirror_ul[data-type=taskList]_li]:flex [&_.ProseMirror_ul[data-type=taskList]_li]:items-start [&_.ProseMirror_ul[data-type=taskList]_li]:gap-2",
            "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary [&_.ProseMirror_blockquote]:pl-4",
            "[&_.ProseMirror_pre]:border-2 [&_.ProseMirror_pre]:border-border [&_.ProseMirror_pre]:bg-muted/40",
            readOnly && "opacity-90",
          )}
        />
      </div>
    </div>
  );
}

function NoteEditorSession(props: NoteEditorProps) {
  const room = useRoom();
  const yDoc = useMemo(() => new Y.Doc(), []);
  const provider = useMemo(
    () => new LiveblocksYjsProvider(room, yDoc),
    [room, yDoc],
  );

  useEffect(() => {
    return () => {
      provider.destroy();
      yDoc.destroy();
    };
  }, [provider, yDoc]);

  return (
    <NoteEditorInner
      {...props}
      yDoc={yDoc}
      provider={provider}
      noteRole={props.note.role}
    />
  );
}

export function NoteEditor(props: NoteEditorProps) {
  return <NoteEditorSession key={props.note.id} {...props} />;
}
