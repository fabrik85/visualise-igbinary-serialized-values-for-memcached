#!/usr/bin/env bash

# Print usage info
function exitWithUsage() {
  echo "NAME"
  echo "     PHP CLI"
  echo ""
  echo "DESCRIPTION"
  echo "     Run PHP CLI script(s)."
  echo ""
  echo "SYNOPSIS"
  echo "     *.php"
  echo "     debug"
  echo ""
  echo "DOCKER EXAMPLES"
  echo "     Keep running the container to debug it's internals:"
  echo "       $ docker run --rm [docker-image-name] debug"
  echo "     Run PHP CLI script located in under the path: /data"
  echo "       $ docker run --rm [docker-image-name] memcached.php"
  echo ""
  exit 2
}

function main() {
  local command=${1}

  # Trigger the relevant command.
  case "${command}" in
    "debug")
      # Keep the container running for 1 day for debugging (do nothing just prevent exiting the container).
      sleep 1d
      ;;
    "*.php")
      php -f /data/"${command}"
      ;;
    *)
      exitWithUsage
      ;;
  esac
}

main "$@"
