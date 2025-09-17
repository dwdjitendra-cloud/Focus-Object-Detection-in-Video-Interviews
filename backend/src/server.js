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

// CORS setup (allow frontend + local dev)
app.use(
  cors({
    origin: [
      "https://focus-object-detection-in-video-int-gray.vercel.app", // frontend prod
      "http://localhost:5173", // local dev (vite default)
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

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

app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}`)
);
