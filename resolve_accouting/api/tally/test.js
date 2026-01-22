import axios from 'axios';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { tally_ip, tally_port } = req.body;

    if (!tally_ip || !tally_port) {
      return res.status(400).json({
        success: false,
        message: 'tally_ip and tally_port are required',
      });
    }

    const url = `http://${tally_ip}:${tally_port}`;
    console.log('Testing Tally connection to:', url);

    try {
      const response = await axios.get(url, { timeout: 5000 });

      return res.json({
        success: true,
        message: `Successfully connected to Tally at ${url}`,
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.error('Error testing Tally connection:', error);

      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'Connection refused. Please ensure Tally is running and accessible from the server.',
        });
      }

      if (error.code === 'ETIMEDOUT') {
        return res.status(504).json({
          success: false,
          message: 'Connection to Tally timed out. Please check network connectivity and firewall settings.',
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to connect to Tally',
      });
    }
  } catch (error) {
    console.error('Unexpected error in Tally test endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error while testing Tally connection',
    });
  }
}

