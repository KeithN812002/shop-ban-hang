#!/bin/bash

# Web App Development Script

set -e

echo "🚀 Starting Web App in development mode..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update with your configuration."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Start dev server
echo "🔥 Starting development server..."
pnpm dev

