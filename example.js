// see a browser-based example at <https://glitch.com/~hyperswarm-ws-exampe>
const crypto = require('crypto')
const { createBrowserSwarm } = require('./')

let swarm
const topic = crypto
  .createHash('sha256')
  .update('hyperswarm-ws-example')
  .digest()
const id = 'node example'
const message = 'yee'

const connections = new Set()

async function main () {
  try {
    swarm = await createBrowserSwarm(['ws://localhost:4200'])
  } catch (err) {
    if (err.code === 'EBADGATEWAYS') {
      console.error("Couldn't connect to provided gateways.")
      process.exit(1)
    } else {
      throw err
    }
  }

  swarm.on('connection', socket => {
    connections.add(socket)

    socket.on('data', data => {
      const { from, message } = JSON.parse(data.toString())
      console.log(`> (${from}) ${message}`)
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
    console.log(`sent: @(${id}) ${message}`)
  })

  swarm.join(topic)
  console.log(`joined topic: ${topic.toString('hex')}`)

  process.on('SIGINT', () => {
    for (const socket of connections) {
      socket.destroy()
    }

    swarm.leave(topic)
    swarm.destroy()
  })
}

main()
