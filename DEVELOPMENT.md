# 🚀 Development Guide

## Quick Start

### Single Command Startup

Start the entire full-stack application with one command:

```bash
npm start
```

This will:
- ✅ Display a startup banner with configuration info
- ✅ Start the backend API server on port 5000
- ✅ Start the frontend dev server on port 8080 (or next available port)
- ✅ Show unified logs from both services in the same terminal
- ✅ Enable hot reload for frontend changes
- ✅ Configure automatic API proxying (no CORS issues)

### What You'll See

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🍽️  NutriSolve Platform Starting...            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

📦 Initializing Full-Stack Development Environment

   🔧 Configuration:
      • Backend API:  http://localhost:5000
      • Frontend:     http://localhost:8080
      • Proxy:        /api → http://localhost:5000/api
      • CORS:         Configured for seamless communication

   ⏳ Starting services...

[BACKEND] 🚀 Server Started Successfully!
[FRONTEND] ➜  Local:   http://localhost:8080/
```

## Architecture Overview

### How It Works

The project uses a **unified development setup** that eliminates common full-stack development pain points:

1. **Single Entry Point**
   - `npm start` launches both frontend and backend simultaneously
   - Uses `concurrently` to run both processes in parallel
   - Logs are prefixed with `[BACKEND]` and `[FRONTEND]` for clarity

2. **Automatic API Proxying**
   - Vite dev server proxies `/api/*` requests to `http://localhost:5000/api/*`
   - Frontend code uses relative URLs: `fetch('/api/auth/login')`
   - No CORS configuration needed in development
   - No hardcoded backend URLs

3. **Port Management**
   - Backend: Fixed on port 5000 (configurable via `.env`)
   - Frontend: Port 8080 (automatically finds next available if busy)
   - Proxy handles all communication transparently

### Request Flow

```
Browser → Frontend (localhost:8080)
            ↓ (fetch('/api/...'))
         Vite Proxy
            ↓
         Backend (localhost:5000/api/...)
            ↓
         Response
```

## Development Workflow

### Making Changes

**Frontend Changes:**
- Edit files in `src/`
- Vite hot reload updates browser instantly
- No restart needed

**Backend Changes:**
- Edit files in `backend/`
- Server auto-restarts (via tsx watch mode)
- Frontend proxy continues working

**Configuration Changes:**
- Changes to `vite.config.ts` or `backend/server.ts` require restart
- Stop with `Ctrl+C` and run `npm start` again

### Running Services Separately

If you need to run services independently:

```bash
# Backend only
npm run start:backend

# Frontend only
npm run start:frontend
```

## API Development

### Making API Requests

In your frontend code, use relative URLs:

```typescript
// ✅ Good - Uses proxy
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier, password })
});

// ❌ Bad - Hardcoded URL causes CORS issues
const response = await fetch('http://localhost:5000/api/auth/login', ...);
```

### API Client

The project includes a configured API client in `src/lib/api.ts`:

```typescript
import { authApi } from '@/lib/api';

// Automatically uses correct endpoint (proxy in dev, env var in prod)
const response = await authApi.login(identifier, password);
```

### Adding New Endpoints

1. **Backend:** Add route in `backend/routes/`
2. **Frontend:** Add function in `src/lib/api.ts`
3. **Use:** Call from components

Example:

```typescript
// backend/routes/api.ts
router.get('/profile', authenticate, getUserProfile);

// src/lib/api.ts
export const userApi = {
  getProfile: async () => fetchApi('/profile')
};

// Component
const { data } = await userApi.getProfile();
```

## Environment Configuration

### Development (.env)

```env
# Backend
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/nutrisolve
JWT_SECRET=dev-secret-key

# AI
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma:2b

# Frontend
FRONTEND_URL=http://localhost:8080
```

### Production

Set `VITE_API_URL` for production deployments:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

The frontend will use this instead of the proxy.

## Debugging

### Backend Debugging

Add console.logs in backend code:

```typescript
console.log('[Auth] Login attempt:', { identifier });
```

They'll appear with `[BACKEND]` prefix in the terminal.

### Frontend Debugging

Use browser DevTools:
- Network tab: See proxied API requests
- Console: Frontend logs
- React DevTools: Component inspection

### Common Issues

**Port Already in Use:**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

**MongoDB Not Running:**
```bash
# Start MongoDB
sudo systemctl start mongodb

# Or use MongoDB Atlas (cloud)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/nutrisolve
```

**Proxy Not Working:**
1. Check both servers are running
2. Verify `vite.config.ts` has proxy configuration
3. Restart with `npm start`

## Testing

### Manual Testing

1. Start the app: `npm start`
2. Open browser: http://localhost:8080
3. Test features:
   - Sign up with username
   - Sign in with username
   - Try "Continue with Email" button
   - Make API requests (check Network tab)

### API Testing

Use the health check endpoint:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "NutriSolve API is running",
  "timestamp": "2025-11-04T06:21:37.000Z"
}
```

## Performance Tips

### Development

- Use `npm start` for full-stack development
- Frontend hot reload is instant
- Backend restarts automatically on changes

### Production Build

```bash
# Build frontend
npm run build

# Serve with backend
# (Configure backend to serve static files from dist/)
```

## Best Practices

1. **Always use relative API URLs** in frontend code
2. **Use the API client** in `src/lib/api.ts` for consistency
3. **Check terminal logs** for both backend and frontend issues
4. **Restart the stack** after configuration changes
5. **Keep .env updated** with correct values

## Troubleshooting

### "Failed to fetch" Errors

- Ensure both services are running (`npm start`)
- Check browser console for actual error
- Verify proxy configuration in `vite.config.ts`

### CORS Errors

- Should not occur with proxy setup
- If you see them, restart: `Ctrl+C` then `npm start`
- Check that you're using relative URLs (`/api/...`)

### Authentication Issues

- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET matches in `.env`
- Verify MongoDB is running and accessible

---

**Need Help?** Check the main [README.md](./README.md) for setup instructions.
