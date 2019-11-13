// IMPORTANT: run `npm i --no-save hyperswarm` before.
// see a browser-based example at <https://glitch.com/~hyperswarm-ws-exampe>
const crypto = require('crypto')
const debug = require('debug')

// extra dependency
const Hyperswarm = require('hyperswarm')
const { createClientSwarm } = require('./')

const debugPeer = debug('example-peer')
const debugClient = debug('example-client')
debug.enable('example*')

const topic = crypto
  .createHash('sha256')
  .update('hyperswarm-ws-example')
  .digest()
const message = 'yee'

async function main () {
  let clientSwarm
  try {
    clientSwarm = await createClientSwarm(['ws://localhost:4200'])
  } catch (err) {
    if (err.code === 'EBADGATEWAYS') {
      console.error("Couldn't connect to provided gateways.")
      process.exit(1)
    } else {
      throw err
    }
  }

  const hyperswarm = Hyperswarm()

  setupSwarm('peer', hyperswarm, topic, {
    joinOpts: {
      announce: true,
      lookup: false
    },
    log: debugPeer
  })

  setupSwarm('client', clientSwarm, topic, { log: debugClient })
}

function setupSwarm (id, swarm, topic, { joinOpts = {}, log = console.log }) {
  const connections = new Set()
  swarm.on('connection', socket => {
    connections.add(socket)

    socket.on('data', data => {
      const { from, message } = JSON.parse(data.toString())
      log(`> (${from}) ${message}`)
    })
    socket.on('close', () => connections.delete(socket))

    socket.write(
      Buffer.from(
        JSON.stringify({
          from: id,
          message
        })
      )
    )
    log(`sent: @(${id}) ${message}`)
  })

  swarm.join(topic, joinOpts)
  log(`joined topic: ${topic.toString('hex')}`)

  process.on('SIGINT', () => {
    for (const socket of connections) {
      socket.destroy()
    }

    swarm.leave(topic)
    swarm.destroy()
  })
}

main()
