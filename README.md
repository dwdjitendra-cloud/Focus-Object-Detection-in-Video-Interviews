# 🎥 Focus & Object Detection in Video Interviews

A comprehensive, production-ready video proctoring system that uses AI-powered computer vision to monitor interview integrity in real-time.

## 🚀 Features

### Core Functionality
- **Real-time Video Monitoring** - Live candidate video feed with AI detection overlays
- **Focus Detection** - Tracks attention patterns and detects when candidates look away
- **Object Detection** - Identifies unauthorized items (phones, books, notes, devices)
- **Multi-face Detection** - Ensures only one person is present during the interview
- **Drowsiness Detection** - Advanced eye closure monitoring using Eye Aspect Ratio (EAR)
- **Audio Detection** - Background voice detection for additional security
- **Event Logging** - Comprehensive timestamped violation tracking
- **Integrity Scoring** - Automated scoring system based on detected violations
- **Report Generation** - Detailed PDF/CSV reports with analytics and charts

### Advanced Features
- **Configurable Thresholds** - Customizable detection sensitivity (5s look-away, 10s absence)
- **Head Pose Analysis** - Enhanced focus detection using 3D head orientation
- **Eye Aspect Ratio Monitoring** - Precise drowsiness detection with configurable thresholds
- **Real-time Audio Analysis** - Background voice detection with adjustable sensitivity
- **Real-time Alerts** - Immediate notifications for interviewers
- **Visual Analytics** - Charts and graphs for violation patterns
- **Session Management** - Complete interview lifecycle management
- **Data Export** - Multiple export formats for compliance and analysis

## 🏗️ Architecture

```
video-proctoring-system/
├── frontend/                 # React + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── components/      # UI Components
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── services/       # API Services
│   │   ├── types/          # TypeScript Definitions
│   │   └── utils/          # Utility Functions
│   └── public/
├── backend/                 # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── controllers/    # Route Controllers
│   │   ├── models/         # MongoDB Models
│   │   ├── routes/         # API Routes
│   │   ├── middleware/     # Custom Middleware
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utility Functions
│   └── tests/              # Unit & Integration Tests
└── docs/                   # Documentation
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **TensorFlow.js** - Client-side AI/ML models
- **Recharts** - Data visualization
- **React Webcam** - Camera integration
- **jsPDF** - PDF generation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **Jest** - Testing framework

### AI/ML Models
- **BlazeFace** - Face detection
- **COCO-SSD** - Object detection
- **MediaPipe FaceMesh** - Facial landmark detection for drowsiness
- **Web Audio API** - Real-time audio analysis

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account or local MongoDB
- Modern web browser with camera access

### 1. Clone Repository
```bash
git clone <repository-url>
cd video-proctoring-system
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your MongoDB connection in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure API endpoints in .env
npm run dev
```

### 4. Environment Configuration

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-proctoring
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Video Proctoring System
```

## 📖 API Documentation

### Authentication
```http
POST /api/auth/login
POST /api/auth/register
```

### Candidates
```http
GET    /api/candidates
POST   /api/candidates
GET    /api/candidates/:id
PUT    /api/candidates/:id
DELETE /api/candidates/:id
```

### Interview Sessions
```http
GET    /api/sessions
POST   /api/sessions
GET    /api/sessions/:id
PUT    /api/sessions/:id
DELETE /api/sessions/:id
```

### Detection Events
```http
GET    /api/events
POST   /api/events
GET    /api/events/session/:sessionId
```

### Reports
```http
GET    /api/reports/:sessionId
GET    /api/reports/:sessionId/pdf
GET    /api/reports/:sessionId/csv
```

## 🔧 Configuration

