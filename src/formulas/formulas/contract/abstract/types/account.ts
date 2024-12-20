/**
 * This file was automatically generated by @cosmwasm/ts-codegen@1.11.1.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */

export type AccountTrace =
  | 'local'
  | {
      remote: TruncatedChainId[]
    }
export type TruncatedChainId = string
export type AddAuthenticator =
  | {
      Secp256K1: {
        id: number
        pubkey: Binary
        signature: Binary
      }
    }
  | {
      Ed25519: {
        id: number
        pubkey: Binary
        signature: Binary
      }
    }
  | {
      EthWallet: {
        address: string
        id: number
        signature: Binary
      }
    }
  | {
      Jwt: {
        aud: string
        id: number
        sub: string
        token: Binary
      }
    }
  | {
      Secp256R1: {
        id: number
        pubkey: Binary
        signature: Binary
      }
    }
  | {
      Passkey: {
        credential: Binary
        id: number
        url: string
      }
    }
export type Binary = string
export type Namespace = string
export type ModuleVersion =
  | 'latest'
  | {
      version: string
    }
export type GovernanceDetailsForString =
  | {
      monarchy: {
        monarch: string
      }
    }
  | {
      sub_account: {
        account: string
      }
    }
  | {
      external: {
        governance_address: string
        governance_type: string
      }
    }
  | {
      n_f_t: {
        collection_addr: string
        token_id: string
      }
    }
  | {
      abstract_account: {
        address: Addr
      }
    }
  | {
      renounced: {}
    }
export type Addr = string
export interface InstantiateMsg {
  account_id?: AccountId | null
  authenticator?: AddAuthenticator | null
  description?: string | null
  install_modules?: ModuleInstallConfig[]
  link?: string | null
  name?: string | null
  namespace?: string | null
  owner: GovernanceDetailsForString
}
export interface AccountId {
  seq: number
  trace: AccountTrace
}
export interface ModuleInstallConfig {
  init_msg?: Binary | null
  module: ModuleInfo
}
export interface ModuleInfo {
  name: string
  namespace: Namespace
  version: ModuleVersion
}
export type ExecuteMsg =
  | {
      execute: {
        msgs: CosmosMsgForEmpty[]
      }
    }
  | {
      execute_with_data: {
        msg: CosmosMsgForEmpty
      }
    }
  | {
      execute_on_module: {
        exec_msg: Binary
        funds: Coin[]
        module_id: string
      }
    }
  | {
      admin_execute: {
        addr: string
        msg: Binary
      }
    }
  | {
      admin_execute_on_module: {
        module_id: string
        msg: Binary
      }
    }
  | {
      ica_action: {
        action_query_msg: Binary
      }
    }
  | {
      update_internal_config: InternalConfigAction
    }
  | {
      install_modules: {
        modules: ModuleInstallConfig[]
      }
    }
  | {
      uninstall_module: {
        module_id: string
      }
    }
  | {
      upgrade: {
        modules: [ModuleInfo, Binary | null][]
      }
    }
  | {
      create_sub_account: {
        account_id?: number | null
        description?: string | null
        install_modules: ModuleInstallConfig[]
        link?: string | null
        name?: string | null
        namespace?: string | null
      }
    }
  | {
      update_info: {
        description?: string | null
        link?: string | null
        name?: string | null
      }
    }
  | {
      update_status: {
        is_suspended?: boolean | null
      }
    }
  | {
      update_sub_account: UpdateSubAccountAction
    }
  | {
      update_ownership: GovAction
    }
  | {
      add_auth_method: {
        add_authenticator: AddAuthenticator
      }
    }
  | {
      remove_auth_method: {
        id: number
      }
    }
export type CosmosMsgForEmpty =
  | {
      bank: BankMsg
    }
  | {
      custom: Empty
    }
  | {
      staking: StakingMsg
    }
  | {
      distribution: DistributionMsg
    }
  | {
      stargate: {
        type_url: string
        value: Binary
      }
    }
  | {
      any: AnyMsg
    }
  | {
      ibc: IbcMsg
    }
  | {
      wasm: WasmMsg
    }
  | {
      gov: GovMsg
    }
export type BankMsg =
  | {
      send: {
        amount: Coin[]
        to_address: string
      }
    }
  | {
      burn: {
        amount: Coin[]
      }
    }
export type Uint128 = string
export type StakingMsg =
  | {
      delegate: {
        amount: Coin
        validator: string
      }
    }
  | {
      undelegate: {
        amount: Coin
        validator: string
      }
    }
  | {
      redelegate: {
        amount: Coin
        dst_validator: string
        src_validator: string
      }
    }
