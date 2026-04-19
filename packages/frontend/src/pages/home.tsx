import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/providers/auth-provider';
import { FileTextIcon, MessageSquareIcon, DatabaseIcon } from 'lucide-react';
import { Link } from 'react-router';

export default function Home() {
  const { user } = useAuthContext();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.displayName || 'User'}!</h1>
        <p className="text-muted-foreground">Unity Documentation RAG System</p>
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

        <Link to="/files">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <FileTextIcon className="w-8 h-8 mb-2" />
              <CardTitle>File Management</CardTitle>
              <CardDescription>
                Upload Unity documentation files
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/indexing">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <DatabaseIcon className="w-8 h-8 mb-2" />
              <CardTitle>Indexing</CardTitle>
              <CardDescription>
                Index files into knowledge base
              </CardDescription>
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
            This is a Retrieval-Augmented Generation (RAG) system for Unity documentation.
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Upload Unity documentation files (.txt, .html, .md)</li>
            <li>Index files into a vector database for semantic search</li>
            <li>Ask questions and get AI-powered answers based on the documentation</li>
            <li>Powered by Google Gemini 2.5 Flash and PGVector</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
