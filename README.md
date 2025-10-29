# Focus & Object Detection in Video Interviews

This project is a practical video proctoring system for interviews. It uses client-side AI (TensorFlow.js) to detect focus loss, multiple people, suspicious objects, drowsiness, and optional background audio, then records timestamped events and produces PDF/CSV reports.

The codebase is split into a React + TypeScript frontend and an Express + MongoDB backend.

## Project structure

```
project/
  backend/
    src/
      controllers/
      models/
      routes/
      middleware/
      config/
    tests/
  frontend/
    src/
      components/
      hooks/
      services/
      types/
```

## Requirements

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- A modern browser with camera and microphone access

## Setup and run (development)

### 1) Backend

```
cd backend
npm install
cp .env.example .env
```

Set the MongoDB connection string and other values in `backend/.env`, then start the server:

```
npm run dev
```

By default the backend runs on http://localhost:5000 and exposes its API under `/api`.

### 2) Frontend

```
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
VITE_USE_WORKER=true

# Optional flags
VITE_ENABLE_AUDIO_DETECTION=false
VITE_ENABLE_ADVANCED_ANALYTICS=true
VITE_ENABLE_REAL_TIME_ALERTS=true

# Detection thresholds (tweak as needed)
VITE_FOCUS_THRESHOLD=5000
VITE_ABSENCE_THRESHOLD=10000
VITE_DETECTION_INTERVAL=500
VITE_CONFIDENCE_THRESHOLD=0.5
```

Notes:
- Set `VITE_API_URL` to the backend origin without the `/api` suffix. The app will append `/api` automatically.
- `VITE_USE_WORKER=true` offloads TensorFlow.js vision inference to a Web Worker using the WASM backend (more stable on some devices). Audio processing runs on the main thread.

Start the dev server:

```
npm run dev
```

Vite will print the local URL (often http://localhost:5173).

## Features at a glance

- Real-time video monitoring with client-side detection
- Focus and head pose checks; drowsiness via eye aspect ratio
- Object detection for phones, books, notes, devices
- Multiple-person detection to ensure only the candidate is present
- Optional background voice detection (off by default)
- Event logging with timestamps and severity
- Integrity score calculated from violations
- Reports: PDF and CSV with session summary and full timeline
- UI convenience: shows the newest 5 events by default with a “View all” toggle

## Reports

- PDF report
  - Includes counts for focus issues, object violations, multiple-person incidents, and behavior/audio flags.
  - Integrity score is consistent with the JSON logic used on the server.
  - Event timeline is paginated across pages and includes all incidents.

- CSV report
  - Includes all events plus a session summary row with key metrics.

- Filenames
  - The frontend names downloads using the candidate’s username (e.g., `username.pdf`, `username.csv`).

## Configuration details

- Model loading
  - Models are preloaded on app start and cached. On the main thread we prefer WebGL; in the worker we use the WASM backend.

- API base URL
  - The frontend normalizes the base URL to include `/api` automatically. Point `VITE_API_URL` to the backend origin only.

- Event types (examples)
  - Focus: `focus_lost`, `no_face`, `drowsiness`
  - Objects: `phone`, `book`, `notes`, `device`
  - Multiple persons: `multiple_faces`
  - Behavior/audio: `suspicious_behavior`, `background_voice`

## Testing

Backend tests:

```
cd backend
npm test
```

## Production build

Frontend:

```
cd frontend
npm run build
```

Backend: deploy the Node server with your platform of choice and configure environment variables (MongoDB URI, port, etc.).

## Troubleshooting

- Models load slowly or the UI hangs
  - Keep `VITE_USE_WORKER=true` so vision runs in a Web Worker with the WASM backend.
  - Ensure your browser allows camera and microphone access.

- API requests fail
  - Verify the backend is running on http://localhost:5000.
  - Ensure `VITE_API_URL` in the frontend `.env` points to the backend origin without `/api`.

- Events rejected with 400
  - Events are only posted for active sessions. Make sure the session hasn’t ended before logging.

## License

MIT License. See `LICENSE` for details.
4. **Test Features**:
   - Face detection should show "Face Detected"
   - Look away to test focus detection
   - Hold up objects (phone, book) to test object detection
   - Close eyes for 3+ seconds to test drowsiness detection
   - Make noise to test audio detection

### Step 7: VS Code Debugging Setup

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    }
  ]
}
```

### Step 8: Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (if added)
cd frontend
npm test
```

### Step 9: Production Build
```bash
# Build frontend for production
cd frontend
npm run build

# Build backend (if needed)
cd backend
npm run build
```

### Troubleshooting Common Issues

#### Camera/Microphone Not Working
- Ensure HTTPS or localhost (required for media access)
- Check browser permissions
- Try different browsers (Chrome recommended)

#### AI Models Not Loading
- Check internet connection (models download from CDN)
- Clear browser cache
- Check browser console for errors

#### Database Connection Issues
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure network access for Atlas

#### Port Conflicts
- Backend default: 5000 (change in `.env`)
- Frontend default: 3000 (change in `vite.config.ts`)

### VS Code Extensions for Better Development
```bash
# Install recommended extensions
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension formulahendry.auto-rename-tag
```

### Environment Variables Reference

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-proctoring
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Video Proctoring System
VITE_FOCUS_THRESHOLD=5000
VITE_ABSENCE_THRESHOLD=10000
VITE_DETECTION_INTERVAL=300
VITE_CONFIDENCE_THRESHOLD=0.6
```

### Success Indicators
✅ Backend server starts without errors  
✅ MongoDB connection established  
✅ Frontend loads at localhost:3000  
✅ Camera permission granted  
✅ AI models load successfully  
✅ Face detection working  
✅ Object detection working  
✅ Audio detection working  
✅ Events logged in database  
✅ Reports generate successfully  

**Your video proctoring system is now ready for development and testing!**

**Built with ❤️ for secure, fair, and efficient online interviews**