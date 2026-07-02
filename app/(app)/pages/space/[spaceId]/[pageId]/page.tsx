import { PageEditorView } from "@/components/pages/page-editor-view";

type Props = {
  params: Promise<{ spaceId: string; pageId: string }>;
};

export default async function PageEditorPage({ params }: Props) {
  const { spaceId, pageId } = await params;
  const sid = Number.parseInt(spaceId, 10);
  const pid = Number.parseInt(pageId, 10);
  if (!Number.isFinite(sid) || !Number.isFinite(pid)) {
    return null;
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageEditorView spaceId={sid} pageId={pid} />
    </div>
  );
}
