#!/usr/bin/env node
const assert = require('assert')
const http = require('http')
const parseArgs = require('minimist')
const websocket = require('websocket-stream')
const HyperswarmProxyServer = require('hyperswarm-proxy/server')
const debug = require('debug')('hyperswarm-ws:gateway')

const argv = parseArgs(process.argv.slice(2), {
  string: ['port'],
  alias: {
    port: ['p']
  },
  default: {
    port: '4200'
  }
})

let lastSocketId = 0
const connections = new Map()

async function main (port) {
  assert(Number.isInteger(port), 'Not a valid port number provided')

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.statusCode = 200
      res.end('hyperswarm websocket gateway\n')
    } else {
      res.statusCode = 404
      res.end('not found')
    }
  })
  server.listen(port)
  process.stdout.write(`Gateway HTTP server listening on port ${port}\n`)

  const proxyServer = new HyperswarmProxyServer({ ephemeral: false })
  websocket.createServer({ server }, handle)

  function handle (stream) {
    debug('handling new websocket stream')
    const socketId = lastSocketId++
    connections.set(socketId, stream)

    proxyServer.handleStream(stream)

    stream.on('error', err => {
      debug(`experienced error: ${err.code}`)
      if (err.code !== 'ECONNRESET') {
        throw err
      }
    })
    stream.on('close', () => connections.delete(socketId))
  }

  function shutdown () {
    for (const connection of connections.values()) {
      connection.destroy()
    }

    proxyServer.destroy()
    server.close()
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main(Number.parseInt(argv.port))
