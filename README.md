# AeroGuard AI: Predictive Maintenance for Flight Control Systems

AeroGuard AI is a production-ready, full-stack platform designed for real-time monitoring and failure prediction of aircraft flight control systems (Ailerons, Rudder, Elevators, Actuators, Hydraulics).

## 🚀 Key Features

- **Real-time Telemetry Stream**: High-frequency sensor data visualization (Vibration, Pressure, Temperature).
- **AI-Driven Diagnostics**: Powered by Gemini 2.5 Flash for root cause analysis and maintenance recommendations.
- **Anomaly Detection**: Automated detection of sensor spikes, drops, and drifts.
- **Enterprise Dashboard**: Modern, high-density UI for senior aerospace engineers.
- **Remaining Useful Life (RUL)**: Predictive modeling for component longevity.

## 🛠 Tech Stack

- **Frontend**: React, Tailwind CSS, Recharts, Motion.
- **Backend**: Node.js (Express), WebSockets (ws), tsx.
- **AI**: Google Gemini API (@google/genai).
- **Styling**: Modern dark-mode "Hardware" aesthetic.

## 💡 Innovative "Patent-Worthy" Features

1. **Cross-Fleet Anomaly Correlation**: Identifies systemic degradation across multiple aircraft batches.
2. **Flight Phase Contextualization**: Dynamic thresholding based on Takeoff, Cruise, and Landing loads.
3. **Digital Twin Sync**: Real-time physical-to-virtual state mirroring.
4. **Immutable Audit Trail**: Blockchain-ready maintenance logging for regulatory compliance.

## 📦 Setup & Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   Create a `.env` file with:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Dashboard**:
   Open `http://localhost:3000` in your browser.

---
*Developed for AI Studio Build - Enterprise Aerospace Solutions.*
