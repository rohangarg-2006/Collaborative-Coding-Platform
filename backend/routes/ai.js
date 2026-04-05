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

    // Try modern models first and gracefully fall back across API versions.
    const apiVersions = ['v1beta', 'v1'];
    const modelCandidates = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    let data = null;
    let lastErrorStatus = 500;
    let lastErrorMessage = 'AI service error';

    for (const apiVersion of apiVersions) {
      for (const model of modelCandidates) {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;

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

        console.log(`Gemini API response status (${apiVersion}/${model}):`, response.status);

        if (response.ok) {
          data = await response.json();
          break;
        }

        let errorData = null;
        try {
          errorData = await response.json();
        } catch (parseErr) {
          errorData = null;
        }

        lastErrorStatus = response.status;
        lastErrorMessage = errorData?.error?.message || 'AI service error';

        // Keep trying alternate models/versions when model or endpoint is unavailable.
        if (response.status === 404 || response.status === 400) {
          continue;
        }

        return res.status(response.status).json({
          success: false,
          error: lastErrorMessage
        });
      }

      if (data) break;
    }

    if (!data) {
      return res.status(lastErrorStatus).json({
        success: false,
        error: lastErrorMessage
      });
    }

    console.log('Gemini API response received successfully');

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
