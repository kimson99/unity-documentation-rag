import { client } from '@/api/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/providers/auth-provider';
import { useQuery } from '@tanstack/react-query';
import { DatabaseIcon, MessageSquareIcon } from 'lucide-react';
import { Link } from 'react-router';

export default function Home() {
  const { user } = useAuthContext();

  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['chatSessionsTotal'],
    queryFn: () =>
      client.api.chatSessionControllerGetSessionsByUserId({ take: 1, skip: 0 }),
  });

  const { data: indexingsData, isLoading: isLoadingIndexings } = useQuery({
    queryKey: ['indexingsTotal'],
    queryFn: () => client.api.indexingControllerGetStats(),
  });

  const totalSessions = sessionsData?.data?.total ?? 0;
  const completedFiles = indexingsData?.data?.completedFiles ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.displayName || 'User'}!
        </h1>
        <p className="text-muted-foreground">Unity Documentation RAG System</p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <DatabaseIcon className="w-4 h-4" /> Files Indexed
            </CardDescription>
            <CardTitle className="text-3xl">
              {isLoadingIndexings ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                completedFiles
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <MessageSquareIcon className="w-4 h-4" /> Chat Sessions
            </CardDescription>
            <CardTitle className="text-3xl">
              {isLoadingSessions ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                totalSessions
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/chat">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <MessageSquareIcon className="w-8 h-8 mb-2" />
              <CardTitle>Chat Assistant</CardTitle>
              <CardDescription>
                Ask questions about Unity documentation
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/indexing">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <DatabaseIcon className="w-8 h-8 mb-2" />
              <CardTitle>Indexing</CardTitle>
              <CardDescription>Index files into knowledge base</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About This System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This is a Retrieval-Augmented Generation (RAG) system for Unity
            documentation.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Upload Unity documentation files (.txt, .html, .md)</li>
            <li>Index files into a vector database for semantic search</li>
            <li>
              Ask questions and get AI-powered answers based on the
              documentation
            </li>
            <li>Powered by Google Gemini 2.5 Flash and PGVector</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
