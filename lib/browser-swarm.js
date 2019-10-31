const { EventEmitter } = require('events')
const websocket = require('websocket-stream')
const HyperswarmProxyClient = require('hyperswarm-proxy/client')
const debug = require('debug')('hyperswarm-ws-client')

class BrowserSwarm extends EventEmitter {
  constructor (gatewayUrl) {
    super()

    this.ws = websocket(gatewayUrl)
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

  destroy (callback) {
    callback()
  }
}

module.exports = { BrowserSwarm }
