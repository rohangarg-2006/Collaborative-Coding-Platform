/**
 * Script to manually seed sessions for testing
 */
require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors');
const connectDB = require('./config/db');
const { seedRandomSessions } = require('./utils/seedSessions');

// Connect to the database
connectDB();

// Run the seeding function
const seedData = async () => {
  try {
    console.log('Starting session seeding...'.yellow);
    await seedRandomSessions();
    console.log('Sessions seeded successfully!'.green);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding sessions:'.red, error);
    process.exit(1);
  }
};

// Run the seeding
seedData();
