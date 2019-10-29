#!/usr/bin/env node
const parseArgs = require('minimist')
const wrtc = require('wrtc')
const crypto = require('crypto')
const createSwarm = require('@geut/discovery-swarm-webrtc')
const HyperswarmProxyServer = require('hyperswarm-proxy/server')
const debug = require('debug')('hyperswarm-webrtc-bridge')

const argv = parseArgs(process.argv.slice(2), {
  string: ['bootstrap', 'channel'],
  default: {
    bootstrap: 'https://geut-webrtc-signal.herokuapp.com/'
  }
})

const swarm = createSwarm({
  bootstrap: argv.bootstrap.split(','),
  simplePeer: { wrtc }
})
const channelId = crypto
  .createHash('sha256')
  .update(argv.channel)
  .digest()

swarm.join(channelId)
debug(`joined WebRTC swarm: ${channelId.toString('hex')}`)

const proxy = new HyperswarmProxyServer()

swarm.on('connection', peer => {
  proxy.handleStream(peer)
})

process.on('SIGINT', () => {
  swarm.close(() => {
    debug('WebRTC swarm closed')
  })

  proxy.destroy(() => {
    debug('server destroyed')
  })

  process.exit(0)
})
