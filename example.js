// see a more coherent example at <https://glitch.com/~hyperswarm-ws-exampe>
const { BrowserSwarm } = require("./");
const crypto = require("crypto");

const topic = crypto
  .createHash("sha256")
  .update("hyperswarm-ws-example")
  .digest();
const message = "yee";
const swarm = new BrowserSwarm("ws://localhost:4200");

swarm.on("connection", (socket, peerInfo) => {
  socket.on("data", data => console.log(`received: ${data}`));

  socket.write(message);
  console.log(`sent: ${message}`);
});

swarm.join(topic);
console.log(`joined topic: ${topic.toString("hex")}`);
