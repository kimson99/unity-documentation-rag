import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useLayoutStore } from '@/hooks/stores/use-layout-store';
import { Outlet } from 'react-router';

export default function MainLayout() {
  const headerTitle = useLayoutStore((state) => state.headerTitle);
  return (
    <SidebarProvider>
      <AppSidebar side="left" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div>
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="text-sm font-medium truncate">{headerTitle}</div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
