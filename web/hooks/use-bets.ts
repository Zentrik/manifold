import { useEffect, useState } from 'react'
import { Contract } from 'common/contract'
import {
  Bet,
  BetFilter,
  listenForBets,
  listenForLiveBets,
  listenForRecentBets,
  listenForUnfilledBets,
  withoutAnteBets,
} from 'web/lib/firebase/bets'
import { LimitBet } from 'common/bet'
import { inMemoryStore, usePersistentState } from './use-persistent-state'
import { useEffectCheckEquality } from 'web/hooks/use-effect-check-equality'
import { useUsersById } from './use-user'
import { uniq } from 'lodash'
import { filterDefined } from 'common/util/array'

export const useBets = (options?: BetFilter) => {
  const [bets, setBets] = useState<Bet[] | undefined>()
  useEffectCheckEquality(() => {
    return listenForBets((bets) => {
      setBets(bets.sort((b) => b.createdTime))
    }, options)
  }, [options])

  return bets
}

export const useBetsWithoutAntes = (contract: Contract, initialBets: Bet[]) => {
  const [bets, setBets] = useState<Bet[]>(
    withoutAnteBets(contract, initialBets)
  )
  useEffect(() => {
    return listenForBets(
      (bets) => {
        setBets(withoutAnteBets(contract, bets).sort((b) => b.createdTime))
      },
      { contractId: contract.id }
    )
  }, [contract])

  return bets
}

export const useRecentBets = () => {
  const [recentBets, setRecentBets] = useState<Bet[] | undefined>()
  useEffect(() => listenForRecentBets(setRecentBets), [])
  return recentBets
}

export const useUnfilledBets = (contractId: string) => {
  const [unfilledBets, setUnfilledBets] = useState<LimitBet[] | undefined>()
  useEffect(
    () => listenForUnfilledBets(contractId, setUnfilledBets),
    [contractId]
  )
  return unfilledBets
}

export const useUnfilledBetsAndBalanceByUserId = (contractId: string) => {
  const unfilledBets = useUnfilledBets(contractId) ?? []

  const userIds = uniq(unfilledBets.map((b) => b.userId))
  const users = filterDefined(useUsersById(userIds))

  const balanceByUserId = Object.fromEntries(
    users.map((user) => [user.id, user.balance])
  )
  return { unfilledBets, balanceByUserId }
}

export const useLiveBets = (count: number) => {
  const [bets, setBets] = usePersistentState<Bet[] | undefined>(undefined, {
    store: inMemoryStore(),
    key: `liveBets-${count}`,
  })

  useEffect(() => {
    return listenForLiveBets(count, setBets)
  }, [count, setBets])

  return bets
}