### Detection Thresholds
```javascript
const DETECTION_CONFIG = {
  FOCUS_THRESHOLD: 5000,      // 5 seconds
  ABSENCE_THRESHOLD: 10000,   // 10 seconds
  DETECTION_INTERVAL: 300,    // 300ms for better accuracy
  CONFIDENCE_THRESHOLD: 0.6,  // 60% confidence for better accuracy
  EYE_CLOSURE_THRESHOLD: 0.25, // Eye aspect ratio for drowsiness
  DROWSINESS_DURATION: 3000,  // 3 seconds of eye closure
  AUDIO_THRESHOLD: 0.1        // Audio level threshold
};
```

### Scoring System
```javascript
const SCORING_CONFIG = {
  BASE_SCORE: 100,
  FOCUS_VIOLATION_PENALTY: 5,    // -5 points per violation
  OBJECT_VIOLATION_PENALTY: 10,  // -10 points per violation
  MULTIPLE_FACE_PENALTY: 15,     // -15 points per violation
  BEHAVIOR_VIOLATION_PENALTY: 8  // -8 points per behavior violation
};
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run component tests
npm run test:e2e          # End-to-end tests
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Render)
```bash
cd backend
# Configure environment variables
# Deploy using platform-specific commands
```

### Database (MongoDB Atlas)
1. Create MongoDB Atlas cluster
2. Configure network access
3. Update connection string in environment variables

## 📊 Monitoring & Analytics

### Key Metrics
- **Detection Accuracy** - AI model performance
- **Response Time** - Real-time processing speed
- **Violation Patterns** - Common integrity issues
- **System Performance** - Resource utilization

### Logging
- All detection events with timestamps
- Enhanced event types (drowsiness, background voice)
- System performance metrics
- Error tracking and debugging
- User interaction analytics

## 🔒 Security & Privacy

### Data Protection
- Encrypted video transmission
- Secure API endpoints with JWT
- GDPR-compliant data handling
- Configurable data retention policies

### Privacy Features
- Local video processing (no server storage)
- Anonymized analytics
- Consent management
- Data deletion capabilities

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commits

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **Camera Access Denied** - Check browser permissions
- **AI Models Loading Slowly** - Ensure stable internet connection
- **Detection Accuracy Issues** - Verify lighting conditions

### Getting Help
- 📧 Email: jitendrakumar637587@gmail.com

## 🎯 Roadmap

### Version 2.0
- [ ] Mobile app support
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Version 3.0
- [ ] AI-powered behavior analysis
- [ ] Integration with popular LMS platforms
- [ ] Advanced reporting with ML insights
- [ ] Real-time collaboration features

## 🖥️ Running in VS Code - Complete Setup Guide
---

### Prerequisites
- **Node.js 18+** and npm installed
- **MongoDB** (Atlas account or local installation)
- **VS Code** with recommended extensions:
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Importer
  - Prettier - Code formatter
  - ESLint

### Step 1: Clone and Setup Project
```bash
# Clone the repository
git clone <your-repo-url>
cd video-proctoring-system

# Install root dependencies
npm install
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your MongoDB connection
# Required variables:
# MONGODB_URI=mongodb://localhost:27017/video-proctoring
# JWT_SECRET=your-super-secret-jwt-key
# NODE_ENV=development
# PORT=5000
```

### Step 3: Database Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Seed database with sample data
npm run seed
```

#### Option B: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI` in `.env`
4. Seed database: `npm run seed`

### Step 4: Frontend Setup
```bash
# Open new terminal in VS Code (Ctrl+Shift+`)
cd frontend

# Install frontend dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file:
# VITE_API_URL=http://localhost:5000/api
# VITE_APP_NAME=Video Proctoring System
```

### Step 5: Start Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm run dev

# You should see:
# 🚀 Server running on port 5000 in development mode
# 📦 MongoDB Connected: <your-connection>
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev

# You should see:
# ➜  Local:   http://localhost:3000/
# ➜  Network: use --host to expose
```

### Step 6: Test the Application

1. **Open Browser**: Navigate to `http://localhost:3000`
2. **Camera Permission**: Allow camera and microphone access
3. **Create Interview**: Fill in candidate details and start session
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