# NutriSolve - AI-Powered Nutrition Platform

A complete full-stack nutrition and diet application with AI chat (Ollama + USDA RAG), MongoDB authentication, community features, and educational resources.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Setup Ollama and download USDA data
npm run setup

# Start both frontend and backend
npm start
```

**Access the application:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[README_NUTRISOLVE.md](./README_NUTRISOLVE.md)** - Complete documentation
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Implementation details

## ✨ Features

- **AI Chat Assistant**: Ollama-powered nutrition advice with USDA food database
- **Authentication**: JWT-based auth with MongoDB
- **Community Hub**: Posts, comments, likes, and category filtering
- **Health Calculators**: BMI and BMR calculators
- **Meal Planning**: Weekly meal planner (coming soon)
- **Responsive UI**: Modern, beautiful interface with Tailwind CSS

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- React Router

**Backend:**
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Ollama (AI)
- JWT Authentication
- USDA FoodData Central

## 📋 Prerequisites

- Node.js 16+
- MongoDB (local or Atlas)
- Ollama (`curl -fsSL https://ollama.com/install.sh | sh`)

## 🎯 Scripts

```bash
npm start              # Run frontend + backend
npm run start:frontend # Frontend only (Vite)
npm run start:backend  # Backend only (Express)
npm run download-data  # Download USDA dataset
npm run setup          # Full setup (Ollama + data)
npm run build          # Build for production
```

## 🔐 Environment Variables

Create `.env` in the root directory:

```env
MONGO_URI=mongodb://localhost:27017/nutrisolve
JWT_SECRET=your-super-secret-key
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=phi3:mini
PORT=5000
FRONTEND_URL=http://localhost:8080
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ for better nutrition and health
