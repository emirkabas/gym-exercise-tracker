#!/bin/bash

echo "🚀 Setting up React Native Gym Tracker App..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install iOS dependencies (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Installing iOS dependencies..."
    cd ios && pod install && cd ..
fi

echo ""
echo "✅ React Native app setup complete!"
echo ""
echo "📱 To run the app:"
echo "   Android: npm run android"
echo "   iOS: npm run ios"
echo ""
echo "🔧 Make sure you have:"
echo "   - Node.js installed"
echo "   - React Native CLI installed"
echo "   - Android Studio (for Android)"
echo "   - Xcode (for iOS, Mac only)"
echo ""
echo "🎉 Your React Native app is ready!" 