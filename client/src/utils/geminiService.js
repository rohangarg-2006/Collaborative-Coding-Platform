// Ultra-simplified geminiService.js - direct API calls only
import axios from 'axios';

const API_KEY = 'AIzaSyBgXYsxUMrWxCY2t3PpnUMZXmCZfngoWPM';

const geminiService = {
  async getAiResponse(prompt) {
    try {
      // Use the Gemini 1.5 Flash endpoint as per user example
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
      const response = await fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          }),
        }
      );
      const data = await response.json();
      console.log('Gemini API raw response:', JSON.stringify(data, null, 2));
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) return text;
      return 'No response from Gemini.';
    } catch (err) {
      console.error('Gemini API error:', err.message);
      return `I apologize, but I couldn't connect to my AI service to answer your question.\n\nError details: ${err.message}`;
    }
  }
};

export default geminiService;