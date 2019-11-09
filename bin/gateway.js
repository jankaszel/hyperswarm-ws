#!/usr/bin/env node
const assert = require('assert')
const http = require('http')
const parseArgs = require('minimist')
const { ServerSwarm } = require('../lib/server-swarm')

const argv = parseArgs(process.argv.slice(2), {
  string: ['port'],
  alias: {
    port: ['p']
  },
  default: {
    port: '4200'
  }
})

async function main (port) {
  assert(Number.isInteger(port), 'Not a valid port number provided')

  const server = http.createServer(handleRequest)
  const serverSwarm = new ServerSwarm({ ephemeral: false, server })

  server.listen(port)
  process.stdout.write(`Gateway HTTP server listening on port ${port}\n`)

  function shutdown () {
    serverSwarm.destroy(() => server.close())
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

function handleRequest (req, res) {
  if (req.method === 'GET' && req.url === '/') {
    res.statusCode = 200
    res.end('hyperswarm websocket gateway\n')
  } else {
    res.statusCode = 404
    res.end('not found')
  }
}

main(Number.parseInt(argv.port))
