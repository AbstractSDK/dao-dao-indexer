import { Formula } from '../../types'
import { info, instantiatedAt } from '../common'
import { balance } from '../external/cw20'
import { openProposals as multipleChoiceOpenProposals } from '../proposal/daoProposalMultiple'
import { openProposals as singleChoiceOpenProposals } from '../proposal/daoProposalSingle'
import { ProposalResponse } from '../proposal/types'
import { ContractInfo, Expiration } from '../types'
import { isExpirationExpired } from '../utils'
import {
  totalPower as daoVotingCw20StakedTotalPower,
  votingPower as daoVotingCw20StakedVotingPower,
} from '../voting/daoVotingCw20Staked'
import {
  totalPower as daoVotingCw4TotalPower,
  votingPower as daoVotingCw4VotingPower,
} from '../voting/daoVotingCw4'

interface Config {
  automatically_add_cw20s: boolean
  automatically_add_cw721s: boolean
  dao_uri?: string | null
  description: string
  image_url?: string | null
  name: string
}

interface ProposalModule {
  address: string
  prefix: string
  status: 'Enabled' | 'Disabled'
}

interface ProposalModuleWithInfo extends ProposalModule {
  info?: ContractInfo
}

type PausedResponse =
  | {
      Paused: {
        expiration: Expiration
      }
    }
  | {
      Unpaused: {}
    }

interface DumpState {
  // Same as contract query.
  admin?: string
  config?: Config
  version?: ContractInfo
  pause_info?: PausedResponse
  proposal_modules?: ProposalModuleWithInfo[]
  voting_module?: string
  active_proposal_module_count: number
  total_proposal_module_count: number
  // Extra.
  votingModuleInfo?: ContractInfo
  createdAt?: string
}

interface Cw20Balance {
  addr: string
  balance?: string
}

interface SubDao {
  addr: string
  charter?: string | null
}

interface InboxItem {
  proposalModuleAddress: string
  proposals: ProposalResponse<any>[]
}

export const config: Formula<Config | undefined> = async ({
  contractAddress,
  get,
}) =>
  (await get(contractAddress, 'config_v2')) ??
  (await get(contractAddress, 'config'))

export const proposalModules: Formula<
  ProposalModuleWithInfo[] | undefined
> = async (env) => {
  const { contractAddress, getMap } = env

  const proposalModules: ProposalModule[] = []

  // V2.
  const proposalModuleMap = await getMap<string, ProposalModule>(
    contractAddress,
    'proposal_modules_v2'
  )

  if (proposalModuleMap) {
    proposalModules.push(...Object.values(proposalModuleMap))
  }
  // V1.
  else {
    const proposalModuleAddresses = Object.keys(
      (await getMap<string, string>(contractAddress, 'proposal_modules')) ?? {}
    )
    proposalModules.push(
      ...proposalModuleAddresses.map((address) => ({
        address,
        // V1 modules don't have a prefix.
        prefix: '',
        // V1 modules are always enabled.
        status: 'Enabled' as const,
      }))
    )
  }

  // If no proposal modules, this must not be a DAO core contract.
  if (!proposalModules.length) {
    return undefined
  }

  return await Promise.all(
    proposalModules.map(async (data): Promise<ProposalModuleWithInfo> => {
      const contractInfo = await info({
        ...env,
        contractAddress: data.address,
      })

      return {
        ...data,
        info: contractInfo,
      }
    })
  )
}

export const activeProposalModules: Formula<
  ProposalModuleWithInfo[] | undefined
> = async (env) => {
  const modules = await proposalModules(env)
  return modules?.filter((module) => module.status === 'Enabled')
}

export const dumpState: Formula<DumpState | undefined> = async (env) => {
  const [
    adminResponse,
    configResponse,
    version,
    pause_info,
    proposal_modules,
    { address: voting_module, info: votingModuleInfo },
    activeProposalModuleCount,
    totalProposalModuleCount,
    createdAt,
  ] = await Promise.all([
    admin(env),
    config(env),
    info(env),
    paused(env),
    proposalModules(env),
    votingModule(env).then(async (contractAddress) => {
      const infoResponse = await info({
        ...env,
        contractAddress: contractAddress ?? '',
      })
      return {
        address: contractAddress,
        info: infoResponse,
      }
    }),
    // V2
    env.get<number | undefined>(
      env.contractAddress,
      'active_proposal_module_count'
    ),
    env.get<number | undefined>(
      env.contractAddress,
      'total_proposal_module_count'
    ),
    // Extra.
    instantiatedAt(env),
  ])

  // If no config, this must not be a DAO core contract.
  if (!configResponse) {
    return undefined
  }

  return {
    // Same as contract query.
    admin: adminResponse,
    config: configResponse,
    version,
    pause_info,
    proposal_modules,
    voting_module,
    // V1 doesn't have these counts; all proposal modules are active.
    active_proposal_module_count:
      activeProposalModuleCount ?? proposal_modules?.length ?? 0,
    total_proposal_module_count:
      totalProposalModuleCount ?? proposal_modules?.length ?? 0,
    // Extra.
    votingModuleInfo,
    createdAt,
  }
}

export const paused: Formula<PausedResponse> = async ({
  contractAddress,
  block,
  get,
}) => {
  const expiration = await get<Expiration | undefined>(
    contractAddress,
    'paused'
  )

  return !expiration || isExpirationExpired(expiration, block)
    ? { Unpaused: {} }
    : { Paused: { expiration } }
}

export const admin: Formula<string | undefined> = async ({
  contractAddress,
  get,
}) => await get<string>(contractAddress, 'admin')

