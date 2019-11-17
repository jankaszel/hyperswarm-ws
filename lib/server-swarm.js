const assert = require('assert')
const websocket = require('websocket-stream')
const HyperswarmProxyServer = require('hyperswarm-proxy/server')

class ServerSwarm extends HyperswarmProxyServer {
  constructor (opts = {}) {
    super(opts)
    this.pingInterval = opts.pingInterval || 3500

    if (opts.server) {
      this.listenOnServer(opts.server)
    }
  }

  listenOnServer (server) {
    if (this.wss) {
      assert.fail('WebSocket server has already been created.')
    }

    this.wss = websocket.createServer({ server }, socket => {
      socket.on('error', err => {
        if (err.code !== 'ECONNRESET') {
          throw err
        }
      })
      this.handleStream(socket)
    })

    this._heartbeat()
  }

  _heartbeat () {
    if (!this.wss) {
      return
    }

    for (const client of this.wss.clients) {
      client.ping()
    }

    this._pingIntervalRef = setTimeout(() => {
      this._heartbeat()
    }, this.pingInterval)
  }

  destroy (cb) {
    if (this._pingIntervalRef) {
      clearTimeout(this._pingIntervalRef)
    }

    this.wss.close(() => {
      super.destroy(cb)
    })
  }
}

module.exports = { ServerSwarm }
