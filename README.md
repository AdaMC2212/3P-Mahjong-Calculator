# 🀄 3P Mahjong Calculator

A web-based utility designed to simplify score calculation and settlement for 3-player Mahjong games. This application handles the specific scoring rules and payout structures unique to 3-player variants, ensuring accurate and quick calculations at the end of every hand.

🔗 **Live Demo:** [3p-mahjong-calculator.vercel.app](https://3p-mahjong-calculator.vercel.app)
***
## 🀄 Key Features & Functions

### 🧮 Smart Scoring Engine
* **3-Player Logic:** specifically tuned for 3-player Mahjong variants (removing the North wind player), ensuring accurate point calculations that standard 4-player calculators miss.
* **Win Type Detection:** Differentiates between **Self-Draw (Zimo)** and **Discard (Ron)**, automatically adjusting payouts (e.g., in Zimo, both losing players pay; in Ron, only the discarder pays).
* **Fan/Tai Support:** Flexible input allows you to calculate scores based on your specific house rules (supports standard Fan/Tai limits).

### 💸 Automated Settlement
* **Instant Net Calculation:** No need for manual math—instantly see exactly how much each player wins or loses after every hand.
* **Session Tracking:** Keeps a running total of the session, so you can easily settle debts at the end of the game without writing scores on paper.

### 📱 User Experience
* **Mobile-First Design:** Large, friendly buttons and inputs designed for quick entry on a phone while at the Mahjong table.
* **Reset & Undo:** Quickly reset the round or clear data to start fresh. Clean and responsive design for easy input during gameplay.
***
## 🛠️ Tech Stack

* **Language:** TypeScript
* **Framework:** React
* **Styling:** CSS / HTML
* **Deployment:** Vercel
***
## 📂 Project Structure

* `/components` - Reusable UI components for the calculator interface.
* `/services` - Core logic for scoring algorithms and calculation.
* `/constants.ts` - definitions of scoring tables and game rules.
