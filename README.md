🚀 AI Crypto Advisor
A full-stack personalized crypto dashboard that delivers daily AI-curated content based on user preferences.


🔗 Live App:
https://moveo-task-nu.vercel.app


🧠 What It Does

Users complete a short onboarding flow selecting:
Crypto assets of interest
Investor type (HODLer, Day Trader, NFT Collector)
Preferred content types


Based on these inputs, the app generates a daily personalized dashboard including:
📰 Market News (CryptoPanic API)
💰 Coin Prices (CoinGecko API)
🤖 AI Insight of the Day (LLM via OpenRouter)
😄 Dynamic Crypto Meme

Users can provide 👍 / 👎 feedback per section.
Votes are stored in MongoDB and designed to support future recommendation improvements.


🏗 Architecture

Frontend:
React + TypeScript
Vite
TailwindCSS
React Router


Backend:
Node.js + Express
TypeScript
MongoDB Atlas
JWT Authentication

Deployment:
Frontend: Vercel
Backend: Render


✨ Key Design Decisions

Daily caching for News, Prices, and AI Insight to simulate a “curated daily feed”
Dynamic meme for freshness
Section-level voting stored per user per day
Clean protected routing with onboarding guard


🤖 AI Usage

ChatGPT was used for:
Architecture validation
Backend logic refinement
Deployment troubleshooting
UX improvements

All core implementation and debugging were handled manually.


📦 How to Run Locally

Backend:

cd server,
npm install,
npm run dev


Add a .env file with:

MONGO_URI=your_mongodb_uri,
JWT_SECRET=your_secret,
OPENROUTER_API_KEY=your_key,
CRYPTOPANIC_TOKEN=your_token,

Frontend:

cd client,
npm install,
npm run dev,

Make sure VITE_API_URL points to your backend


