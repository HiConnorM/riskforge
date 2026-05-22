import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('shimmer rounded-md bg-white/[0.05]', className)}
    />
  )
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('card-base rounded-xl p-5', className)}>
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-10 w-24 mb-2" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="card-base rounded-xl p-5 h-64">
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
        <CardSkeleton />
      </div>
    </div>
  )
}
