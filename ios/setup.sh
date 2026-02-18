#!/bin/bash
# Siouxland Online iOS - Project Setup
# Generates the Xcode project from project.yml using XcodeGen

set -e

echo "🔧 Setting up Siouxland Online iOS..."

# Check for XcodeGen
if ! command -v xcodegen &> /dev/null; then
    echo "📦 Installing XcodeGen..."
    brew install xcodegen
fi

# Generate Xcode project
echo "🏗️ Generating Xcode project..."
cd "$(dirname "$0")"
xcodegen generate

echo "✅ Project generated! Open SiouxlandOnline.xcodeproj in Xcode."
echo ""
echo "Next steps:"
echo "  1. open SiouxlandOnline.xcodeproj"
echo "  2. Select your development team in Signing & Capabilities"
echo "  3. Add an app icon to Assets.xcassets/AppIcon.appiconset"
echo "  4. Build and run on iOS 26+ simulator or device"
