import { client } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Indexing() {
  const [fileIds, setFileIds] = useState<string>('');
  const [documentIndexingId, setDocumentIndexingId] = useState<string>('');

  const indexMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return client.api.indexingControllerIndex({ fileIds: ids });
    },
    onSuccess: (response) => {
      toast.success('Indexing job queued successfully!');
      if (response.data?.documentIndexingId) {
        setDocumentIndexingId(response.data.documentIndexingId);
      }
    },
    onError: (error) => {
      toast.error(`Indexing failed: ${error.message}`);
    },
  });

  const { data: indexingStatus, refetch } = useQuery({
    queryKey: ['indexingStatus', documentIndexingId],
    queryFn: async () => {
      if (!documentIndexingId) return null;
      return client.api.indexingControllerGetDocumentIndexing(documentIndexingId);
    },
    enabled: !!documentIndexingId,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const handleStartIndexing = () => {
    const ids = fileIds.split(',').map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      toast.error('Please enter at least one file ID');
      return;
    }
    indexMutation.mutate(ids);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      case 'IN_PROGRESS':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Indexing Management</h1>
        <p className="text-muted-foreground">Index uploaded files into the vector database</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start Indexing</CardTitle>
          <CardDescription>
            Enter file IDs (comma-separated) to index into the knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="e.g., file-id-1, file-id-2, file-id-3"
              value={fileIds}
              onChange={(e) => setFileIds(e.target.value)}
              disabled={indexMutation.isPending}
            />
            <Button
              onClick={handleStartIndexing}
              disabled={indexMutation.isPending}
            >
              {indexMutation.isPending ? 'Starting...' : 'Start Indexing'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {documentIndexingId && (
        <Card>
          <CardHeader>
            <CardTitle>Indexing Status</CardTitle>
            <CardDescription>Document Indexing ID: {documentIndexingId}</CardDescription>
          </CardHeader>
          <CardContent>
            {indexingStatus?.data ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall Status:</span>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Refresh
                  </Button>
                </div>
                
                {indexingStatus.data.fileIndexings && indexingStatus.data.fileIndexings.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="font-medium">File Indexing Progress:</h3>
                    {indexingStatus.data.fileIndexings.map((fileIndexing: any) => (
                      <div
                        key={fileIndexing.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span className="text-sm">File ID: {fileIndexing.fileId}</span>
                        <span className={`text-sm font-medium ${getStatusColor(fileIndexing.status)}`}>
                          {fileIndexing.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No file indexing records found</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading status...</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
