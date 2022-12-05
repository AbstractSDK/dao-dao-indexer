import { Formula } from '../types'

type CreationPolicy =
  | {
      Anyone: {}
    }
  | {
      Module: {
        addr: string
      }
    }

export const creationPolicy: Formula<CreationPolicy> = async ({
  contractAddress,
  get,
}) => await get(contractAddress, 'creation_policy')

export const proposalCount: Formula<number> = async ({
  contractAddress,
  get,
}) =>
  // V1 may have no proposal_count set, so default to 0.
  (await get(contractAddress, 'proposal_count')) ?? 0