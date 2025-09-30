import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import database configuration
import { connectDB } from './src/config/dbConfig.js';

// Import middleware
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

// Import API routes
import authRoutes from './src/routes/auth.routes.js';
import aiRoute from './src/routes/ai.routes.js';
import apiRoutes from './src/routes/index.js';
import authRoute from './src/routes/auth.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for development
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
// app.use(limiter);

// Middleware
app.use(
  cors({
    origin:"http://localhost:5173",
    credentials: true,
  })
);

// Cookie parser middleware (must be before routes that use cookies)
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Health Surveillance System API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      api: "/api",
      health: "/api/health",
      docs: "/api/docs"
    }
  });
});

// Authentication routes (must be before other API routes)
app.use('/api/auth', authRoutes);

// AI routes
app.use("/api/ai", aiRoute);


app.use('/api/auth', authRoute);

// Other API routes
app.use('/api', apiRoutes);

// Legacy AI route (if it exists)
// try {
//   const { default: aiRoute } = await import('./src/routes/ai.routes.js');
  
// } catch (error) {
//   console.log('Legacy AI route not found, skipping...');
// }

// 404 handler for non-API routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  try {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Health Surveillance System API Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
});
