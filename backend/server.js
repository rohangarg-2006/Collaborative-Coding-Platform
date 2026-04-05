const path = require('path');
const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const setupWebsockets = require('./utils/websocket');
const { getAllowedOrigins, isOriginAllowed } = require('./utils/corsOrigins');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Session seeding utility
const { seedRandomSessions } = require('./utils/seedSessions');

// Route files
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const sessionRoutes = require('./routes/sessions');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const executionRoutes = require('./routes/execution');

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Set up WebSocket server with Socket.io
const io = setupWebsockets(server);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

const allowedOrigins = getAllowedOrigins();

// Enable CORS
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin, allowedOrigins)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/execution', executionRoutes);

// Development only routes
if (process.env.NODE_ENV === 'development') {
  app.get('/api/v1/seed-sessions', async (req, res) => {
    try {
      await seedRandomSessions();
      res.status(200).json({ success: true, message: 'Sessions seeded successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error seeding sessions', error: error.message });
    }
  });
}

// Static folder for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
  });
}

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
  
  // Create random sessions in development mode if specified
  if (process.env.NODE_ENV === 'development' && process.env.SEED_SESSIONS === 'true') {
    try {
      await seedRandomSessions();
      console.log('Random sessions seeded successfully'.green);
    } catch (error) {
      console.error('Error seeding random sessions:'.red, error);
    }
  }
});
