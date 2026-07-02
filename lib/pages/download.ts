export function downloadBase64File(
  name: string,
  mimeType: string,
  dataBase64: string,
): void {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(name: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name.endsWith(".json") ? name : `${name}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyPageShareLink(
  spaceId: number,
  pageId: number,
): Promise<void> {
  const url = `${window.location.origin}/pages/space/${spaceId}/${pageId}`;
  await navigator.clipboard.writeText(url);
}
