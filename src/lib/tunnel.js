/* @todo: Print a message to the customer to make sure VPN is working + yubikey + etc... */
const bent = require('bent')

/*
 * Open SSH tunnel
 *
 * This can have a lot of issues like:
 *  - VPN not enabled => ssh will wait forever and application is just continue to work (async)
 *  - Yubikey is not inserted
 *  - SSH client is asking for adding the host to the hosts file => yes/no
 *
 *  For implementing timeout:
 *  @see https://www.it-swarm.dev/de/node.js/timeout-async-wait/824383996/
 */
async function initTunnelOnHost(tunnelConfig) {
  const getStream = bent(`http://host.docker.internal:${tunnelConfig.apiPort}`);
  console.log('LOG: Stream created for host API!');

  const stream = await getStream(`/api/tunnel/open/${tunnelConfig.remoteHost}:${tunnelConfig.remotePort}/${tunnelConfig.localPort}`);
  console.log('LOG: Called /api/tunnel/open/%s:%s/%s', tunnelConfig.remoteHost, tunnelConfig.remotePort, tunnelConfig.localPort);

  return await stream.json();
}

/*
 * Terminate SSH tunnel
 */
async function closeTunnelOnHost(tunnelConfig) {
  const getStream = bent(`http://host.docker.internal:${tunnelConfig.apiPort}`);
  const stream = await getStream(`/api/tunnel/close/${tunnelConfig.localPort}`);

  return await stream.json();
}

module.exports = {
  initTunnelOnHost,
  closeTunnelOnHost
};
