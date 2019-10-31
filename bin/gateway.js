#!/usr/bin/env node
const assert = require("assert");
const http = require("http");
const parseArgs = require("minimist");
const websocket = require("websocket-stream");
const HyperswarmProxyServer = require("hyperswarm-proxy/server");
const debug = require("debug")("hyperswarm-ws-gateway");

const argv = parseArgs(process.argv.slice(2), {
  string: ["port"],
  alias: {
    port: ["p"]
  },
  default: {
    port: "4200"
  }
});

async function main(port) {
  assert(Number.isInteger(port), "Not a valid port number provided");

  const server = http.createServer();
  server.listen(port);
  debug(`http server listening on port ${port}`);

  const proxyServer = new HyperswarmProxyServer({ ephemeral: false });
  const wss = websocket.createServer({ server }, handle);

  function handle(stream) {
    debug(`handling new websocket stream`);
    proxyServer.handleStream(stream);
  }
}

main(Number.parseInt(argv.port));
