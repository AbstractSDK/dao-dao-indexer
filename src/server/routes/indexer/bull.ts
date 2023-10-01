import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { KoaAdapter } from '@bull-board/koa'

import { QueueName, getBullQueue } from '@/core'

export const makeBullBoardJobsMiddleware = (basePath: string) => {
  const serverAdapter = new KoaAdapter().setBasePath(basePath)

  createBullBoard({
    queues: [new BullMQAdapter(getBullQueue(QueueName.Export))],
    serverAdapter,
  })

  return serverAdapter.registerPlugin({
    // Mount on root since we wrap this in our own app with auth.
    mount: '/',
  })
}
