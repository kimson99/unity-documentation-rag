import { Skeleton } from '@/components/ui/skeleton';

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex flex-col gap-2 mt-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-5/6" />
          <Skeleton className="h-7 w-4/6" />
        </div>
        <div className="mt-auto">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="h-16 border-b border-border flex items-center px-4 gap-3">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
