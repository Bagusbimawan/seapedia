import type { QueryClient } from '@tanstack/react-query'
import { getTransactions } from '@/lib/api/wallet'
import { getScopedQueryKey } from '@/lib/queryKeys'
import type { Wallet } from '@/types'

export function syncBuyerWalletCache(queryClient: QueryClient, wallet: Wallet | undefined) {
  if (!wallet) return
  queryClient.setQueryData(getScopedQueryKey('buyer-wallet'), wallet)
}

export async function refreshBuyerWalletCache(queryClient: QueryClient) {
  const walletKey = getScopedQueryKey('buyer-wallet')
  const txsKey = getScopedQueryKey('buyer-wallet-txs')
  await queryClient.invalidateQueries({ queryKey: walletKey })
  await queryClient.invalidateQueries({ queryKey: txsKey })
  const txsRes = await getTransactions({ limit: 50 })
  queryClient.setQueryData(txsKey, txsRes.data.data)
}
