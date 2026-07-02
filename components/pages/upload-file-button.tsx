"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadSpaceFile } from "@/lib/pages/file-actions";
import { Button } from "@/components/retroui/Button";

type UploadFileButtonProps = {
  spaceId: number;
  disabled?: boolean;
  onUploaded: () => void;
};

export function UploadFileButton({
  spaceId,
  disabled,
  onUploaded,
}: UploadFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("spaceId", String(spaceId));
      formData.set("file", file);
      await uploadSpaceFile(formData);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" />
        {uploading ? "Uploading…" : "Upload File"}
      </Button>
      {error ? (
        <p className="font-sans text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
