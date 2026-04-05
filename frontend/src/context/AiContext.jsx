// Fixed AiContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

// Create the AI Context
const AiContext = createContext();

// Export the context so it can be imported elsewhere
export { AiContext };

export const AiProvider = ({ children }) => {
  const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const [apiKey, setApiKey] = useState(envApiKey);
  const [isApiKeySet, setIsApiKeySet] = useState(Boolean(envApiKey));

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
    setApiKey(envApiKey);
    setIsApiKeySet(Boolean(envApiKey));
    console.log('API key has been reset from environment');
  };
  
  // Set the API key when component mounts
  useEffect(() => {
    setIsApiKeySet(Boolean(apiKey));
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
