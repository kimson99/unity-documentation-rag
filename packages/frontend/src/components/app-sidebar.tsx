'use client';

import * as React from 'react';

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
import {
  HomeIcon,
  MessageCircleIcon,
  FileTextIcon,
  DatabaseIcon,
} from 'lucide-react';

const navItems = [
  {
    title: 'Home',
    url: '/',
    icon: <HomeIcon />,
    isActive: true,
  },
  {
    title: 'Chat',
    url: '/chat',
    icon: <MessageCircleIcon />,
    isActive: true,
  },
  {
    title: 'Files',
    url: '/files',
    icon: <FileTextIcon />,
    isActive: true,
  },
  {
    title: 'Indexing',
    url: '/indexing',
    icon: <DatabaseIcon />,
    isActive: true,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold">Unity RAG</h2>
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
