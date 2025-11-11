const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");



const app = express();

// Security middlewares
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

// CORS setup (allow frontend + local dev + env-configurable origins)
const defaultOrigins = new Set([
  "http://localhost:5173",
  "https://focus-object-detection-in-video-int-gray.vercel.app",
]);

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .forEach((origin) => defaultOrigins.add(origin));
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      // Allow non-browser clients (like curl/postman)
      return callback(null, true);
    }

    if (defaultOrigins.has(origin)) {
      return callback(null, true);
    }

    try {
      const hostname = new URL(origin).hostname;
      // Allow Vercel preview deployments automatically
      if (hostname.endsWith("vercel.app")) {
        return callback(null, true);
      }
    } catch (err) {
      return callback(err);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection - connect only when not running tests. Tests manage their own in-memory DB.
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// API Routes

// Route imports (put all at the top after other requires)
const candidateRoutes = require("./routes/candidates");
const sessionRoutes = require("./routes/sessions");
const eventRoutes = require("./routes/events");
const reportRoutes = require("./routes/reports");
const authRoutes = require("./routes/auth");

// Then mount them
app.use("/api/auth", authRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/reports", reportRoutes);


// Test route
app.get("/", (req, res) => {
  res.json({ message: "Video Proctoring API is running 🚀" });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only when not required as a module (e.g., during tests)
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () =>
    console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}`)
  );
}

module.exports = app;
