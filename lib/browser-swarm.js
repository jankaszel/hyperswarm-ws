const { EventEmitter } = require('events')
const websocket = require('websocket-stream')
const HyperswarmProxyClient = require('hyperswarm-proxy/client')
const debug = require('debug')('hyperswarm-ws:client')

class BrowserSwarm extends EventEmitter {
  constructor (ws) {
    super()

    this.ws = ws
    this.ws.on('error', err => this.emit('error', err))
    this._createHyperswarmClient(this.ws)
  }

  _createHyperswarmClient (stream) {
    debug('creating hyperswarm proxy client')
    this.hyperswarmClient = new HyperswarmProxyClient({
      connection: stream,
      autoconnect: true,
      maxPeers: 24
    })

    this.hyperswarmClient.on('peer', peer => this.emit('peer', peer))
    this.hyperswarmClient.on('connection', (connection, info) =>
      this.emit('connection', connection, info)
    )
  }

  join (topic) {
    debug(`joining topic: ${topic.toString('hex')}`)
    this.hyperswarmClient.join(topic)
  }

  leave (topic) {
    debug(`leaving topic: ${topic.toString('hex')}`)
    this.hyperswarmClient.leave(topic)
  }

  destroy (callback) {
    this.ws.destroy(() => this.hyperswarmClient.close(callback))
  }
}

class SwarmError extends Error {
  constructor (code, message) {
    super(message)
    this.code = code
  }
}

async function createBrowserSwarm (gatewayUrls) {
  let ws

  for (const url of !Array.isArray(gatewayUrls) ? [gatewayUrls] : gatewayUrls) {
    try {
      ws = await tryGateway(url)
      break
    } catch (err) {
      debug(`couldn't connect to gateway: ${url}`)
      continue
    }
  }

  if (!ws) {
    throw new SwarmError(
      'EBADGATEWAYS',
      'Error connecting to any of the provided gateways'
    )
  }

  return new BrowserSwarm(ws)
}

function tryGateway (url) {
  return new Promise((resolve, reject) => {
    const ws = websocket(url)
    ws.on('error', handleError)
    ws.on('connect', () => resolve(ws))

    function handleError (err) {
      if (err.code === 'ENOTFOUND') {
        ws.off('error', handleError)
        reject(err)
      }
    }
  })
}

module.exports = { createBrowserSwarm, BrowserSwarm }