export type DistributionMsg =
  | {
      set_withdraw_address: {
        address: string
      }
    }
  | {
      withdraw_delegator_reward: {
        validator: string
      }
    }
  | {
      fund_community_pool: {
        amount: Coin[]
      }
    }
export type IbcMsg =
  | {
      transfer: {
        amount: Coin
        channel_id: string
        memo?: string | null
        timeout: IbcTimeout
        to_address: string
      }
    }
  | {
      send_packet: {
        channel_id: string
        data: Binary
        timeout: IbcTimeout
      }
    }
  | {
      close_channel: {
        channel_id: string
      }
    }
export type Timestamp = Uint64
export type Uint64 = string
export type WasmMsg =
  | {
      execute: {
        contract_addr: string
        funds: Coin[]
        msg: Binary
      }
    }
  | {
      instantiate: {
        admin?: string | null
        code_id: number
        funds: Coin[]
        label: string
        msg: Binary
      }
    }
  | {
      instantiate2: {
        admin?: string | null
        code_id: number
        funds: Coin[]
        label: string
        msg: Binary
        salt: Binary
      }
    }
  | {
      migrate: {
        contract_addr: string
        msg: Binary
        new_code_id: number
      }
    }
  | {
      update_admin: {
        admin: string
        contract_addr: string
      }
    }
  | {
      clear_admin: {
        contract_addr: string
      }
    }
export type GovMsg =
  | {
      vote: {
        option: VoteOption
        proposal_id: number
      }
    }
  | {
      vote_weighted: {
        options: WeightedVoteOption[]
        proposal_id: number
      }
    }
export type VoteOption = 'yes' | 'no' | 'abstain' | 'no_with_veto'
export type Decimal = string
export type InternalConfigAction =
  | {
      update_module_addresses: {
        to_add: [string, string][]
        to_remove: string[]
      }
    }
  | {
      update_whitelist: {
        to_add: string[]
        to_remove: string[]
      }
    }
export type UpdateSubAccountAction =
  | {
      unregister_sub_account: {
        id: number
      }
    }
  | {
      register_sub_account: {
        id: number
      }
    }
export type GovAction =
  | {
      transfer_ownership: {
        expiry?: Expiration | null
        new_owner: GovernanceDetailsForString
      }
    }
  | 'accept_ownership'
  | 'renounce_ownership'
export type Expiration =
  | {
      at_height: number
    }
  | {
      at_time: Timestamp
    }
  | {
      never: {}
    }
export interface Coin {
  amount: Uint128
  denom: string
}
export interface Empty {}
export interface AnyMsg {
  type_url: string
  value: Binary
}
export interface IbcTimeout {
  block?: IbcTimeoutBlock | null
  timestamp?: Timestamp | null
}
export interface IbcTimeoutBlock {
  height: number
  revision: number
}
export interface WeightedVoteOption {
  option: VoteOption
  weight: Decimal
}
export type QueryMsg =
  | {
      config: {}
    }
  | {
      module_versions: {
        ids: string[]
      }
    }
  | {
      module_addresses: {
        ids: string[]
      }
    }
  | {
      module_infos: {
        limit?: number | null
        start_after?: string | null
      }
    }
  | {
      info: {}
    }
  | {
      sub_account_ids: {
        limit?: number | null
        start_after?: number | null
      }
    }
  | {
      top_level_owner: {}
    }
  | {
      ownership: {}
    }
  | {
      authenticator_by_i_d: {
        id: number
      }
    }
  | {
      authenticator_i_ds: {}
    }
export interface MigrateMsg {}
export interface ConfigResponse {
  account_id: AccountId
  is_suspended: boolean
  module_factory_address: Addr
  registry_address: Addr
  whitelisted_addresses: Addr[]
}
export interface InfoResponse {
  info: AccountInfo
}
export interface AccountInfo {
  description?: string | null
  link?: string | null
  name?: string | null
}
export interface ModuleAddressesResponse {
  modules: [string, Addr][]
}
export interface ModuleInfosResponse {
  module_infos: AccountModuleInfo[]
}
export interface AccountModuleInfo {
  address: Addr
  id: string
  version: ContractVersion
}
export interface ContractVersion {
  contract: string
  version: string
}
export interface ModuleVersionsResponse {
  versions: ContractVersion[]
}
export interface OwnershipForString {
  owner: GovernanceDetailsForString
  pending_expiry?: Expiration | null
  pending_owner?: GovernanceDetailsForString | null
}
export interface SubAccountIdsResponse {
  sub_accounts: number[]
}
export interface TopLevelOwnerResponse {
  address: Addr
}
