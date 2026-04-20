require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const list = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels(); // This might not be the right utility
    // The correct way in the SDK:
    // const results = await genAI.listModels(); // This also might be different
    console.log("Checking API...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Success with gemini-1.5-flash", result.response.text());
  } catch (err) {
    console.error("Error:", err.message);
  }
}

listModels();
