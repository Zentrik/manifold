import { CertMintTxn, CertPayManaTxn, CertTransferTxn } from 'common/txn'
import { formatMoney } from 'common/util/format'
import * as admin from 'firebase-admin'

const firestore = admin.firestore()

// Note: this does NOT validate that the user has enough mana
export async function mintAndPoolCert(
  userId: string,
  certId: string,
  mintShares: number,
  poolShares: number
) {
  const batch = firestore.batch()
  const time = Date.now()

  // First, create one txn for minting the shares
  const ref1 = firestore.collection('txns').doc()
  const certMintTxn: CertMintTxn = {
    category: 'CERT_MINT',
    id: ref1.id,
    certId,
    createdTime: time,
    fromId: 'BANK',
    fromType: 'BANK',
    toId: userId,
    toType: 'USER',
    token: 'SHARE',
    amount: mintShares,
    description: `user/${userId} minted ${mintShares} shares`,
  }
  batch.set(ref1, certMintTxn)

  // Currently assumes that the pool is set up with equal shares and M$
  const poolMana = poolShares
  // Then, create two txns for setting up the pool at t=time+1
  const ref2 = firestore.collection('txns').doc()
  const certTransferTxn: CertTransferTxn = {
    category: 'CERT_TRANSFER',
    id: ref2.id,
    certId,
    createdTime: time + 1,
    fromId: userId,
    fromType: 'USER',
    toId: certId,
    toType: 'CONTRACT',
    token: 'SHARE',
    amount: poolShares,
    description: `user/${userId} added ${poolShares} shares to pool`,
  }
  batch.set(ref2, certTransferTxn)

  const ref3 = firestore.collection('txns').doc()
  const certPayManaTxn: CertPayManaTxn = {
    category: 'CERT_PAY_MANA',
    id: ref3.id,
    certId,
    createdTime: time + 1,
    fromId: userId,
    fromType: 'USER',
    toId: certId,
    toType: 'CONTRACT',
    token: 'M$',
    amount: poolMana,
    description: `user/${userId} added ${formatMoney(poolMana)} to pool`,
  }
  batch.set(ref3, certPayManaTxn)

  return await batch.commit()
}

// In a batch, add two txns for transferring a cert in exchange for mana
// TODO: Should we generate a "betId" representing this transaction?
export function buyFromPool(
  userId: string,
  certId: string,
  shares: number,
  mana: number,
  transaction: admin.firestore.Transaction
) {
  const time = Date.now()

  // First, create one txn for transferring the shares
  const ref1 = firestore.collection('txns').doc()
  const certTransferTxn: CertTransferTxn = {
    category: 'CERT_TRANSFER',
    id: ref1.id,
    certId,
    createdTime: time,
    fromId: certId,
    fromType: 'CONTRACT',
    toId: userId,
    toType: 'USER',
    token: 'SHARE',
    amount: shares,
    description: `user/${userId} bought ${shares} shares from pool`,
  }
  transaction.set(ref1, certTransferTxn)

  // Then, create one txn for transferring the mana
  const ref2 = firestore.collection('txns').doc()
  const certPayManaTxn: CertPayManaTxn = {
    category: 'CERT_PAY_MANA',
    id: ref2.id,
    certId,
    createdTime: time,
    fromId: userId,
    fromType: 'USER',
    toId: certId,
    toType: 'CONTRACT',
    token: 'M$',
    amount: mana,
    description: `user/${userId} paid ${formatMoney(mana)} to pool`,
  }
  transaction.set(ref2, certPayManaTxn)
}
