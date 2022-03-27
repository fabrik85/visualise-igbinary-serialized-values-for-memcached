#!/usr/bin/env bash

set -o errexit  # same as 'set -e' => abort on nonzero exit status
set -o nounset  # same as 'set -u' => abort on unbound variable
set -o errtrace # same as 'set -E' => inherit ERR trap by shell functions
set -o pipefail #                  => don't hide errors within pipes

# Enable only for debugging! (same as 'set -x')
#  => It will print commands and their arguments as they are executed.
# set -o xtrace

RED="\033[0;31m"
YELLOW="\033[0;33m"
COLOR_OFF="\033[0m"
# 1 => false
EXIT_HANDLED=1

function handleExit() {
  local exit_signal=$?
  local serviceID
  local leftPort
  local rightPort

  if [ $EXIT_HANDLED == 1 ]; then
    echo ""
    echo "EXIT SIGNAL : $exit_signal - $(kill -l $exit_signal 2>/dev/null || echo "UNKNOWN")"
    serviceID=$(docker-compose ps -q "mce-node-php")

    if [[ -n "${serviceID}" ]] && docker ps -q --no-trunc | grep "${serviceID}"; then
      docker-compose down
    fi

    if pgrep -f "[s]]ocat TCP4-LISTEN:${apiPort},fork EXEC:./server.sh" &> /dev/null; then
      echo "Kill bash API (socat) with port:${apiPort}"
      pgrep -f "[s]]ocat TCP4-LISTEN:${apiPort},fork EXEC:./server.sh" | xargs kill &> /dev/null
    fi

    leftPort=$(jq ".localPort.left" "$(pwd)"/src/settings.json)
    rightPort=$(jq ".localPort.right" "$(pwd)"/src/settings.json)

    if pgrep -f "[s]sh -NfL localhost:${leftPort}" &> /dev/null; then
      echo -e "LEFT Kill with: [s]sh -NfL localhost:${leftPort}"
      pgrep -f "[s]sh -NfL localhost:${leftPort}" | xargs kill &> /dev/null
    fi

    if pgrep -f "[s]sh -NfL localhost:${rightPort}" &> /dev/null; then
      echo -e "RIGHT Kill with: [s]sh -NfL localhost:${rightPort}"
      pgrep -f "[s]sh -NfL localhost:${rightPort}" | xargs kill &> /dev/null
    fi

    # 0 => true
    EXIT_HANDLED=0
  fi
}

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "start.sh script is designed for MacOS usage exclusively! Abort..."
  exit 1;
fi

if ! command -v jq; then
  echo -e "${RED}jq${COLOR_OFF} command not found! Please install it first with ${YELLOW}brew update && brew install jq${COLOR_OFF}"
  exit 1
fi

if ! command -v socat; then
  echo -e "${RED}socat${COLOR_OFF} command not found! Please install it first with ${YELLOW}brew update && brew install socat${COLOR_OFF}"
  exit 1
fi

trap handleExit 0 SIGHUP SIGINT SIGQUIT SIGABRT SIGTERM

docker-compose up -d

apiPort=$(jq ".apiPort" "$(pwd)"/src/settings.json)

# https://github.com/yurikoex/bash-rest-server
socat TCP4-LISTEN:"${apiPort}",fork EXEC:./server.sh
