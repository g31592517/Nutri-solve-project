# 🍽️ NutriSolve Platform

A comprehensive full-stack nutrition and meal planning platform powered by AI.

## ✨ Features

- 🤖 AI-powered meal planning with personalized recommendations
- 📊 Nutritional analysis and insights
- 👥 Community features for sharing and engagement
- 💬 Real-time chat with nutrition AI assistant
- 🔐 Secure authentication (username/password with optional email)

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or remote)
- Ollama (for AI features)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the full-stack application:**
```bash
npm start
```

That's it! The command will automatically:
- ✅ Start the backend API server on `http://localhost:5000`
- ✅ Start the frontend dev server on `http://localhost:8080`
- ✅ Configure automatic API proxying (no CORS issues)
- ✅ Display unified logs for both services

### Access the Application

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## 🛠️ Development

### Unified Development Experience

The project is configured as a **single full-stack application**:

- **One command starts everything:** `npm start` or `npm run dev`
- **Automatic API routing:** Frontend requests to `/api` are proxied to the backend
- **No CORS configuration needed:** Vite proxy handles everything seamlessly
- **Synchronized logs:** Both backend and frontend logs appear in the same terminal
- **Hot reload:** Changes to frontend code trigger instant updates

### Project Structure

```
nutriflame-ai/
├── backend/              # Express API server
│   ├── controllers/      # Request handlers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   └── server.ts        # Main server file
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── contexts/        # React contexts
│   ├── lib/            # Utilities and API client
│   └── pages/          # Page components
├── vite.config.ts      # Vite configuration with proxy
└── package.json        # Unified scripts
```

### Available Scripts

- `npm start` - Start both frontend and backend (recommended)
- `npm run dev` - Alias for npm start
- `npm run start:backend` - Start only backend
- `npm run start:frontend` - Start only frontend
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Technology Stack

**Frontend:**
- ⚛️ React 18 with TypeScript
- ⚡ Vite for blazing-fast development
- 🎨 TailwindCSS + shadcn/ui components
- 🔄 React Query for data fetching
- 🧭 React Router for navigation

**Backend:**
- 🚀 Express 5 with TypeScript
- 🗄️ MongoDB with Mongoose
- 🤖 Ollama for AI capabilities
- 🔐 JWT authentication with bcrypt
- 🛡️ Helmet + CORS for security

### API Configuration

The frontend automatically uses the correct API endpoint:

- **Development:** Uses Vite proxy (`/api` → `http://localhost:5000/api`)
- **Production:** Uses `VITE_API_URL` environment variable

No hardcoded URLs needed! The configuration adapts automatically.

### Authentication

The platform supports flexible authentication:

- **Primary:** Username + Password
- **Optional:** Email (for account recovery)
- **Sign In:** Choose between username or email login
- **JWT Tokens:** 7-day expiration with auto-login

## 📝 Environment Variables

Create a `.env` file with:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/nutrisolve

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key

# Ollama AI
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma:2b

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

## 🔧 Troubleshooting

### Port Already in Use
If port 5000 or 8080 is already in use:
1. Stop the conflicting process
2. Or change the port in `.env` (backend) or `vite.config.ts` (frontend)

### MongoDB Connection Issues
Ensure MongoDB is running:
```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB service
sudo systemctl start mongodb
```

### CORS Errors
The project is configured to avoid CORS issues through Vite proxy. If you still see CORS errors:
1. Restart both servers: Stop and run `npm start` again
2. Clear browser cache
3. Check that both servers are running on the correct ports

## 📦 Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

## 📄 License

MIT

---

Built with ❤️ for better nutrition and health
