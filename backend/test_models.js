require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(name) {
  try {
    console.log(`Testing ${name}...`);
    const model = genAI.getGenerativeModel({ model: name });
    const result = await model.generateContent("Hello");
    console.log(`✅ Success with ${name}`);
    return true;
  } catch (err) {
    console.error(`❌ Failure with ${name}: ${err.message}`);
    return false;
  }
}

async function runTests() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-1.5-pro");
  await testModel("gemini-pro");
  await testModel("models/gemini-1.5-flash");
}

runTests();
