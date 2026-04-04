/**
 * Utility to seed random sessions for projects
 */
const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const Session = require('../models/Session');

/**
 * Creates random sessions for projects that don't have any
 */
const seedRandomSessions = async () => {
  try {
    console.log('Starting to seed random sessions for projects...');
    
    // Get all projects
    const projects = await Project.find();
    console.log(`Found ${projects.length} projects to process`);
    
    // Get all users for random assignment
    const users = await User.find();
    
    if (users.length === 0) {
      console.log('No users found. Cannot create sessions.');
      return;
    }
    
    let sessionsCreated = 0;
    
    for (const project of projects) {
      // Check if project already has sessions
      const existingSessions = await Session.countDocuments({ project: project._id });
        // If project has 5 or more sessions, check if at least one is active
      if (existingSessions >= 5) {
        const activeSession = await Session.findOne({ project: project._id, isActive: true });
        if (activeSession) {
          console.log(`Project ${project._id} already has ${existingSessions} sessions including active ones. Skipping.`);
          continue;
        } else {
          console.log(`Project ${project._id} has ${existingSessions} sessions but none are active. Adding an active session.`);
          // Will continue to create at least one active session
        }
      }
      
      // Generate between 1-5 sessions for each project
      const numSessionsToCreate = Math.floor(Math.random() * 5) + 1;
      console.log(`Creating ${numSessionsToCreate} sessions for project ${project._id}`);
      
      // Get project owner and collaborators for realistic user assignment
      const owner = project.owner;
      const collaborators = project.collaborators.map(c => c.user);
      const allProjectUsers = [owner, ...collaborators].filter(Boolean);
      
      for (let i = 0; i < numSessionsToCreate; i++) {
        // Determine if this session should be active
        const isActive = i === 0; // Make the first session active
        
        // Create random start time between 1-30 days ago
        const daysAgo = isActive ? 0 : Math.floor(Math.random() * 30) + 1;
        const hoursAgo = isActive ? Math.floor(Math.random() * 5) + 1 : 0;
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - daysAgo);
        if (hoursAgo > 0) {
          startTime.setHours(startTime.getHours() - hoursAgo);
        }
        
        // Create end time for inactive sessions
        let endTime = null;
        if (!isActive) {
          // Session lasted 30min - 4 hours
          const durationMs = (Math.floor(Math.random() * 210) + 30) * 60000;
          endTime = new Date(startTime.getTime() + durationMs);
        }
        
        // Select random users for this session
        const sessionUserCount = Math.floor(Math.random() * 3) + 1; // 1-3 users per session
        let sessionUsers = [];
        
        // Prioritize project users, then random users if needed
        if (allProjectUsers.length > 0) {
          // Always include owner in active sessions
          if (isActive && owner) {
            sessionUsers.push({
              userId: owner,
              joinedAt: startTime,
              cursorPosition: { line: 0, column: 0 }
            });
          }
          
          // Add some collaborators
          const availableCollaborators = isActive 
            ? collaborators.filter(Boolean)
            : allProjectUsers.filter(Boolean);
          
          while (sessionUsers.length < sessionUserCount && availableCollaborators.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableCollaborators.length);
            const userId = availableCollaborators.splice(randomIndex, 1)[0];
            
            // Joined a bit after session start
            const joinOffset = Math.floor(Math.random() * 300000); // 0-5 minutes after start
            const joinedAt = new Date(startTime.getTime() + joinOffset);
            
            sessionUsers.push({
              userId,
              joinedAt,
              cursorPosition: {
                line: Math.floor(Math.random() * 30),
                column: Math.floor(Math.random() * 80)
              }
            });
          }
        }
        
        // If we still need more users, add random ones
        while (sessionUsers.length < sessionUserCount) {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          // Avoid duplicates
          if (!sessionUsers.some(u => u.userId.toString() === randomUser._id.toString())) {
            const joinOffset = Math.floor(Math.random() * 300000); // 0-5 minutes after start
            const joinedAt = new Date(startTime.getTime() + joinOffset);
            
            sessionUsers.push({
              userId: randomUser._id,
              joinedAt,
              cursorPosition: {
                line: Math.floor(Math.random() * 30),
                column: Math.floor(Math.random() * 80)
              }
            });
          }
        }
        
        // Generate random chat messages
        const chatMessages = [];
        if (Math.random() > 0.3) { // 70% chance of having chat messages
          const messageCount = Math.floor(Math.random() * 10) + 1; // 1-10 messages
          
          const messageTemplates = [
            "Hey team, I fixed the bug in this section.",
            "Does anyone know how to solve the issue with the API?",
            "I'm working on the authentication module now.",
            "Just pushed some changes to improve performance.",
            "Can someone review this code section?",
            "The new feature is almost complete!",
            "I'm having trouble with the database connection.",
            "Let's discuss the architecture before proceeding.",
            "What do you think about using a different approach here?",
            "Great job on the UI improvements!",
            "I'll be working on this file for the next hour.",
            "Has anyone tested the new endpoint?",
            "Remember to add comments to your code.",
            "Let's schedule a review session tomorrow.",
            "I've updated the documentation."
          ];
          
          for (let j = 0; j < messageCount; j++) {
            // Random time during session
            const startTimeMs = startTime.getTime();
            const endTimeMs = endTime ? endTime.getTime() : Date.now();
            const messageTimeMs = startTimeMs + Math.random() * (endTimeMs - startTimeMs);
            const messageTime = new Date(messageTimeMs);
            
            // Random user from session
            const randomSessionUser = sessionUsers[Math.floor(Math.random() * sessionUsers.length)];
            
            // Random message
            const message = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
            
            chatMessages.push({
              userId: randomSessionUser.userId,
              message,
              timestamp: messageTime
            });
          }
          
          // Sort messages by time
          chatMessages.sort((a, b) => a.timestamp - b.timestamp);
        }
        
        // Create the session
        const sessionData = {
          project: project._id,
          activeUsers: sessionUsers,
          isActive,
          startTime,
          endTime,
          chatMessages
        };
        
        try {
          await Session.create(sessionData);
          sessionsCreated++;
        } catch (err) {
          console.error(`Error creating session for project ${project._id}:`, err);
        }
      }
    }
    
    console.log(`Successfully created ${sessionsCreated} random sessions`);
    
  } catch (err) {
    console.error('Error seeding random sessions:', err);
  }
};

module.exports = { seedRandomSessions };
