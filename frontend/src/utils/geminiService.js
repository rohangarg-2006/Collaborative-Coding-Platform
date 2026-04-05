// Gemini Service - Prioritizes reliability with fallback answers
import FALLBACK_ANSWERS from './fallbackAnswers';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
const AI_CHAT_ENDPOINT = `${API_BASE_URL}/ai/chat`;

// Helper function to find fallback answer based on keywords
const getFallbackAnswer = (prompt) => {
  if (!prompt || !prompt.trim()) {
    return 'Please provide a question or topic.';
  }

  const promptLower = prompt.toLowerCase();
  
  // Search through fallback answers for matching keywords
  for (const [keywords, answer] of Object.entries(FALLBACK_ANSWERS)) {
    const keywordList = keywords.split(' ');
    for (const keyword of keywordList) {
      if (promptLower.includes(keyword.toLowerCase())) {
        console.log(`✓ Found matching fallback answer for keyword: "${keyword}"`);
        return answer;
      }
    }
  }
  
  // Return generic fallback if no specific match found
  console.log('No matching fallback answer found. Returning generic response.');
  return `I apologize, I don't have a pre-written answer for your question about "${prompt.substring(0, 40)}..."\n\nHowever, here are some topics I can help with:\n\n• React components and hooks\n• JavaScript variables (var, let, const)\n• Web development fundamentals\n• Coding best practices\n\nPlease try asking about one of these topics, or rephrase your question!`;
};

const geminiService = {
  async getAiResponse(prompt) {
    try {
      if (!prompt || !prompt.trim()) {
        return 'Please provide a question or topic.';
      }

      console.log('🤖 Processing your question...');

      // First, try to get response from backend AI endpoint
      try {
        console.log('📡 Attempting to reach backend AI endpoint...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(AI_CHAT_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: prompt }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('📊 Backend response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend response received');

          // Extract the response text from multiple possible fields
          const backendResponse = data.reply || data.message || data.response || data.text || data.content;
          
          if (backendResponse && backendResponse.toString().trim()) {
            console.log('✓ Returning response from backend AI');
            return backendResponse.toString();
          }
        }
      } catch (backendErr) {
        const errMsg = backendErr.name === 'AbortError' ? 'timeout' : backendErr.message;
        console.log(`⚠️ Backend unavailable (${errMsg}). Falling back to pre-written answers.`);
      }

      // If backend didn't work, use fallback answers
      console.log('💾 Using reliable fallback answer system...');
      return getFallbackAnswer(prompt);

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      return getFallbackAnswer(prompt);
    }
  },

  async testConnection() {
    try {
      console.log('Testing backend AI endpoint...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(AI_CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'test' }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return { status: 'OK', message: 'Backend AI endpoint is working' };
      } else {
        return { status: 'ERROR', message: `Backend returned status ${response.status}` };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { status: 'TIMEOUT', message: 'Backend endpoint timed out' };
      }
      return { status: 'OFFLINE', message: 'Backend AI endpoint is not available - fallback mode active' };
    }
  }
};

export default geminiService;