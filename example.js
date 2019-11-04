// see a browser-based example at <https://glitch.com/~hyperswarm-ws-exampe>
const crypto = require('crypto')
const { createBrowserSwarm } = require('./')

let swarm
const topic = crypto
  .createHash('sha256')
  .update('hyperswarm-ws-example')
  .digest()
const message = 'yee'

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
    socket.on('data', data => console.log(`received: ${data.toString()}`))

    socket.end(Buffer.from(message))
    console.log(`sent: ${message}`)
  })

  swarm.join(topic)
  console.log(`joined topic: ${topic.toString('hex')}`)

  process.on('SIGINT', () => {
    swarm.leave(topic)
    swarm.destroy()
  })
}

main()
