/**
 * Utility functions for managing project invite codes
 */
const crypto = require('crypto');
const Project = require('../models/Project');

/**
 * Generate a unique invite code
 * @returns {string} A unique uppercase hex string
 */
exports.generateInviteCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

/**
 * Validates that an invite code is properly formatted
 * @param {string} code - The invite code to validate
 * @returns {boolean} Whether the code is valid
 */
exports.validateInviteCodeFormat = (code) => {
  // Check if code is a 6-character uppercase hex string
  return /^[0-9A-F]{6}$/.test(code);
};

/**
 * Check and fix missing invite codes for projects
 * This is a maintenance function that can be run to ensure all projects have valid invite codes
 */
exports.ensureAllProjectsHaveInviteCodes = async () => {
  try {
    // Find all projects without an invite code
    const projectsWithoutCode = await Project.find({
      $or: [
        { inviteCode: { $exists: false } },
        { inviteCode: null },
        { inviteCode: '' }
      ]
    });

    console.log(`Found ${projectsWithoutCode.length} projects without invite codes`);
    
    // Generate and save invite codes for each project
    for (const project of projectsWithoutCode) {
      project.inviteCode = exports.generateInviteCode();
      await project.save();
      console.log(`Generated invite code ${project.inviteCode} for project ${project._id}`);
    }
    
    return {
      success: true,
      count: projectsWithoutCode.length
    };
  } catch (error) {
    console.error('Error ensuring invite codes:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
