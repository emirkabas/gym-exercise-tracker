#!/bin/bash

# Increase file watch limit
sudo launchctl limit maxfiles 65536 200000
ulimit -n 65536

# Start Metro bundler
npx react-native start 