#!/bin/bash

echo "🔄 Stopping any existing server on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No existing process found"

echo "🚀 Starting the server..."
npm start 