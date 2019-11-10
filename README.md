# Hyperswarm WebSocket Bridge

Use a WebSocket gateway to bridge Hyperswarm connections via [`hyperswarm-proxy`](https://github.com/RangerMauve/hyperswarm-proxy) to the browser.

## API

#### `new ClientSwarm(gateway, [opts])`

Create a new client instance that connects to a WebSocket gateway given the a gateway URL. `gateway` may alternatively be a connection stream `ws` (created using [`websocket-stream`](https://github.com/maxogden/websocket-stream)).

The class extends `HyperswarmProxyClient` of [`hyperswarm-proxy`]((https://github.com/RangerMauve/hyperswarm-proxy), so it will
* pass any opts to its parent constructor, and
* inherit all instance methods, such as `reconnect`, `join`, `leave`, `destroy`.

#### `async createClientSwarm(gatewayUrls)`

Given an array of gateway URLs, try all gateways for working connections until the first one is found. Will pass that URL as websocket stream to a new `ClientSwarm` instance.

If none of the gateways works, an error with `err.code = 'EBADGATEWAYS'` is thrown.

## Running a Gateway

For running a gateway, use `hyperswarm-ws-gateway [-p <port>]`. Will run a WebSocket gateway on the given port that bridges all incoming WebSocket streams into the Hyperswarm network.
