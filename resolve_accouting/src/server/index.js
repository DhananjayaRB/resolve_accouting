const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fetch = require('node-fetch');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'resolve_accounting',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// Tally configuration
const TALLY_CONFIG = {
  ip: '192.168.20.82',
  port: 9000
};

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to PostgreSQL database');
  release();
});

// Push to Tally endpoint
app.post('/tally/push', async (req, res) => {
  const { xmlData } = req.body;
  
  if (!xmlData) {
    return res.status(400).json({
      success: false,
      message: 'XML data is required'
    });
  }

  try {
    // Log the push attempt
    const logQuery = `
      INSERT INTO tally_push_logs 
      (xml_data, status, created_at) 
      VALUES ($1, $2, NOW())
      RETURNING id
    `;
    
    const logResult = await pool.query(logQuery, [xmlData, 'pending']);
    const logId = logResult.rows[0].id;

    // Push to Tally
    const tallyResponse = await fetch(`http://${TALLY_CONFIG.ip}:${TALLY_CONFIG.port}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xmlData
    });

    if (!tallyResponse.ok) {
      // Update log with error
      await pool.query(
        'UPDATE tally_push_logs SET status = $1, error_message = $2 WHERE id = $3',
        ['failed', 'Tally connection failed', logId]
      );

      throw new Error('Tally connection failed');
    }

    const responseText = await tallyResponse.text();

    // Update log with success
    await pool.query(
      'UPDATE tally_push_logs SET status = $1, response_data = $2 WHERE id = $3',
      ['success', responseText, logId]
    );

    res.json({
      success: true,
      message: 'Successfully pushed to Tally',
      logId
    });

  } catch (error) {
    console.error('Error pushing to Tally:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to push to Tally'
    });
  }
});

// Get push logs endpoint
app.get('/tally/logs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tally_push_logs ORDER BY created_at DESC LIMIT 100'
    );
    res.json({
      success: true,
      logs: result.rows
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 