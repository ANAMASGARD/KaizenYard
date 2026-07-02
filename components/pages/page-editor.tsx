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
import {
  duplicatePage,
  softDeletePage,
  togglePageFavorite,
} from "@/lib/pages/actions";
import { createSlashCommandExtension } from "@/lib/notes/slash-command";
import {
  loadSpeechPrefs,
  type SpeechLanguageId,
} from "@/lib/notes/speech-languages";
import { useWebSpeechTts } from "@/lib/notes/use-web-speech-tts";
import type { PageRecord, TiptapJson } from "@/lib/pages/types";
import { usePageAutosave } from "@/lib/pages/use-page-autosave";
import type { SpaceRole } from "@/lib/pages/room";
import { colorForUserId } from "@/lib/liveblocks/user-color";
import { PageEditorHeader } from "@/components/pages/page-editor-header";
import { NoteBubbleMenu } from "@/components/notes/note-bubble-menu";
import { NoteSelectionMenu } from "@/components/notes/note-selection-menu";
import { NoteToolbar } from "@/components/notes/note-toolbar";
import { SlashCommandList } from "@/components/notes/slash-command-list";
import { cn } from "@/lib/utils";

type PageEditorProps = {
  page: PageRecord;
  spaceName: string;
  isVault: boolean;
  onTitleUpdated: (title: string, updatedAt: string) => void;
  onFavoriteUpdated: (isFavorite: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onShare: () => void;
};

function PageEditorInner({
  page,
  spaceName,
  isVault,
  yDoc,
  provider,
  pageRole,
  onTitleUpdated,
  onFavoriteUpdated,
  onDuplicate,
  onDelete,
  onShare,
}: PageEditorProps & {
  yDoc: Y.Doc;
  provider: LiveblocksYjsProvider;
  pageRole: SpaceRole;
}) {
  const self = useSelf();
  const readOnly = pageRole === "viewer";
  const seededRef = useRef(false);
  const scheduleRef = useRef<
    (patch: { title?: string; content?: TiptapJson }) => void
  >(() => {});
  const [title, setTitle] = useState(page.title);
  const [lastEdited, setLastEdited] = useState(page.updatedAt);
  const [ttsLanguage, setTtsLanguage] = useState<SpeechLanguageId>("auto");

  const {
    speak,
    stop: stopTts,
    isSpeaking,
    supported: ttsSupported,
    error: ttsError,
  } = useWebSpeechTts({ languageId: ttsLanguage });

  useEffect(() => {
    setTtsLanguage(loadSpeechPrefs().ttsLang);
  }, []);

  const slashExtension = useMemo(
    () => createSlashCommandExtension(SlashCommandList),
    [],
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        undoRedo: false,
        link: false,
        underline: false,
      }),
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
        user: { name: "You", color: "#f5d547" },
      }),
      slashExtension,
    ],
    [yDoc, provider, slashExtension],
  );

  const { status, schedule } = usePageAutosave({
    pageId: page.id,
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
    [page.id, readOnly, extensions],
  );

  useEffect(() => {
    const seedIfNeeded = () => {
      if (!editor || editor.isDestroyed || seededRef.current) return;
      const fragment = yDoc.getXmlFragment("default");
      if (fragment.length === 0 && page.content) {
        editor.commands.setContent(page.content, { emitUpdate: false });
      }
      seededRef.current = true;
    };

    if (provider.synced) seedIfNeeded();
    const onSync = (synced: boolean) => {
      if (synced) seedIfNeeded();
    };
    provider.on("sync", onSync);
    return () => {
      provider.off("sync", onSync);
    };
  }, [editor, page.content, yDoc, provider]);

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

  async function handleToggleFavorite() {
    const saved = await togglePageFavorite(page.id);
    onFavoriteUpdated(saved.isFavorite);
  }

  const wordCount = editor?.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageEditorHeader
        spaceId={page.spaceId}
        spaceName={spaceName}
        isVault={isVault}
        title={title}
        isFavorite={page.isFavorite}
        pageRole={pageRole}
        saveStatus={status}
        wordCount={wordCount}
        lastEdited={lastEdited}
        onTitleChange={handleTitleChange}
        onToggleFavorite={() => void handleToggleFavorite()}
        onShare={onShare}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />

      {!readOnly ? <NoteToolbar editor={editor} /> : null}
      {!readOnly ? (
        <NoteBubbleMenu
          editor={editor}
          noteId={page.id}
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
            readOnly && "opacity-90",
          )}
        />
      </div>
    </div>
  );
}

function PageEditorSession(props: PageEditorProps) {
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
    <PageEditorInner
      {...props}
      yDoc={yDoc}
      provider={provider}
      pageRole={props.page.role}
    />
  );
}

export function PageEditor(props: PageEditorProps) {
  return <PageEditorSession key={props.page.id} {...props} />;
}
