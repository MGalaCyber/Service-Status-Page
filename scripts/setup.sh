#!/bin/bash

# Status Page Setup Script

echo "🚀 Status Page Setup Script"
echo "============================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check .env.local
echo ""
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
else
    echo "⚠️  .env.local not found"
    echo "📝 Creating .env.example from template..."
    cp .env.example .env.local
    echo "⚠️  Please fill in .env.local with your Supabase credentials"
fi

# Build check
echo ""
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Fill in .env.local with Supabase credentials"
    echo "2. Run 'npm run dev' to start development server"
    echo "3. Visit http://localhost:3000"
else
    echo "❌ Build failed"
    exit 1
fi
