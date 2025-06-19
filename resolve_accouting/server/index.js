import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ledgerRoutes from './routes/ledgers.js';
import payrollMappingRoutes from './routes/payroll-mappings.js';
import organisationRoutes from './routes/organisation.js';
import tallyRoutes from './routes/tally.js';
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api/ledgers', ledgerRoutes);
app.use('/api/payroll-mappings', payrollMappingRoutes);
app.use('/api/organisation', organisationRoutes);
app.use('/api/tally', tallyRoutes);

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

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Available routes:');
  console.log('- GET /api/ledgers');
  console.log('- GET /api/payroll-mappings');
  console.log('- POST /api/payroll-mappings');
  console.log('- PUT /api/payroll-mappings/:id');
  console.log('- DELETE /api/payroll-mappings/:id');
  console.log('- GET /api/organisation');
  console.log('- POST /api/tally/push');
}); 