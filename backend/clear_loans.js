require('dotenv').config();
const mongoose = require('mongoose');
const Loan = require('./models/Loan');

async function clearLoans() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const result = await Loan.deleteMany({});
    console.log(`🗑️ Successfully deleted ${result.deletedCount} loan records.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error clearing loans:', err.message);
    process.exit(1);
  }
}

clearLoans();
