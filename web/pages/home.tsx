import React, { useEffect, useState } from 'react'
import Router from 'next/router'

import { Page } from 'web/components/page'
import { Col } from 'web/components/layout/col'
import { useUser } from 'web/hooks/use-user'
import { ContractSearch } from 'web/components/contract-search'
import { Contract } from 'common/contract'
import { ContractPageContent } from './[username]/[contractSlug]'
import { getContractFromSlug } from 'web/lib/firebase/contracts'

const Home = () => {
  const user = useUser()

  const [contract, setContract] = useState<Contract | undefined>()

  useEffect(() => {
    const onBack = () => {
      const path = location.pathname.split('/').slice(1)
      if (path[0] === 'home') setContract(undefined)
      else {
        const [username, contractSlug] = path
        if (!username || !contractSlug) setContract(undefined)
        else {
          // Show contract if route is to a contract: '/[username]/[contractSlug]'.
          getContractFromSlug(contractSlug).then(setContract)
        }
      }
    }

    window.addEventListener('popstate', onBack)
    return () => window.removeEventListener('popstate', onBack)
  }, [])

  useEffect(() => {
    if (contract) window.scrollTo(0, 0)
  }, [contract])

  if (user === null) {
    Router.replace('/')
    return <></>
  }

  return (
    <>
      <Page assertUser="signed-in" suspend={!!contract}>
        <Col className="mx-auto w-full p-2">
          <ContractSearch
            querySortOptions={{
              shouldLoadFromStorage: true,
              defaultSort: '24-hour-vol',
            }}
            showCategorySelector
            onContractClick={(c) => {
              // Show contract without navigating to contract page.
              setContract(c)
              // Update the url without switching pages in Nextjs.
              history.pushState(null, '', `/${c.creatorUsername}/${c.slug}`)
            }}
          />
        </Col>
      </Page>

      {contract && (
        <ContractPageContent
          contract={contract}
          username={contract.creatorUsername}
          slug={contract.slug}
          bets={[]}
          comments={[]}
          backToHome={() => {
            history.back()
          }}
        />
      )}
    </>
  )
}

export default Home
