/** Consistent loading vs empty vs error for React Query + auth gate. */
export function shouldShowQuerySkeleton(
  authReady: boolean,
  query: {
    isPending?: boolean
    isFetching?: boolean
    isLoading?: boolean
    isError?: boolean
    data?: unknown
  }
): boolean {
  if (!authReady) return false
  if (query.isError) return false
  if (query.data !== undefined && query.data !== null) return false
  return Boolean(query.isPending || query.isFetching || query.isLoading)
}
