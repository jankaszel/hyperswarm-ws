const isStream = require('is-stream')
const websocket = require('websocket-stream')
const HyperswarmProxyClient = require('hyperswarm-proxy/client')
const debug = require('debug')('hyperswarm-ws:client')

const DEFAULT_RECONNECT_DELAY = 1000

class ClientSwarm extends HyperswarmProxyClient {
  constructor (gateway, opts = {}) {
    super(opts)

    this.ws = isStream.duplex(gateway) ? gateway : websocket(gateway)
    this.reconnectDelay = opts.reconnectDelay || DEFAULT_RECONNECT_DELAY

    this.reconnect()
  }

  reconnect () {
    this.ws.once('close', () => {
      setTimeout(() => {
        if (this.destroyed) {
          return
        }
        this.reconnect()
      }, this.reconnectDelay)
    })
    this.ws.on('error', err => this.emit('error', err))

    super.reconnect(this.ws)
  }

  join (topic) {
    debug(`joining topic: ${topic.toString('hex')}`)
    super.join(topic)
  }

  leave (topic) {
    debug(`leaving topic: ${topic.toString('hex')}`)
    super.leave(topic)
  }

  destroy (callback) {
    this.ws.destroy()
    super.destroy(callback)
  }
}

class SwarmError extends Error {
  constructor (code, message) {
    super(message)
    this.code = code
  }
}

async function createClientSwarm (gatewayUrls) {
  let ws

  for (const url of !Array.isArray(gatewayUrls) ? [gatewayUrls] : gatewayUrls) {
    try {
      ws = await tryGateway(url)
      break
    } catch (err) {
      debug(`couldn't connect to gateway: ${url}`)
    }
  }

  if (!ws) {
    throw new SwarmError(
      'EBADGATEWAYS',
      'Error connecting to any of the provided gateways'
    )
  }

  return new ClientSwarm(ws)
}

const connectionFailed = err => {
  if (typeof window !== 'undefined') {
    return err.target.readyState === 3
  } else {
    return ['ENOTFOUND', 'ECONNREFUSED'].includes(err.code)
  }
}

function tryGateway (url) {
  return new Promise((resolve, reject) => {
    const ws = websocket(url)
    ws.on('error', handleError)
    ws.once('connect', () => {
      ws.removeListener('error', handleError)
      resolve(ws)
    })

    function handleError (err) {
      if (connectionFailed(err)) {
        ws.removeListener('error', handleError)
        reject(err)
        return
      }

      throw err
    }
  })
}

module.exports = { createClientSwarm, ClientSwarm }
