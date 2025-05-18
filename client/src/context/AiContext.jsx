// Fixed AiContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

// Create the AI Context
const AiContext = createContext();

// Export the context so it can be imported elsewhere
export { AiContext };

export const AiProvider = ({ children }) => {
  // The API key is hardcoded - using the Google API key for Gemini
  const [apiKey, setApiKey] = useState('AIzaSyBhkHZTQuogLk4NVVQNvofBhmX39GjcGW8');
  const [isApiKeySet, setIsApiKeySet] = useState(true); // Always true when hardcoded

  // If you want to change the API key for any reason
  const saveApiKey = (key) => {
    if (!key || key.trim().length < 10) {
      return false;
    }
    
    setApiKey(key);
    setIsApiKeySet(true);
    return true;
  };
  
  // Reset API key if needed
  const resetApiKey = () => {
    setApiKey('AIzaSyBhkHZTQuogLk4NVVQNvofBhmX39GjcGW8'); // Reset to default with new API key
    setIsApiKeySet(true);
    console.log('API key has been reset to default');
  };
  
  // Set the API key when component mounts
  useEffect(() => {
    // We always have an API key set since it's hardcoded
    setIsApiKeySet(true);
    console.log('AiContext initialized with API key:');
    console.log('API key length:', apiKey?.length);
    // Validate the API key format (should be a string of reasonable length)
    if (!apiKey || apiKey.length < 10) {
      console.error('WARNING: API key appears to be invalid or missing');
    } else {
      console.log('API key format appears valid');
    }
  }, [apiKey]);

  // Context value that will be provided to consuming components
  const value = {
    apiKey,
    isApiKeySet,
    saveApiKey,
    resetApiKey
  };

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
};

// Custom hook for using the AI context
export const useAi = () => {
  console.log("useAi hook called");
  const context = useContext(AiContext);
  if (context === undefined) {
    console.error("AiContext is undefined - hook was called outside provider");
    throw new Error('useAi must be used within an AiProvider');
  }
  console.log("AiContext successfully retrieved:", !!context);
  return context;
};

// Make sure we're exporting both the context and the hook
export default AiContext;
