"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export function DropZone({ onFiles, accept = "application/pdf", multiple = true }: DropZoneProps) {
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsActive(true);
  };

  const handleDragLeave = () => setIsActive(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) onFiles(files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFiles(files);
    e.target.value = "";
  };

  return (
    <div
      className={`dropzone ${isActive ? "dropzone-active" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
      <div>
        <p className="dropzone-title">Drop PDF files here</p>
        <p className="dropzone-subtitle">or click to browse</p>
      </div>
    </div>
  );
}
