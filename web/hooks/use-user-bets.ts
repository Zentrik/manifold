import { useQueryClient } from 'react-query'
import { useFirestoreQueryData } from '@react-query-firebase/firestore'
import { useEffect, useState } from 'react'
import {
  Bet,
  USER_BET_FILTER,
  getSwipes,
  getBetsQuery,
  listBets,
  listenForBets,
} from 'web/lib/firebase/bets'
import { MINUTE_MS, sleep } from 'common/util/time'
import { useUser } from './use-user'
import { inMemoryStore, usePersistentState } from './use-persistent-state'

export const usePrefetchUserBets = (userId: string) => {
  const queryClient = useQueryClient()
  return queryClient.prefetchQuery(
    ['bets', userId],
    () => sleep(1000).then(() => listBets({ userId, ...USER_BET_FILTER })),
    { staleTime: 15 * MINUTE_MS }
  )
}

export const useUserBets = (userId: string) => {
  const result = useFirestoreQueryData(
    ['bets', userId],
    getBetsQuery({ userId, ...USER_BET_FILTER })
  )
  return result.data
}

export const useUserContractBets = (
  userId: string | undefined,
  contractId: string | undefined
) => {
  const [bets, setBets] = useState<Bet[] | undefined>(undefined)

  useEffect(() => {
    if (userId && contractId)
      return listenForBets(setBets, {
        contractId: contractId,
        userId: userId,
      })
  }, [userId, contractId])

  return bets
}

export const useGetUserBetContractIds = (userId: string | undefined) => {
  const [contractIds, setContractIds] = useState<string[] | undefined>()

  useEffect(() => {
    if (userId) {
      const key = `user-bet-contractIds-${userId}`
      const userBetContractJson = localStorage.getItem(key)
      if (userBetContractJson) {
        setContractIds(JSON.parse(userBetContractJson))
      }
    }
  }, [userId])

  return contractIds
}

export const useUserSwipes = () => {
  const user = useUser()
  const [swipes, setSwipes] = usePersistentState<string[]>([], {
    store: inMemoryStore(),
    key: 'user-swipes',
  })
  useEffect(() => {
    if (user)
      getSwipes(user.id).then((s) => setSwipes(s.map((swipe: any) => swipe.id)))
  }, [user, setSwipes])
  return swipes
}
