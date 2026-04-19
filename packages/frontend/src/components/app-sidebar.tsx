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
} from '@/components/ui/sidebar';
import { useAuthContext } from '@/providers/auth-provider';
import { useQuery } from '@tanstack/react-query';
import { MessageCircleMore, TerminalSquareIcon } from 'lucide-react';
import { useMemo } from 'react';

const STATIC_DATA = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Functions',
      url: '#',
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [],
    },
    {
      title: 'Chats',
      url: '#',
      icon: <MessageCircleMore />,
      isActive: true,
      items: [],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext();
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

  const navigationData = useMemo(() => {
    return {
      ...STATIC_DATA,
      navMain: STATIC_DATA.navMain.map((navGroup) => {
        // Find the specific group you want to inject data into
        if (navGroup.title === 'Chats') {
          return {
            ...navGroup,
            items:
              chatSessions?.data?.sessions?.map((session) => ({
                id: session.id,
                title: session.title || 'Untitled Chat',
                url: `/chat?sessionId=${session.id}`,
              })) || [], // Defaults to empty array while loading
          };
        }
        return navGroup;
      }),
    };
  }, [chatSessions]);
  // console.log('navigationData', navigationData);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="font-semibold text-lg">Unity RAG</div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData.navMain} />
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
