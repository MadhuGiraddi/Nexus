const axios = require('axios');

async function verifyGating() {
  const BASE_URL = 'http://localhost:5000/api';
  
  console.log('--- CA GATE VERIFICATION ---');

  try {
    // 1. Create a fresh user
    const email = `test_gate_${Date.now()}@test.com`;
    console.log(`[TEST] Registering new user: ${email}`);
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Tester',
      email: email,
      password: 'password123'
    });
    
    const token = regRes.data.token;
    const user = regRes.data.user;
    console.log(`[TEST] Registered. isSubscribed: ${user.isSubscribed}`);

    // 2. Attempt to fetch CA Directory (SHOULD FAIL)
    console.log('[TEST] Attempting to access CA Directory directly...');
    try {
      await axios.get(`${BASE_URL}/ca`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.error('❌ FAILURE: Access was allowed for unsubscribed user!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ SUCCESS: Access blocked with 403 Forbidden (Premium required).');
      } else {
        console.error(`❌ FAILURE: Expected 403, got ${err.response?.status}`);
      }
    }

    // 3. Mock Payment (Upgrade)
    console.log('[TEST] Performing mock upgrade (₹999)...');
    const subRes = await axios.post(`${BASE_URL}/auth/subscribe`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`[TEST] Upgrade result: ${subRes.data.success}. New isSubscribed: ${subRes.data.user.isSubscribed}`);

    // 4. Attempt to fetch CA Directory again (SHOULD PASS)
    console.log('[TEST] Attempting to access CA Directory after payment...');
    const caRes = await axios.get(`${BASE_URL}/ca`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ SUCCESS: Access allowed! Found ${caRes.data.cas.length} CA profiles.`);

  } catch (err) {
    console.error('❌ TEST ERROR:', err.message);
    if (err.response) console.error('Response:', err.response.data);
  }
}

verifyGating();
