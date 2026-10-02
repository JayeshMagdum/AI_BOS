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
  MessageSquare,
  RefreshCw,
  HardDrive,
  File,
  Eye,
  Download,
  Layers,
  X,
  Database,
  Copy,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DocumentItem,
  getDocuments,
  uploadDocument,
  deleteDocument,
  retryDocument,
  getDocumentPreview,
  getDocumentDownloadUrl,
  downloadDocumentFile,
  DocumentPreviewResponse,
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
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"text" | "chunks">("text");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenPreview = async (docId: string) => {
    try {
      setLoadingPreviewId(docId);
      const data = await getDocumentPreview(docId);
      setPreviewDoc(data);
      setIsPreviewOpen(true);
      setPreviewTab("text");
    } catch (err) {
      console.error("Failed to load document preview:", err);
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleDownload = async (docId: string, filename: string) => {
    try {
      setDownloadingId(docId);
      await downloadDocumentFile(docId, filename);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.detail : "Failed to download file";
      setUploadError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRetry = async (docId: string) => {
    try {
      setRetryingId(docId);
      await retryDocument(docId);
      setUploadSuccess("Document is queued for retry.");
      fetchDocs();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.detail : "Failed to retry document processing";
      setUploadError(msg);
    } finally {
      setRetryingId(null);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

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

  // Poll for processing documents
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing" || doc.status === "pending");
    if (!hasProcessing) return;

    const intervalId = setInterval(() => {
      fetchDocs();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [documents, fetchDocs]);

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
          <div className="flex items-center gap-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-black/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-xl shadow-sm">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>
              <strong className="text-foreground">{documents.length}</strong> Document
              {documents.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-black/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-xl shadow-sm">
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
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-ios-spring ${
          isDragging
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 scale-[0.98]"
            : "border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 hover:border-primary/50 hover:bg-white/80 dark:hover:bg-white/5 backdrop-blur-md shadow-sm"
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
      <div className="rounded-3xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-2xl shadow-ios dark:shadow-ios-dark overflow-hidden">
        {/* Table header bar */}
        <div className="flex flex-col gap-3 border-b border-black/5 dark:border-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
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
              className="h-9 w-full rounded-full border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 shadow-inner"
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
                    className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
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
                        <span 
                          className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20"
                          title={doc.error_message || "Processing failed"}
                        >
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
                        {doc.status === "failed" && (
                          <Button
                            id={`btn-retry-doc-${doc.id}`}
                            variant="ghost"
                            size="sm"
                            disabled={retryingId === doc.id}
                            onClick={() => handleRetry(doc.id)}
                            className="h-8 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                            title="Retry processing"
                          >
                            {retryingId === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1 hidden md:inline">Retry</span>
                          </Button>
                        )}

                        <Button
                          id={`btn-preview-doc-${doc.id}`}
                          variant="ghost"
                          size="sm"
                          disabled={loadingPreviewId === doc.id}
                          onClick={() => handleOpenPreview(doc.id)}
                          className="h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Preview document & chunks"
                        >
                          {loadingPreviewId === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          <span className="ml-1 hidden md:inline">Preview</span>
                        </Button>

                        <Button
                          id={`btn-download-doc-${doc.id}`}
                          variant="ghost"
                          size="sm"
                          disabled={downloadingId === doc.id}
                          onClick={() => handleDownload(doc.id, doc.filename)}
                          className="h-8 text-xs text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                          title="Download original file"
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 text-xs text-muted-foreground hover:text-primary"
                          title="Ask AI about this document"
                        >
                          <Link href={`/chat?doc=${doc.id}`}>
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
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

      {/* ── Document Preview Modal ──────────────────────── */}
      {isPreviewOpen && previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-xl animate-in fade-in-0 duration-300">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[85vh] rounded-3xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-3xl shadow-ios dark:shadow-ios-dark overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 px-6 py-4 bg-transparent">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(previewDoc.file_type)}
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground truncate">
                    {previewDoc.filename}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="uppercase font-medium px-1.5 py-0.2 rounded bg-secondary text-foreground text-[10px]">
                      {previewDoc.file_type}
                    </span>
                    <span>•</span>
                    <span>{formatBytes(previewDoc.file_size)}</span>
                    <span>•</span>
                    <span>{formatDate(previewDoc.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(previewDoc.id, previewDoc.filename)}
                  className="h-8 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewOpen(false)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b border-border bg-muted/10 text-center">
              <div className="rounded-lg bg-background/50 p-2 border border-border/50">
                <p className="text-[11px] text-muted-foreground">Vector Points</p>
                <p className="text-sm font-semibold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                  <Database className="h-3.5 w-3.5" />
                  {previewDoc.vector_count}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 p-2 border border-border/50">
                <p className="text-[11px] text-muted-foreground">Total Chunks</p>
                <p className="text-sm font-semibold text-primary mt-0.5 flex items-center justify-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {previewDoc.chunk_count}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 p-2 border border-border/50">
                <p className="text-[11px] text-muted-foreground">Word Count</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {previewDoc.word_count.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 p-2 border border-border/50">
                <p className="text-[11px] text-muted-foreground">Characters</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {previewDoc.char_count.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Tabs Bar */}
            <div className="flex items-center justify-between border-b border-border px-6 py-2 bg-muted/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTab("text")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    previewTab === "text"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Extracted Text
                </button>
                <button
                  onClick={() => setPreviewTab("chunks")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    previewTab === "chunks"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Indexed Chunks ({previewDoc.chunks_preview?.length || 0})
                </button>
              </div>

              {previewTab === "text" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyText(previewDoc.text_preview)}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  {copiedPreview ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Text
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-6 max-h-[50vh]">
              {previewTab === "text" ? (
                <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap break-words leading-relaxed rounded-xl bg-muted/30 p-4 border border-border/60">
                  {previewDoc.text_preview || "No extracted text preview available for this document."}
                </pre>
              ) : (
                <div className="space-y-3">
                  {previewDoc.chunks_preview && previewDoc.chunks_preview.length > 0 ? (
                    previewDoc.chunks_preview.map((chunk) => (
                      <div
                        key={chunk.chunk_index}
                        className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-medium text-primary">
                            Chunk #{chunk.chunk_index + 1}
                          </span>
                          <span>{chunk.word_count} words</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap">
                          {chunk.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No chunks indexed yet for this document.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-xs"
              >
                <Link href={`/chat?doc=${previewDoc.id}`}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1 text-primary" />
                  Chat with this Document
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
