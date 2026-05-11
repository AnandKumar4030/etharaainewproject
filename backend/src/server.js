require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://team-task-manager.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true); // Allow all origins to prevent Railway dynamic domain issues
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── Serve Frontend & 404 Handler ─────────────────────────────────────────────
const path = require('path');

// First, handle 404 for any unhandled /api routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API Route not found' });
});

if (process.env.NODE_ENV === 'production') {
  // Serve static files from frontend/dist
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Catch-all route to serve index.html for React Router
  app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).send('Frontend build not found. Make sure the root directory in Railway is set to "/" and the project has been fully deployed.');
      }
    });
  });
} else {
  // Development 404 handler for all other routes
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
});
