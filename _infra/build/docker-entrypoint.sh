#!/bin/sh
set -e

# Install packages that our app depends on. (why we need this here? => we will mount /src directory in docker-compose.yml)
npm ci

if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ]; then
  set -- node "$@"
fi

exec "$@"
