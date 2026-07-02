"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { duplicatePage, getPage, getSpace, softDeletePage } from "@/lib/pages/actions";
import { pageRoomId } from "@/lib/pages/room";
import type { PageRecord, SpaceRecord } from "@/lib/pages/types";
import { isVaultUnlocked } from "@/lib/vault/session";
import "@/lib/liveblocks/config";
import { CollaborationPanel } from "@/components/pages/collaboration-panel";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";
import { PageEditor } from "@/components/pages/page-editor";
import { VaultUnlockDialog } from "@/components/pages/vault-unlock-dialog";
import { Button } from "@/components/retroui/Button";
import { Text } from "@/components/retroui/Text";

type PageEditorViewProps = {
  spaceId: number;
  pageId: number;
};

function PageEditorContent({ spaceId, pageId }: PageEditorViewProps) {
  const router = useRouter();
  const [space, setSpace] = useState<SpaceRecord | null>(null);
  const [page, setPage] = useState<PageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);

  const load = useCallback(async () => {
    const spaceData = await getSpace(spaceId);
    if (!spaceData) {
      setSpace(null);
      setPage(null);
      return;
    }

    const locked = spaceData.isVault && !isVaultUnlocked(spaceId);
    setSpace(spaceData);

    if (locked) {
      setVaultOpen(true);
      setPage(null);
      return;
    }

    const pageData = await getPage(pageId);
    setPage(pageData);
  }, [spaceId, pageId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    void (async () => {
      const spaceData = await getSpace(spaceId);
      if (cancelled) return;
      if (!spaceData) {
        setSpace(null);
        setPage(null);
        setLoading(false);
        return;
      }
      const locked = spaceData.isVault && !isVaultUnlocked(spaceId);
      setSpace(spaceData);
      if (locked) {
        setVaultOpen(true);
        setPage(null);
        setLoading(false);
        return;
      }
      const pageData = await getPage(pageId);
      if (cancelled) return;
      setPage(pageData);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId, pageId]);

  if (loading) {
    return <KaizenLoadingScreen label="Loading page…" />;
  }

  if (!space) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <Text as="h1">Space not found</Text>
        <Link
          href="/pages"
          className="mt-4 inline-flex h-10 items-center justify-center rounded border-2 border-border bg-primary px-4 font-head text-sm shadow-sm"
        >
          Back to All Spaces
        </Link>
      </div>
    );
  }

  if (space.isVault && !isVaultUnlocked(spaceId)) {
    return (
      <>
        <div className="mx-auto max-w-3xl text-center">
          <Text as="h1">Vault Locked</Text>
          <p className="mt-2 font-sans text-sm text-muted-foreground">
            Prove vault access with ZK on Stellar to edit this page.
          </p>
          <Button className="mt-4" onClick={() => setVaultOpen(true)}>
            Unlock Vault
          </Button>
        </div>
        {space.vaultCommitment && space.vaultSalt ? (
          <VaultUnlockDialog
            open={vaultOpen}
            onOpenChange={setVaultOpen}
            spaceId={spaceId}
            spaceName={space.name}
            vaultSalt={space.vaultSalt}
            vaultCommitment={space.vaultCommitment}
            onUnlocked={() => {
              void load();
            }}
          />
        ) : null}
      </>
    );
  }

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <Text as="h1">Page not found</Text>
        <Link
          href={`/pages/space/${spaceId}`}
          className="mt-4 inline-flex h-10 items-center justify-center rounded border-2 border-border bg-primary px-4 font-head text-sm shadow-sm"
        >
          Back to space
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded border-2 border-border bg-background shadow-md">
        <RoomProvider id={pageRoomId(pageId)}>
          <ClientSideSuspense fallback={<KaizenLoadingScreen label="Connecting…" />}>
            <PageEditor
              page={page}
              spaceName={space.name}
              isVault={space.isVault}
              onTitleUpdated={(title, updatedAt) => {
                setPage((prev) =>
                  prev ? { ...prev, title, updatedAt } : prev,
                );
              }}
              onFavoriteUpdated={(isFavorite) => {
                setPage((prev) => (prev ? { ...prev, isFavorite } : prev));
              }}
              onDuplicate={() => {
                void duplicatePage(pageId).then((dup) => {
                  router.push(`/pages/space/${spaceId}/${dup.id}`);
                });
              }}
              onDelete={() => {
                void softDeletePage(pageId).then(() => {
                  router.push(`/pages/space/${spaceId}`);
                });
              }}
              onShare={() => setCollaborationOpen(true)}
            />
          </ClientSideSuspense>
        </RoomProvider>
      </section>

      <CollaborationPanel
        spaceId={spaceId}
        isOwner={page.role === "owner"}
        open={collaborationOpen}
        onOpenChange={setCollaborationOpen}
      />
    </>
  );
}

export function PageEditorView(props: PageEditorViewProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <PageEditorContent {...props} />
    </LiveblocksProvider>
  );
}
