import { ContractFormula } from '@/core'

import { AuctionConfig, AuctionConfigResponse, AuctionStrategy } from './types'

export const config: ContractFormula<AuctionConfigResponse | undefined> = {
  compute: async ({ contractAddress, get }) => {
    const config = await get<AuctionConfig>(contractAddress, 'auction_config')
    const priceStrategy = await get<AuctionStrategy>(
      contractAddress,
      'auction_strategy'
    )

    if (config && priceStrategy) {
      return {
        ...config,
        price_strategy: priceStrategy,
      }
    } else {
      return undefined
    }
  },
}