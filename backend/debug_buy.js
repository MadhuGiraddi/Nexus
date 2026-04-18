const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/patil/.antigravity/nexus/backend/.env' });

async function debugBackend() {
  console.log("--- NEXUS BACKEND INTEGRATION DEBUG ---");
  
  // 1. Connect to DB
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database Connected");
  } catch (e) {
    console.error("❌ DB Connection Failed:", e.message);
    return;
  }

  const User = require('./models/User');
  const user = await User.findOne();
  if (!user) return console.log("❌ No user found");
  
  console.log(`👤 Testing for user: ${user.email} (Balance: $${user.walletBalance})`);

  // 2. Mock a JWT
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  console.log("✅ Mock JWT Created");

  // 3. Trigger /invest/buy via Axios (using localhost)
  const port = process.env.PORT || 5000;
  const baseUrl = `http://localhost:${port}/api/invest/buy`;
  
  console.log(`🌐 Calling ${baseUrl}...`);
  try {
    const res = await axios.post(baseUrl, 
      { symbol: 'AAPL', quantity: 1, price: 150, broker: 'Nexus Debug' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("🚀 SUCCESS:", res.data);
  } catch (e) {
    console.error("🔥 FAILED:", e.response?.data || e.message);
  }

  process.exit(0);
}

debugBackend();
