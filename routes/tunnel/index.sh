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
  # Example $3="stage-de-ab1:11290"
  local host="${3%%:*}"
  local hostPort="${3##*:}"

  if ! ssh -NfL localhost:"${port}":localhost:"${hostPort}" "${user}"@"${host}" &> /dev/null; then
    return 1
  else
    return 0
  fi
}

function sendBooleanResultAsJSON() {
  local result="${1}"

  results=$(jq ".result = $result" $(pwd)/routes/tunnel/template.json)
  sendJSON "${results}"
}

function sendJSON() {
  local json="${1}"

  add_response_header "Content-Type" "application/json"
  send_response_ok_exit <<< "${json}"
}

function hasTunnelRoute() {
  local port="${2}"
  local has="false"

  if ! isFreePort "$port"; then
    has="true"
  fi
  sendBooleanResultAsJSON $has
}

function closeTunnelRoute() {
  local port="${2}"
  local closed="false"

  if ! isFreePort "$port"; then
    if pgrep -f "[s]sh.*localhost:${port}" | xargs kill &> /dev/null; then
      closed="true"
    fi
  fi
  sendBooleanResultAsJSON $closed
}

function openTunnelRoute() {
  # Example $2="hostname:11211/3001"
  local host="${2%%/*}"
  local port="${2##*/}"
  local user
  local created="false"
  local json

  user=$(jq ".sshUser" "$(pwd)"/src/settings.json)
  # Remove double quote around the string (e.g. "user" => user)
  user="${user//\"}"

  if isFreePort "$port"; then
    if createTunnel "${port}" "${user}" "${host}"; then
      created="true"
    fi
  fi

  json=$(jq ".result = $created" $(pwd)/routes/tunnel/template.json)

  sendJSON "${json}"
}

on_uri_match '^/api/tunnel/open/(.*)$' openTunnelRoute
on_uri_match '^/api/tunnel/close/(.*)$' closeTunnelRoute
on_uri_match '^/api/tunnel/has/(.*)$' hasTunnelRoute