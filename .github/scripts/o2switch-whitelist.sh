#!/usr/bin/env bash
# Whitelists the GitHub Actions runner's public IP for SSH (port 22) on
# o2switch, and drops the oldest whitelisted IP first to stay under the
# quota. Uses the cPanel API Token method (Authorization: cpanel
# user:token header) -- o2switch's recommended auth since 2025-05-02,
# replacing the old --user/password Basic Auth this project used before
# (see git history: fix(ci) "pass o2switch credentials via curl --user").
#
# API docs: https://faq.o2switch.fr/cpanel/outils/exception-parefeu/
# Quota is 5 exceptions total (not 3 -- an earlier version of this script
# assumed 3 and got that wrong).
set -euo pipefail

: "${O2SWITCH_API_LOGIN:?missing}" "${O2SWITCH_API_TOKEN:?missing}" "${CPANEL_HOST:?missing}" "${RUNNER_IP:?missing}"

ENDPOINT='execute/SshWhitelist'
CPANEL="https://${CPANEL_HOST}:2083"

# Bounds every call below -- without these, a curl request that connects but
# never gets a response hangs until the job's overall timeout kills it, with
# no error message pointing at why.
CURL_OPTS=(--connect-timeout 10 --max-time 30 -H "Authorization: cpanel ${O2SWITCH_API_LOGIN}:${O2SWITCH_API_TOKEN}")

# GET a cPanel endpoint, retrying on transport errors (timeouts, refused
# connections, resets). The o2switch API is occasionally slow to answer from
# GitHub's runners, and a single timeout used to abort the whole deploy.
# Prints the body on success; returns 1 once every attempt has failed.
o2_get() {
    local url=$1 attempt body
    for attempt in 1 2 3; do
        if body=$(curl -sX GET "${CURL_OPTS[@]}" "$url"); then
            printf '%s' "$body"
            return 0
        fi
        echo "o2switch call failed (attempt $attempt/3), retrying in 5s..." >&2
        sleep 5
    done
    return 1
}

echo "Fetching currently whitelisted IPs..."
if ! RESPONSE=$(o2_get "$CPANEL/$ENDPOINT/list"); then
    echo "::error::o2switch list endpoint unreachable after 3 attempts." >&2
    exit 5
fi
if ! echo "$RESPONSE" | jq empty 2>/dev/null; then
    echo "::error::o2switch list endpoint returned non-JSON. First 500 chars of body below:" >&2
    echo "$RESPONSE" | head -c 500 >&2
    echo >&2
    exit 5
fi

# Already whitelisted -- idempotent, nothing to do.
if echo "$RESPONSE" | jq -e --arg ip "$RUNNER_IP" '.data.list[]? | select(.address == $ip)' > /dev/null; then
    echo "$RUNNER_IP is already whitelisted."
    exit 0
fi

# Quota is 5 total entries (shared across in+out directions for the same
# IP, so one IP typically counts as 2). Drop the single oldest address (both
# directions) only if we're already at/over quota, to make room for the new
# one -- never drop anything on a run that doesn't need to.
COUNT=$(echo "$RESPONSE" | jq -r '.data.count // 0')
if [ "$COUNT" -ge 5 ]; then
    OLDEST=$(echo "$RESPONSE" | jq -r '.data.list | sort_by(.updateDate) | .[0].address')
    echo "Quota reached ($COUNT/5) -- removing oldest CI IP: $OLDEST (in & out)"
    for direction in in out; do
        # A failed removal must not abort the run: the add below will still
        # report a clear error if the quota really is full.
        if ! body=$(o2_get "$CPANEL/$ENDPOINT/remove?address=$OLDEST&direction=$direction&port=22"); then
            echo "::warning::Could not remove $OLDEST ($direction) -- continuing." >&2
        else
            echo "$body" | jq -r '.message // .status' || true
        fi
        sleep 2
    done
fi

echo "Whitelisting runner IP $RUNNER_IP..."
if ! ADD_RESPONSE=$(o2_get "$CPANEL/$ENDPOINT/add?address=$RUNNER_IP&port=22"); then
    echo "::error::Failed to reach o2switch to whitelist $RUNNER_IP after 3 attempts." >&2
    exit 1
fi
echo "$ADD_RESPONSE" | jq

# Fail loudly instead of silently letting a later SSH step fail with an
# opaque "Permission denied" or a 120s timeout with no clear cause.
if [ "$(echo "$ADD_RESPONSE" | jq -r '.status')" != "1" ]; then
    echo "::error::Failed to whitelist $RUNNER_IP on o2switch -- check the whitelist quota (cPanel > Sécurité > Accès SSH) or the O2SWITCH_API_TOKEN secret." >&2
    exit 1
fi
