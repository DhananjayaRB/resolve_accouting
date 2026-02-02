import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ledgerRoutes from './routes/ledgers.js';
import payrollMappingRoutes from './routes/payroll-mappings.js';
import organisationRoutes from './routes/organisation.js';
import tallyRoutes from './routes/tally.js';
import v1Routes from './routes/v1/sync-tally-master.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS Configuration - Allow all origins for network flexibility
const corsOptions = {
  origin: '*', // Allow all origins - no network restrictions
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Org-Id',
    'X-CSRF-Token',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id', 'Content-Type'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Additional CORS headers middleware for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Org-Id, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id, Content-Type');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// API Routes - MUST come before static file serving
app.use('/api/ledgers', ledgerRoutes);
app.use('/api/payroll-mappings', payrollMappingRoutes);
app.use('/api/organisation', organisationRoutes);
app.use('/api/tally', tallyRoutes);
app.use('/api/v1', v1Routes);

// Serve static files from the dist directory (after API routes)
app.use(express.static(path.join(__dirname, '../dist')));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root route handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server - Bind to 0.0.0.0 to allow access from any network interface
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`Server is running on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  console.log(`Server accessible from network on port ${port}`);
  console.log('Available routes:');
  console.log('- GET /api/ledgers');
  console.log('- GET /api/payroll-mappings');
  console.log('- POST /api/payroll-mappings');
  console.log('- PUT /api/payroll-mappings/:id');
  console.log('- DELETE /api/payroll-mappings/:id');
  console.log('- GET /api/organisation');
  console.log('- POST /api/tally/push');
  console.log('- GET /api/v1/sync-tally-master (JWT required)');
  console.log('\nCORS enabled: All origins allowed');
}); 