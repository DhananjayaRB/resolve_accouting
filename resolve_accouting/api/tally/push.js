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
        return res.json({ 
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
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to push to Tally',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

