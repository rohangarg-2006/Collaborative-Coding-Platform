// Custom hook to safely manage the collaborators panel state
import { useState, useCallback } from 'react';

export const useCollaboratorsPanel = () => {
  // State to track if panel is open
  const [isOpen, setIsOpen] = useState(false);

  // Safe open function
  const openPanel = useCallback(() => {
    try {
      setIsOpen(true);
    } catch (error) {
      console.error('Error opening collaborators panel:', error);
    }
  }, []);

  // Safe close function with error handling
  const closePanel = useCallback(() => {
    try {
      setIsOpen(false);
    } catch (error) {
      console.error('Error closing collaborators panel:', error);
      // In case of a critical error, try a more direct approach
      setTimeout(() => {
        try {
          setIsOpen(false);
        } catch (innerError) {
          console.error('Failed to close panel on second attempt:', innerError);
        }
      }, 100);
    }
  }, []);

  // Toggle function with error handling
  const togglePanel = useCallback(() => {
    try {
      setIsOpen(prev => !prev);
    } catch (error) {
      console.error('Error toggling collaborators panel:', error);
      // Force to a known state in case of error
      try {
        setIsOpen(false);
      } catch (innerError) {
        console.error('Error resetting panel state:', innerError);
      }
    }
  }, []);

  return {
    isOpen,
    openPanel,
    closePanel,
    togglePanel
  };
};
