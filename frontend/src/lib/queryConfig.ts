/** Data dianggap segar selama 5 menit — tanpa polling / refetch otomatis. */
export const QUERY_STALE_MS = 5 * 60 * 1000

export const cachedQueryOptions = {
  staleTime: QUERY_STALE_MS,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
} as const
