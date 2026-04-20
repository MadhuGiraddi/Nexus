require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Transaction.deleteMany({ name: /Loan/, amount: { $ne: -60000 } });
  await Transaction.updateOne({ amount: -60000 }, { $set: { amount: -(60000 / 83.5) } });
  console.log('Cleaned up Feed');
  process.exit(0);
});
