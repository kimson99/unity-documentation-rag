import { client } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

type UploadedFile = { id: string; filename: string; key: string };
type IndexingStatus = Record<string, 'idle' | 'in-progress' | 'completed' | 'failed'>;

const statusBadge = (status: IndexingStatus[string]) => {
  const styles: Record<string, string> = {
    idle: 'bg-gray-100 text-gray-600',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status]}`}>
      {status}
    </span>
  );
};

export default function Files() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [indexingStatus, setIndexingStatus] = useState<IndexingStatus>({});
  const [documentIndexingId, setDocumentIndexingId] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      return client.instance.post('/api/files/upload', formData);
    },
    onSuccess: (response) => {
      toast.success('Files uploaded successfully!');
      const newFiles: UploadedFile[] = response.data?.files ?? [];
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setCheckedIds((prev) => {
        const next = new Set(prev);
        newFiles.forEach((f) => next.add(f.id));
        return next;
      });
      setIndexingStatus((prev) => {
        const next = { ...prev };
        newFiles.forEach((f) => { next[f.id] = 'idle'; });
        return next;
      });
      setSelectedFiles(null);
    },
    onError: (error) => toast.error(`Upload failed: ${error.message}`),
  });

  const indexMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      return client.api.indexingControllerIndex({ fileIds });
    },
    onSuccess: (response) => {
      toast.success('Indexing started!');
      const id = response.data?.documentIndexingId;
      if (id) setDocumentIndexingId(id);
      checkedIds.forEach((id) =>
        setIndexingStatus((prev) => ({ ...prev, [id]: 'in-progress' }))
      );
    },
    onError: (error) => toast.error(`Indexing failed: ${error.message}`),
  });

  useQuery({
    queryKey: ['indexingStatus', documentIndexingId],
    queryFn: async () => {
      const res = await client.api.indexingControllerGetDocumentIndexing(documentIndexingId!);
      const fileIndexings = res.data?.fileIndexings ?? [];
      setIndexingStatus((prev) => {
        const next = { ...prev };
        fileIndexings.forEach((fi) => { next[fi.fileId] = fi.status as IndexingStatus[string]; });
        return next;
      });
      return res;
    },
    enabled: !!documentIndexingId,
    refetchInterval: (query) => {
      const fileIndexings = query.state.data?.data?.fileIndexings ?? [];
      const allDone = fileIndexings.every(
        (fi) => fi.status === 'completed' || fi.status === 'failed'
      );
      return allDone ? false : 3000;
    },
  });

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleUpload = () => {
    if (selectedFiles && selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    } else {
      toast.error('Please select files to upload');
    }
  };

  const handleIndex = () => {
    const ids = Array.from(checkedIds);
    if (ids.length === 0) {
      toast.error('Please select at least one file to index');
      return;
    }
    indexMutation.mutate(ids);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">File Management</h1>
        <p className="text-muted-foreground">Upload and index Unity documentation files</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>Upload .txt, .html, .md, or .pdf files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="file"
              multiple
              accept=".txt,.html,.md,.pdf"
              onChange={(e) => e.target.files && setSelectedFiles(e.target.files)}
              disabled={uploadMutation.isPending}
            />
            <Button onClick={handleUpload} disabled={uploadMutation.isPending || !selectedFiles}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          {selectedFiles && (
            <p className="text-sm text-muted-foreground">{selectedFiles.length} file(s) selected</p>
          )}
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>Select files to index into the knowledge base</CardDescription>
            </div>
            <Button
              onClick={handleIndex}
              disabled={indexMutation.isPending || checkedIds.size === 0}
            >
              {indexMutation.isPending ? 'Indexing...' : `Index Selected (${checkedIds.size})`}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/40"
                  onClick={() => toggleCheck(file.id)}
                >
                  <input
                    type="checkbox"
                    checked={checkedIds.has(file.id)}
                    onChange={() => toggleCheck(file.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4"
                  />
                  <span className="text-sm flex-1">{file.filename}</span>
                  {statusBadge(indexingStatus[file.id] ?? 'idle')}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
