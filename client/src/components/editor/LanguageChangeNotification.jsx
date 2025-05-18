import React, { useState, useEffect, useCallback } from 'react';

const LanguageChangeNotification = ({ language }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastLanguage, setLastLanguage] = useState(language);
  const [animationClass, setAnimationClass] = useState('animate-fade-in');
  const [currentTimers, setCurrentTimers] = useState([]);
  
  // Clear all active timers (used when component unmounts or language changes quickly)
  const clearAllTimers = useCallback(() => {
    currentTimers.forEach(timer => clearTimeout(timer));
    setCurrentTimers([]);
  }, [currentTimers]);
  
  useEffect(() => {
    if (language !== lastLanguage) {
      // Clear any existing timers to prevent flickering
      clearAllTimers();
      
      // Show notification with fade-in animation
      setAnimationClass('animate-fade-in');
      setIsVisible(true);
      setLastLanguage(language);
      
      // Set fade-out animation before hiding
      const fadeOutTimer = setTimeout(() => {
        setAnimationClass('animate-fade-out');
      }, 1500); // fade out after 1.5s
      
      // Hide notification after fade-out animation
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2000); // fully hide after 2s
      
      // Store timers to clear them if language changes again quickly
      setCurrentTimers([fadeOutTimer, hideTimer]);
      
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [language, lastLanguage, clearAllTimers]);

  // Always hide after fade-out, even if fade-out is triggered by close button
  useEffect(() => {
    if (animationClass === 'animate-fade-out') {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [animationClass]);

  if (!isVisible) return null;
  return null;
};

export default LanguageChangeNotification;
