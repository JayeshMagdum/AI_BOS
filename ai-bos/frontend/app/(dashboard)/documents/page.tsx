"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Sparkles,
  RefreshCw,
  HardDrive,
  File,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DocumentItem,
  getDocuments,
  uploadDocument,
  deleteDocument,
  ApiError,
} from "@/lib/api";

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type === "pdf") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
        <FileText className="h-5 w-5" />
      </div>
    );
  }
  if (type === "xlsx" || type === "xls" || type === "csv") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <File className="h-5 w-5" />
      </div>
    );
  }
  if (type === "docx" || type === "doc") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
        <FileText className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
      <FileText className="h-5 w-5" />
    </div>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err: unknown) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(25);

    try {
      const timer = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 20 : prev));
      }, 150);

      const newDoc = await uploadDocument(file);
      clearInterval(timer);
      setUploadProgress(100);

      setUploadSuccess(`"${file.name}" uploaded successfully!`);
      setDocuments((prev) => [newDoc, ...prev]);

      setTimeout(() => {
        setUploadSuccess(null);
        setUploadProgress(0);
      }, 4000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setUploadError(err.detail);
      } else {
        setUploadError("An unexpected error occurred while uploading.");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: unknown) {
      alert("Failed to delete document. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBytes = documents.reduce((acc, doc) => acc + doc.file_size, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Upload and organize business documents to power your AI knowledge base.
          </p>
        </div>

        {/* Quick stats pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>
              <strong className="text-foreground">{documents.length}</strong> Document
              {documents.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            <HardDrive className="h-3.5 w-3.5 text-primary" />
            <span>
              <strong className="text-foreground">{formatBytes(totalBytes)}</strong> Used
            </span>
          </div>

          <Button
            id="btn-refresh-docs"
            variant="outline"
            size="sm"
            onClick={fetchDocs}
            className="h-8 text-xs"
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Drag & Drop Upload Zone ──────────────────────── */}
      <div
        id="dropzone-upload"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 scale-[0.99]"
            : "border-border/80 bg-card/30 hover:border-primary/50 hover:bg-card/60"
        } p-8 text-center`}
      >
        <input
          ref={fileInputRef}
          id="file-upload-input"
          type="file"
          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
          onChange={onFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/20 text-primary shadow-sm">
            {isUploading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </div>

          <div>
            <h3 className="text-base font-medium text-foreground">
              {isUploading
                ? "Uploading document..."
                : "Drop your files here, or browse"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports PDF, DOCX, XLSX, CSV, and TXT up to 25MB
            </p>
          </div>

          {/* Upload button */}
          <Button
            id="btn-browse-file"
            type="button"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4 mr-2" />
                Select File
              </>
            )}
          </Button>

          {/* Progress bar */}
          {isUploading && (
            <div className="w-full max-w-xs mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Alerts: Error & Success ──────────────────────── */}
      {uploadError && (
        <div
          id="alert-upload-error"
          className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1">{uploadError}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadError(null)}
            className="h-7 text-xs hover:bg-destructive/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {uploadSuccess && (
        <div
          id="alert-upload-success"
          className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="flex-1">{uploadSuccess}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadSuccess(null)}
            className="h-7 text-xs hover:bg-emerald-500/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* ── Documents Table Section ──────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Uploaded Documents
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {filteredDocs.length}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="input-search-docs"
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-medium text-foreground">
              {searchQuery ? "No matching documents found" : "No documents yet"}
            </h3>
            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
              {searchQuery
                ? `No documents matched "${searchQuery}". Try a different search query.`
                : "Upload your business spreadsheets, reports, or PDF manuals above to start chatting with your AI assistant."}
            </p>
            {!searchQuery && (
              <Button
                id="btn-empty-upload"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            )}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Uploaded</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    id={`doc-row-${doc.id}`}
                    className="transition-colors hover:bg-muted/20"
                  >
                    {/* Document filename & icon */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.file_type)}
                        <div className="min-w-0 max-w-xs sm:max-w-md">
                          <p className="truncate text-xs font-medium text-foreground">
                            {doc.filename}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            ID: {doc.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* File extension badge */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                        {doc.file_type}
                      </span>
                    </td>

                    {/* File Size */}
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {formatBytes(doc.file_size)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5">
                      {doc.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Ready
                        </span>
                      ) : doc.status === "processing" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Processing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </span>
                      )}
                    </td>

                    {/* Upload Date */}
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(doc.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 text-xs text-muted-foreground hover:text-primary"
                          title="Ask AI about this document"
                        >
                          <Link href="/chat">
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden lg:inline">Ask AI</span>
                          </Link>
                        </Button>

                        <Button
                          id={`btn-delete-doc-${doc.id}`}
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === doc.id}
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete document"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
