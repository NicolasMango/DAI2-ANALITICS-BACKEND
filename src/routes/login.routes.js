import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res) => {
    console.log('Attempting to validate login');
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
  
    try {
      const validationResponse = await axios.post('https://back.intranet.deliver.ar:3001/api/v1/login/token', {}, { headers: { Authorization: token } });
      const sessionData = validationResponse.data;
      res.status(200).json({ sessionData });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Invalid token', error);
        res.status(401).json({ error: 'Invalid token' });
      } else {
        console.error('Internal error validating token')
        res.status(500).json({ error: 'Failed to validate token' });
      }
    }
  });

  export default router;