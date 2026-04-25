import { client } from '@/api/client';
import type { DocumentIndexingDto, FileDto } from '@/api/sdk';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileTextIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router';
import { toast } from 'sonner';

function NewIndexDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileDto[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const resetState = () => {
    setUploadedFiles([]);
    setCheckedIds(new Set());
  };

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      return client.instance.post('/api/files/upload', formData);
    },
    onSuccess: (response) => {
      toast.success('Files uploaded!');
      const newFiles: FileDto[] = response.data?.files ?? [];
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setCheckedIds((prev) => {
        const next = new Set(prev);
        newFiles.forEach((f) => next.add(f.id));
        return next;
      });
    },
    onError: (error: Error) => toast.error(`Upload failed: ${error.message}`),
  });

  const indexMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      return client.api.indexingControllerIndex({ fileIds });
    },
    onSuccess: () => {
      toast.success('Indexing started!');
      setOpen(false);
      resetState();
      onSuccess();
    },
    onError: (error: Error) => toast.error(`Indexing failed: ${error.message}`),
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'text/html': ['.html'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
    },
    onDrop: (files) => {
      if (files.length > 0) uploadMutation.mutate(files);
    },
    disabled: uploadMutation.isPending,
  });

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleIndex = () => {
    const ids = Array.from(checkedIds);
    if (ids.length === 0) {
      toast.error('Select at least one file to index');
      return;
    }
    indexMutation.mutate(ids);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetState();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Index
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Indexing Job</DialogTitle>
          <DialogDescription>
            Upload files and select which ones to add to the knowledge base.
          </DialogDescription>
        </DialogHeader>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            uploadMutation.isPending
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          } ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          {uploadMutation.isPending ? (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-primary">Drop files here</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drag & drop files, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                .txt · .html · .md · .pdf
              </p>
            </div>
          )}
        </div>

        {/* File list */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 px-3 py-2 border rounded-lg cursor-pointer hover:bg-muted/40"
                onClick={() => toggleCheck(file.id)}
              >
                <input
                  type="checkbox"
                  checked={checkedIds.has(file.id)}
                  onChange={() => toggleCheck(file.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 shrink-0"
                />
                <span className="text-sm flex-1 truncate">{file.filename}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={indexMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleIndex}
            disabled={indexMutation.isPending || checkedIds.size === 0}
          >
            {indexMutation.isPending
              ? 'Starting...'
              : `Start Indexing (${checkedIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function IndexingPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['documentIndexings', pageIndex, pageSize],
    queryFn: async () => {
      const response = await client.api.indexingControllerGetDocumentIndexings({
        skip: pageIndex * pageSize,
        take: pageSize,
      });
      return response.data;
    },
  });

  const refreshHistory = () => {
    queryClient.invalidateQueries({ queryKey: ['documentIndexings'] });
  };

  const totalRecords = data?.total ?? 0;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const jobs = data?.documentIndexings ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Indexing</h1>
          <p className="text-muted-foreground mt-1">
            Manage indexing jobs for Unity documentation files
          </p>
        </div>
        <NewIndexDialog onSuccess={refreshHistory} />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Files</TableHead>
              <TableHead>Date Started</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  Loading jobs...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-red-500"
                >
                  Failed to load indexing history.
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileTextIcon className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No indexing jobs yet</p>
                    <p className="text-xs">Click "New Index" to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job: DocumentIndexingDto) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {job.id?.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-sm">
                    {job.fileCount} file{job.fileCount !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="text-sm">
                    {job.createdAt
                      ? format(new Date(job.createdAt), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/indexing/${job.id}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalRecords > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing <strong>{pageIndex * pageSize + 1}</strong>–
            <strong>
              {Math.min((pageIndex + 1) * pageSize, totalRecords)}
            </strong>{' '}
            of <strong>{totalRecords}</strong>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
              disabled={pageIndex === 0 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm font-medium">
              {pageIndex + 1} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPageIndex((p) => (p + 1 < totalPages ? p + 1 : p))
              }
              disabled={pageIndex + 1 >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
