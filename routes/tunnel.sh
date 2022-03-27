#!/usr/bin/env bash

function isFreePort() {
  local port="${1}"

  if pgrep -f "[s]sh.*localhost:${port}" &> /dev/null; then
    # 1 = false
    return 1
  else
    # 0 = true
    return 0
  fi
}

function createTunnel() {
  local port="${1}"
  local user="${2}"
  local host="${3}"

  if ! ssh -NfL localhost:"${port}":localhost:11211 "${user}"@"${host}" &> /dev/null; then
    return 1
  else
    return 0
  fi
}

PORT_NR=3001

if isFreePort $PORT_NR; then
  # only for testing
  createTunnel $PORT_NR "$(id -un)"@"localhost"
  echo "Tunnel created!"
  echo "PID: $(pgrep -f "[s]sh.*localhost:$PORT_NR")"
else
  echo "Port $PORT_NR is already in use! Please handle first!"
  echo "PID: $(pgrep -f "[s]sh.*localhost:$PORT_NR")"
fi
