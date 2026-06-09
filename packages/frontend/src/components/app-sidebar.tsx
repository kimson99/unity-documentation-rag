'use client';

import * as React from 'react';

import { client } from '@/api/client';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import useChatSession from '@/hooks/stores/use-chat-session';
import { useAuthContext } from '@/providers/auth-provider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BrainCogIcon,
  DatabaseIcon,
  HomeIcon,
  MessageCircleIcon,
  SquarePenIcon,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Separator } from './ui/separator';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext();
  const location = useLocation();
  const { open } = useSidebar();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setChatSession } = useChatSession();

  const { data: chatSessions } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      const data = await client.api.chatSessionControllerGetSessionsByUserId({
        take: 50,
        skip: 0,
      });
      return data;
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      await client.api.chatSessionControllerDeleteSession(sessionId);
      return sessionId;
    },
    onSuccess: (sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      // If the deleted session is the one currently open, leave it.
      if (searchParams.get('sessionId') === sessionId) {
        setChatSession(null);
        navigate('/chat');
      }
    },
  });

  const handleDeleteSession = (sessionId: string) => {
    if (deleteSession.isPending) return;
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    deleteSession.mutate(sessionId);
  };

  const navItems = React.useMemo(() => {
    const pathname = location.pathname;
    const sessions = chatSessions?.data?.sessions ?? [];

    return [
      {
        title: 'Home',
        url: '/',
        icon: <HomeIcon className="h-4 w-4" />,
        isActive: pathname === '/',
      },
      {
        title: 'Indexing',
        url: '/indexing',
        icon: <DatabaseIcon className="h-4 w-4" />,
        isActive: pathname.startsWith('/indexing'),
      },
      {
        title: 'New Chat',
        url: '/chat',
        icon: <SquarePenIcon className="h-4 w-4" />,
        isActive: pathname === '/chat',
      },
      {
        title: 'Chat',
        url: '/chat',
        icon: <MessageCircleIcon className="h-4 w-4" />,
        isActive: pathname.startsWith('/chat'),
        items: sessions.map((session) => ({
          id: session.id,
          title: session.title || 'Untitled Chat',
          url: `/chat?sessionId=${session.id}`,
        })),
      },
    ];
  }, [chatSessions?.data?.sessions, location.pathname]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-4 py-2">
          {open && (
            <div className="text-lg font-semibold flex gap-2 items-center text-sidebar-foreground">
              <BrainCogIcon />
              <span>Unity RAG</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <Separator orientation="horizontal" />
      <SidebarContent>
        <NavMain items={navItems} onDeleteItem={handleDeleteSession} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            user
              ? user
              : {
                  displayName: 'N/A',
                  email: 'N/A',
                  id: 'N/A',
                  role: 'N/A',
                }
          }
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
