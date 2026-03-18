#!/bin/sh

# Compile TypeScript to JavaScript
npx tsc

# Start the server
node dist/src/server.js
