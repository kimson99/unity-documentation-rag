import { client } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Files() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ id: string; filename: string; key: string }>
  >([]);

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const fileArray = Array.from(files);
      return client.api.fileControllerUploadFile({ files: fileArray });
    },
    onSuccess: (response) => {
      toast.success('Files uploaded successfully!');
      const newFiles = response.data?.files ?? [];
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setSelectedFiles(null);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = () => {
    if (selectedFiles && selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    } else {
      toast.error('Please select files to upload');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">File Management</h1>
        <p className="text-muted-foreground">Upload Unity documentation files for indexing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload .txt, .html, or .md files containing Unity documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="file"
              multiple
              accept=".txt,.html,.md"
              onChange={handleFileChange}
              disabled={uploadMutation.isPending}
            />
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !selectedFiles}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          {selectedFiles && (
            <div className="text-sm text-muted-foreground">
              {selectedFiles.length} file(s) selected
            </div>
          )}
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>Files ready for indexing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm">{file.filename}</span>
                  <span className="text-xs text-muted-foreground">ID: {file.id}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
