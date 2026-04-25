import { client } from '@/api/client';
import type { FileIndexingDto } from '@/api/sdk';
import { FileIndexingStatus } from '@/api/sdk';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeftIcon, FileTextIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

const STATUS_STYLES: Record<FileIndexingStatus, string> = {
  [FileIndexingStatus.InProgress]: 'bg-yellow-100 text-yellow-700',
  [FileIndexingStatus.Completed]: 'bg-green-100 text-green-700',
  [FileIndexingStatus.Failed]: 'bg-red-100 text-red-700',
};

function StatusPill({ status }: { status: FileIndexingStatus }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  );
}

export default function IndexingDetailPage() {
  const { documentIndexingId } = useParams<{ documentIndexingId: string }>();
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['indexingFiles', documentIndexingId, pageIndex, pageSize],
    queryFn: async () => {
      const res = await client.api.indexingControllerGetIndexingFiles(
        documentIndexingId!,
        { skip: pageIndex * pageSize, take: pageSize },
      );
      return res.data;
    },
    enabled: !!documentIndexingId,
  });

  const fileIndexings: FileIndexingDto[] = data?.fileIndexings ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/indexing">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Indexing
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Indexing Job</h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">
          {documentIndexingId}
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-muted-foreground"
                >
                  Loading files...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-red-500"
                >
                  Failed to load files.
                </TableCell>
              </TableRow>
            ) : fileIndexings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileTextIcon className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No files found for this job.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              fileIndexings.map((fi: FileIndexingDto) => (
                <TableRow key={fi.id}>
                  <TableCell className="text-sm font-medium">
                    {fi.file.filename}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={fi.status} />
                  </TableCell>
                  <TableCell className="text-xs text-red-500 max-w-xs truncate">
                    {typeof fi.error == 'string' ? fi.error : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {fi.createdAt
                      ? format(new Date(fi.createdAt), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing <strong>{pageIndex * pageSize + 1}</strong>–
            <strong>{Math.min((pageIndex + 1) * pageSize, total)}</strong> of{' '}
            <strong>{total}</strong>
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
              {pageIndex + 1} / {totalPages}
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
