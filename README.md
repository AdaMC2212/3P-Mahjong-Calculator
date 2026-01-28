# 🀄 3P Mahjong Calculator

A web-based utility designed to simplify score calculation and settlement for 3-player Mahjong games. This application handles the specific scoring rules and payout structures unique to 3-player variants, ensuring accurate and quick calculations at the end of every hand.

🔗 **Live Demo:** [3p-mahjong-calculator.vercel.app](https://3p-mahjong-calculator.vercel.app)

## 🚀 Features

* **Automated Scoring:** Instantly calculates the total payout/loss for each player based on hand value and win type (Self-draw vs. Discard).
* **3-Player Support:** Specifically tailored for the 3-player format, accounting for the absence of the North seat and other rule variations.
* **Settlement Management:** Tracks the "amount" or monetary equivalent for settlements between players.
* **User-Friendly Interface:** Clean and responsive design for easy input during gameplay.

## 🛠️ Tech Stack

* **Language:** TypeScript
* **Framework:** React
* **Styling:** CSS / HTML
* **Deployment:** Vercel

## 📂 Project Structure

* `/components` - Reusable UI components for the calculator interface.
* `/services` - Core logic for scoring algorithms and calculation.
* `/constants.ts` - definitions of scoring tables and game rules.
