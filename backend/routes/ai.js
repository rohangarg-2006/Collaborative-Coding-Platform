const express = require('express');
const router = express.Router();

// AI chat endpoint - uses Gemini API
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get API key from environment
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.warn('GEMINI_API_KEY not configured in backend');
      return res.status(503).json({
        success: false,
        error: 'AI service not configured'
      });
    }

    // Use Gemini API with correct model
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';
    
    const response = await fetch(`${url}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: message }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);

      return res.status(response.status).json({
        success: false,
        error: errorData.error?.message || 'AI service error'
      });
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    // Extract response text
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text && text.trim()) {
      return res.status(200).json({
        success: true,
        reply: text,
        message: text
      });
    }

    return res.status(200).json({
      success: false,
      error: 'No response generated'
    });

  } catch (error) {
    console.error('AI endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
