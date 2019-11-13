const websocket = require('websocket-stream')
const HyperswarmProxyServer = require('hyperswarm-proxy/server')

class ServerSwarm extends HyperswarmProxyServer {
  constructor (opts = {}) {
    super(opts)
    if (opts.server) {
      this.listenOnServer(opts.server)
    }
  }

  listenOnServer (server) {
    this.wss = websocket.createServer({ server }, socket => {
      socket.on('error', err => {
        if (err.code !== 'ECONNRESET') {
          throw err
        }
      })

      this.handleStream(socket)
    })
  }

  destroy (cb) {
    this.wss.close(() => {
      super.destroy(cb)
    })
  }
}

module.exports = { ServerSwarm }
