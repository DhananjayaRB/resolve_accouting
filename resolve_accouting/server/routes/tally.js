import express from 'express';
import axios from 'axios';
import pool from '../db/config.js';

const router = express.Router();

// Debug middleware for this route
router.use((req, res, next) => {
  console.log(`Tally route accessed: ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

// Push data to Tally
router.post('/push', async (req, res) => {
  try {
    const { xmlData } = req.body;
    
    if (!xmlData) {
      console.error('Missing XML data in request');
      return res.status(400).json({ 
        success: false, 
        message: 'XML data is required' 
      });
    }

    // Get Tally configuration from environment variables
    const tallyConfig = {
      ip: process.env.TALLY_IP || 'localhost',
      port: process.env.TALLY_PORT || 9000
    };

    console.log('Attempting to connect to Tally at:', `http://${tallyConfig.ip}:${tallyConfig.port}`);

    try {
      // Send XML to Tally
      const response = await axios.post(
        `http://${tallyConfig.ip}:${tallyConfig.port}`,
        xmlData,
        {
          headers: {
            'Content-Type': 'text/xml',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('Tally response:', response.data);

      // Check Tally's response
      if (response.data && response.data.success) {
        res.json({ 
          success: true, 
          message: 'Successfully pushed to Tally',
          data: response.data 
        });
      } else {
        throw new Error(response.data?.message || 'Failed to push to Tally');
      }
    } catch (tallyError) {
      console.error('Error communicating with Tally:', tallyError);
      
      // Handle specific error cases
      if (tallyError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'Could not connect to Tally. Please ensure Tally is running and accessible.'
        });
      }
      
      if (tallyError.code === 'ETIMEDOUT') {
        return res.status(504).json({
          success: false,
          message: 'Connection to Tally timed out. Please try again.'
        });
      }

      throw tallyError;
    }
  } catch (error) {
    console.error('Error pushing to Tally:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to push to Tally',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Save Tally config for organization
router.post('/config', async (req, res) => {
  try {
    const { org_id, tally_company_name, tally_ip, tally_port, created_by } = req.body;
    if (!org_id || !tally_company_name || !tally_ip || !tally_port || !created_by) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const result = await pool.query(
      `INSERT INTO organization_tally_config (org_id, tally_company_name, tally_ip, tally_port, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [org_id, tally_company_name, tally_ip, tally_port, created_by]
    );
    res.json({ success: true, message: 'Tally config saved', data: result.rows[0] });
  } catch (error) {
    console.error('Error saving Tally config:', error);
    res.status(500).json({ success: false, message: 'Failed to save Tally config', error: error.message });
  }
});

export default router; 