#!/bin/bash

echo "🚀 Ensuring phi3:mini Model is Available"
echo "======================================"

# Check if phi3:mini is available
if ollama list | grep -q "phi3:mini"; then
    echo "✅ phi3:mini model found"
    
    # Set environment variable to phi3:mini (default)
    export OLLAMA_MODEL=phi3:mini
    echo "✅ Environment confirmed: OLLAMA_MODEL=phi3:mini"
    
    # Kill existing server
    echo "🔄 Restarting server with phi3:mini model..."
    pkill -f "tsx backend/server.ts"
    sleep 2
    
    # Start server with phi3:mini model
    npm run start:backend &
    
    echo "⚡ Server restarted with phi3:mini model"
    echo "🎯 Using phi3:mini for better conversational responses"
    
    # Wait for server to start
    sleep 5
    
    # Run quick test
    echo "🧪 Running quick test..."
    curl -X POST http://localhost:5000/api/chat \
         -H "Content-Type: application/json" \
         -d '{"message": "Quick healthy breakfast"}' \
         -w "\nResponse time: %{time_total}s\n"
    
else
    echo "❌ phi3:mini model not found"
    echo "💡 Run: ollama pull phi3:mini"
    echo "📊 Current models:"
    ollama list
fi
