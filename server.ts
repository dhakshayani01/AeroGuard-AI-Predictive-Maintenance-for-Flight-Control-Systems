import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Sensor Simulation State
  let sensorState = {
    vibration: 0.5,
    hydraulicPressure: 3000, // PSI
    temperature: 45, // Celsius
    actuatorPosition: 0,
    aileronAngle: 0,
    rudderAngle: 0,
    elevatorAngle: 0,
  };

  // Generate simulated data
  function generateData() {
    const noise = (amt: number) => (Math.random() - 0.5) * amt;
    
    // Normal fluctuations
    sensorState.vibration = Math.max(0.1, 0.5 + noise(0.2));
    sensorState.hydraulicPressure = 3000 + noise(50);
    sensorState.temperature = 45 + noise(2);
    sensorState.actuatorPosition = Math.sin(Date.now() / 5000) * 10;
    
    // Random Anomaly Injection (1% chance)
    if (Math.random() < 0.01) {
      const type = Math.random();
      if (type < 0.25) sensorState.vibration += 2.5; // Vibration spike
      else if (type < 0.5) sensorState.hydraulicPressure -= 800; // Pressure drop
      else if (type < 0.75) sensorState.temperature += 30; // Overheating
      else sensorState.actuatorPosition = 25; // Actuator jam
    }

    return {
      timestamp: Date.now(),
      ...sensorState
    };
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "operational", version: "1.0.0-enterprise" });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`AeroGuard Server running on http://localhost:${PORT}`);
  });

  // WebSocket for real-time data
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected to telemetry stream");
    
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'TELEMETRY', data: generateData() }));
      }
    }, 1000);

    ws.on("close", () => clearInterval(interval));
  });
}

startServer();
