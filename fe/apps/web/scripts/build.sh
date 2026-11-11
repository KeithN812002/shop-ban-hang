#!/bin/bash

# Web App Build Script

set -e

echo "🔨 Building Web App..."

# Clean dist
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build
echo "⚙️ Building application..."
pnpm build

# Check build
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Output: $(du -sh dist | cut -f1)"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Done!"

