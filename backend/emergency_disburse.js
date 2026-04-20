require('dotenv').config();
const mongoose = require('mongoose');
const Loan = require('./models/Loan');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const pendingLoans = await Loan.find({ status: 'pending' });
  console.log(`Found ${pendingLoans.length} pending loans. Forcing approval...`);

  for (const loan of pendingLoans) {
    try {
      const user = await User.findById(loan.user);
      if (!user) continue;

      // 1. Update Wallet
      user.walletBalance = (user.walletBalance || 0) + loan.principalAmount;
      await user.save();

      // 2. Record Transaction
      await Transaction.create({
        userId: user._id,
        plaidTransactionId: `LOAN-SANCTION-${loan._id}-${Date.now()}`,
        accountId: 'NEXUS-WALLET',
        name: `Loan Sanction: ${loan.purpose}`,
        amount: -loan.principalAmount,
        date: new Date(),
        category: ['Transfer', 'Internal'],
        pending: false,
      });

      // 3. Update Loan
      loan.status = 'active';
      loan.timeline.push({
        status: 'active',
        notes: `Nexus Elite Status detected. Immediate sanction and disbursement processed.`,
        timestamp: new Date()
      });
      await loan.save();
      console.log(`✅ Approved and Disbursed: ${loan._id} ($${loan.principalAmount}) for ${user.name}`);
    } catch (err) {
      console.error(`❌ Failed: ${loan._id}: ${err.message}`);
    }
  }

  process.exit(0);
}

fix();
