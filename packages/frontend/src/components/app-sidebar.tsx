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
import { useAuthContext } from '@/providers/auth-provider';
import { useQuery } from '@tanstack/react-query';
import {
  BrainCogIcon,
  DatabaseIcon,
  HomeIcon,
  MessageCircleIcon,
} from 'lucide-react';
import { useLocation } from 'react-router';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext();
  const location = useLocation();
  const { open } = useSidebar();

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
            <h2 className="text-lg font-semibold flex gap-2 items-center">
              <BrainCogIcon />
              <span>Unity RAG</span>
            </h2>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
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
