import * as fs from 'fs'

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import {
  HttpBatchClient,
  Tendermint34Client,
  Tendermint37Client,
} from '@cosmjs/tendermint-rpc'
import { WebSocket } from 'ws'

import { objectMatchesStructure } from '@/core'

type FifoJsonTracerOptions = {
  file: string
  onData: (data: unknown) => void
  // If provided, this callback will be called when a JSON object cannot be
  // parsed from the line.
  onError?: (line: string, error: unknown) => void
}

type FifoJsonTracer = {
  // Promise that resolves when the FIFO is closed or rejects if the FIFO
  // errors.
  promise: Promise<void>
  // Close the FIFO and resolve the promise.
  close: () => void
}

// Trace a FIFO (see `mkfifo`) that transmits JSON objects on each line, and
// execute an asynchronous callback synchronously (i.e. don't read from the FIFO
// while executing the async callback) with the parsed JSON object. If the
// callback throws an error, the FIFO will be closed and the error will be
// thrown. If a line cannot be parsed as a JSON object, the `onError` callback
// will be called if provided. If the `onError` callback is not provided, the
// line will be ignored.
//
// Example:
//
//   ```sh
//   # Create FIFO.
//   mkfifo /tmp/my-fifo
//   ```
//
//   ```ts
//   import { setUpFifoJsonTracer } from './utils'
//
//   setUpFifoJsonTracer({
//     file: '/tmp/my-fifo',
//     onData: async (data) => {
//       console.log('Parsed JSON object:', data)
//     },
//     onError: (buffer, error) => {
//       console.error(`Unexpected non-JSON line: "${buffer}"`, err)
//     },
//   })
//   ```
//
//   ```sh
//   # Write JSON objects to FIFO.

//   echo '{"foo": "bar"}' > /tmp/my-fifo
//   # Output:
//   # Parsed JSON object: { foo: 'bar' }

//   echo '{"baz": "qux"}' > /tmp/my-fifo
//   # Output:
//   # Parsed JSON object: { foo: 'bar' }
//   ```
export const setUpFifoJsonTracer = ({
  file,
  onData,
  onError,
}: FifoJsonTracerOptions): FifoJsonTracer => {
  const fifoRs = fs.createReadStream(file, {
    // Parse chunks as UTF-8 strings.
    encoding: 'utf-8',
  })

  // In the case a chunk ends in the middle of a JSON object and not after a
  // newline, buffer the chunk and continue reading until we have a valid JSON
  // object.
  let buffer = ''

  const dataListener = (chunk: string | Buffer) => {
    // Type-check chunk. It should be a string due to `encoding` set above.
    if (!chunk || typeof chunk !== 'string') {
      return
    }

    // All complete lines that should be JSON objects end with a newline, so
    // the last item in this array will be an empty string if the last line
    // is complete. The last line may not be complete if the data being sent
    // exceeds the chunk buffer size. If this is the case, use the buffer
    // across chunks to build the incomplete line.
    const lines = chunk.split('\n')

    if (lines.length === 0) {
      return
    }

    // If the previous chunk left an incomplete line in the buffer, prepend
    // it to the first line of this chunk.
    if (buffer) {
      lines[0] = buffer + lines[0]
      buffer = ''
    }

    // If the last line is not empty, it is incomplete, so buffer it for the
    // next chunk.
    if (lines[lines.length - 1]) {
      buffer = lines.pop()!
    }

    for (const line of lines) {
      // Ignore empty line.
      if (!line) {
        continue
      }

      let data: unknown | undefined
      try {
        data = JSON.parse(line)
      } catch (error) {
        // If we cannot parse the buffer as a JSON object, call the error
        // callback if provided.
        onError?.(line, error)
        continue
      }

      // Execute callback with parsed JSON.
      onData(data)
    }
  }

  // Start reading from the FIFO.
  fifoRs.on('data', dataListener)

  // Wait for FIFO to error or end.
  const promise = new Promise<void>((_resolve, reject) => {
    let done = false
    const resolve = () => {
      if (!done) {
        done = true
        _resolve()
      }
    }
    const resolveDelayed = () => setTimeout(resolve, 5000)

    fifoRs.on('error', (error) => {
      fifoRs.off('end', resolve)
      fifoRs.off('close', resolveDelayed)
      // Reject once the FIFO ends.
      fifoRs.on('end', () => {
        if (!done) {
          done = true
          reject(error)
        }
      })
      // If closed and promise not done after 2 seconds, reject.
      fifoRs.on('close', () => {
        setTimeout(() => {
          if (!done) {
            done = true
            reject(error)
          }
        }, 2000)
      })
      // Close the FIFO if it is not already closed, so it ends.
      if (!fifoRs.closed) {
        fifoRs.destroy()
      }
    })

    // Once data ends, resolve.
    fifoRs.on('end', resolve)

    // If closed and promise not done after 5 seconds, resolve.
    fifoRs.on('close', resolveDelayed)
  })

  return {
    promise,
    close: () => fifoRs.destroy(),
  }
}

type WebSocketNewBlockListenerOptions = {
  rpc: string
  onNewBlock: (block: unknown) => void | Promise<void>
  onConnect?: () => void
  onClose?: () => void
  onError?: (error: Error) => void
}

export const setUpWebSocketNewBlockListener = ({
  rpc,
  onNewBlock,
  onConnect,
  onClose,
  onError,
}: WebSocketNewBlockListenerOptions): WebSocket => {
  // Get new-block WebSocket.
  const webSocket = new WebSocket(rpc.replace('http', 'ws') + '/websocket')

  // Subscribe to new blocks once opened.
  webSocket.on('open', () => {
    webSocket!.send(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'subscribe',
        id: 1,
        params: ["tm.event = 'NewBlock'"],
      })
    )
    onConnect?.()
  })

  // Listen for new blocks.
  webSocket.on('message', async (data) => {
    try {
      const { result } = JSON.parse(data.toString())
      if (
        !objectMatchesStructure(result, {
          data: {
            value: {
              block: {
                header: {
                  chain_id: {},
                  height: {},
                  time: {},
                },
              },
            },
          },
        })
      ) {
        return
      }

      // Execute callback with block data.
      await onNewBlock(result.data.value.block)
    } catch {
      // Fail silently.
    }
  })

  // Log error and ignore.
  webSocket.on('error', (error) => {
    onError?.(error)
  })

  webSocket.on('close', () => {
    onClose?.()
  })

  return webSocket
}

// Create CosmWasm client that batches requests.
export const getCosmWasmClient = async (
  rpc: string
): Promise<CosmWasmClient> => {
  const httpClient = new HttpBatchClient(rpc)
  const tmClient = await (
    (
      await connectTendermintClient(rpc)
    ).constructor as typeof Tendermint34Client | typeof Tendermint37Client
  ).create(httpClient)
  // @ts-ignore
  return new CosmWasmClient(tmClient)
}

// Connect the correct tendermint client based on the node's version.
export const connectTendermintClient = async (endpoint: string) => {
  // Tendermint/CometBFT 0.34/0.37 auto-detection. Starting with 0.37 we seem to
  // get reliable versions again 🎉 Using 0.34 as the fallback.
  let tmClient
  const tm37Client = await Tendermint37Client.connect(endpoint)
  const version = (await tm37Client.status()).nodeInfo.version
  if (version.startsWith('0.37.')) {
    tmClient = tm37Client
  } else {
    tm37Client.disconnect()
    tmClient = await Tendermint34Client.connect(endpoint)
  }
  return tmClient
}