export const adminNomination: Formula<string | undefined> = async ({
  contractAddress,
  get,
}) => await get<string>(contractAddress, 'nominated_admin')

export const votingModule: Formula<string | undefined> = async ({
  contractAddress,
  get,
}) => await get<string>(contractAddress, 'voting_module')

export const item: Formula<string | undefined, { key: string }> = async ({
  contractAddress,
  get,
  args: { key },
}) => await get<string | undefined>(contractAddress, 'items', key)

export const listItems: Formula<string[]> = async ({
  contractAddress,
  getMap,
}) => Object.keys((await getMap<string>(contractAddress, 'items')) ?? {})

export const cw20List: Formula<string[]> = async ({
  contractAddress,
  getMap,
}) => Object.keys((await getMap<string>(contractAddress, 'cw20s')) ?? {})

export const cw721List: Formula<string[]> = async ({
  contractAddress,
  getMap,
}) => Object.keys((await getMap<string>(contractAddress, 'cw721s')) ?? {})

export const cw20Balances: Formula<Cw20Balance[]> = async (env) => {
  const cw20Addresses = (await cw20List(env)) ?? []

  return await Promise.all(
    cw20Addresses.map(async (addr): Promise<Cw20Balance> => {
      const balanceResponse = await balance({
        ...env,
        contractAddress: addr,
        args: { address: env.contractAddress },
      })

      return {
        addr,
        balance: balanceResponse,
      }
    })
  )
}

export const listSubDaos: Formula<SubDao[]> = async ({
  contractAddress,
  getMap,
}) => {
  // V2. V1 doesn't have sub DAOs; use empty map if undefined.
  const subDaoMap =
    (await getMap<string, string | undefined>(contractAddress, 'sub_daos')) ??
    {}

  return Object.entries(subDaoMap).map(([addr, charter]) => ({
    addr,
    charter,
  }))
}

export const daoUri: Formula<string> = async (env) =>
  (await config(env))?.dao_uri ?? ''

export const votingPower: Formula<
  string | undefined,
  { address: string }
> = async (env) => {
  const votingModuleAddress = (await votingModule(env)) ?? ''
  const votingModuleInfo = await info({
    ...env,
    contractAddress: votingModuleAddress,
  })

  const votingPowerFormula =
    votingModuleInfo &&
    VOTING_POWER_MAP[votingModuleInfo.contract.replace('crates.io:', '')]
  return await votingPowerFormula?.({
    ...env,
    contractAddress: votingModuleAddress,
  })
}

export const totalPower: Formula<string | undefined> = async (env) => {
  const votingModuleAddress = (await votingModule(env)) ?? ''
  const votingModuleInfo = await info({
    ...env,
    contractAddress: votingModuleAddress,
  })

  const totalPowerFormula =
    votingModuleInfo &&
    TOTAL_POWER_MAP[votingModuleInfo.contract.replace('crates.io:', '')]
  return await totalPowerFormula?.({
    ...env,
    contractAddress: votingModuleAddress,
  })
}

// Map contract name to voting power formula.
const VOTING_POWER_MAP: Record<
  string,
  Formula<string, { address: string }> | undefined
> = {
  'cw4-voting': daoVotingCw4VotingPower,
  'cwd-voting-cw4': daoVotingCw4VotingPower,
  'dao-voting-cw4': daoVotingCw4VotingPower,
  'cw20-staked-balance-voting': daoVotingCw20StakedVotingPower,
  'cwd-voting-cw20-staked': daoVotingCw20StakedVotingPower,
  'dao-voting-cw20-staked': daoVotingCw20StakedVotingPower,
}

// Map contract name to total power formula.
const TOTAL_POWER_MAP: Record<string, Formula<string> | undefined> = {
  'cw4-voting': daoVotingCw4TotalPower,
  'cwd-voting-cw4': daoVotingCw4TotalPower,
  'dao-voting-cw4': daoVotingCw4TotalPower,
  'cw20-staked-balance-voting': daoVotingCw20StakedTotalPower,
  'cwd-voting-cw20-staked': daoVotingCw20StakedTotalPower,
  'dao-voting-cw20-staked': daoVotingCw20StakedTotalPower,
}

// Return open proposals without votes from the given address. If no address
// provided, just return open proposals.
export const openProposals: Formula<
  InboxItem[] | undefined,
  { address?: string }
> = async (env) => {
  const proposalModules = await activeProposalModules(env)

  if (!proposalModules) {
    return undefined
  }

  return (
    await Promise.all(
      proposalModules.map(async ({ address: proposalModuleAddress, info }) => {
        if (!info) {
          return undefined
        }

        const openProposalsFormula =
          OPEN_PROPOSALS_MAP[info.contract.replace('crates.io:', '')]
        const openProposals = await openProposalsFormula?.({
          ...env,
          contractAddress: proposalModuleAddress,
        })

        return (
          openProposals && {
            proposalModuleAddress,
            proposals: openProposals,
          }
        )
      })
    )
  ).filter(Boolean) as InboxItem[]
}

// Map contract name to open proposal formula.
const OPEN_PROPOSALS_MAP: Record<
  string,
  Formula<ProposalResponse<any>[], { address?: string }> | undefined
> = {
  // Single choice
  // V1
  'cw-govmod-single': singleChoiceOpenProposals,
  'cw-proposal-single': singleChoiceOpenProposals,
  // V2
  'cwd-proposal-single': singleChoiceOpenProposals,
  'dao-proposal-single': singleChoiceOpenProposals,

  // Multiple choice
  'cwd-proposal-multiple': multipleChoiceOpenProposals,
  'dao-proposal-multiple': multipleChoiceOpenProposals,
}
