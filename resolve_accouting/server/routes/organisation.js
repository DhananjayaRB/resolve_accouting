import express from 'express';
const router = express.Router();

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