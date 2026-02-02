import express from 'express';
import cors from 'cors';

const router = express.Router();

// CORS middleware for this router
router.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Org-Id', 'Accept'],
  exposedHeaders: ['Content-Type', 'Content-Length']
}));

// Handle preflight requests
router.options('*', cors());

// GET /api/organisation
router.get('/', (req, res) => {
  // Return a mock organization for now
  res.json({
    id: '1',
    name: 'Demo Organization',
    code: 'DEMO',
    isActive: true,
    financialYear: '2024-2025'
  });
});

export default router; 