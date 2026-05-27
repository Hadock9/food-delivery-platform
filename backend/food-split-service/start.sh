#!/bin/sh
cd "$(dirname "$0")"
NODE="${NODE:-/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node}"
if [ ! -f .env ]; then cp .env.example .env; fi
exec "$NODE" src/server.js
