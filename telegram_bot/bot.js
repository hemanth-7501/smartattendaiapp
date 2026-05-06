require('dotenv').config({ path: '../smartattendai_backend/.env' });
const TelegramBot = require('node-telegram-bot-api');

// Read the token from the .env file
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not defined in the .env file.");
  process.exit(1);
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

console.log("SmartAttend AI Telegram Bot is running...");

// Listen for the /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Welcome to SmartAttend AI Bot!");
});

// Listen for any kind of message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  
  // Skip if it's a command
  if (text.startsWith('/')) {
    return;
  }

  // Handle messages related to the SmartAttend AI project
  const lowerText = text.toLowerCase();
  
  let responseMessage = `Message received: ${text}`;
  
  if (lowerText.includes('attendance')) {
    responseMessage += `\n\n[SmartAttend AI]: Your child is currently marked as "Present" for today's classes.`;
  } else if (lowerText.includes('report') || lowerText.includes('progress')) {
    responseMessage += `\n\n[SmartAttend AI]: Academic Report: Your child has a 95% overall attendance rate this semester.`;
  } else if (lowerText.includes('absent') || lowerText.includes('leave')) {
    responseMessage += `\n\n[SmartAttend AI]: Leave request noted. Please ensure you also submit a formal application via the Parent Dashboard.`;
  } else {
    // General SmartAttend AI context for any other message
    responseMessage += `\n\n[SmartAttend AI]: If you have specific queries about your child's attendance or academic progress, just ask!`;
  }
  
  bot.sendMessage(chatId, responseMessage);
});
