"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

type Props = { onFileSelected: (file: File) => void };

export default function CvUploadZone({ onFileSelected }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFileSelected(accepted[0]);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
    onDropAccepted: () => setDragOver(false),
  });

  return (
    <div
      {...getRootProps()}
      className="rounded-2xl p-14 text-center cursor-pointer transition-all"
      style={{
        border: `2px dashed ${dragOver ? "var(--color-brand-500)" : "var(--color-border)"}`,
        background: dragOver ? "rgba(99,102,241,0.05)" : "var(--color-surface-1)",
      }}
    >
      <input {...getInputProps()} />
      <div
        className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-400)" strokeWidth="1.8">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--color-foreground)" }}>
        {dragOver ? "Drop to analyse" : "Drop your CV here"}
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--color-muted)" }}>PDF or DOCX · Max 5MB</p>
      <button
        type="button"
        className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
        style={{ background: "var(--color-brand-600)" }}
        onClick={(e) => { e.stopPropagation(); open(); }}
      >
        Choose file
      </button>
    </div>
  );
}
