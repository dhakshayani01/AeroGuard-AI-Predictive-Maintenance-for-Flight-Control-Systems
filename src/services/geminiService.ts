import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnomalyReport {
  sensorType: string;
  value: number;
  threshold: number;
  timestamp: string;
  component: string;
}

export async function analyzeAnomaly(report: AnomalyReport) {
  if (!process.env.GEMINI_API_KEY) return "AI analysis unavailable (API Key missing).";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview",
      contents: `Analyze this aircraft flight control system anomaly:
      Component: ${report.component}
      Sensor: ${report.sensorType}
      Value: ${report.value}
      Threshold: ${report.threshold}
      Timestamp: ${report.timestamp}

      Provide:
      1. Probable Root Cause (Aerospace engineering perspective)
      2. Recommended Maintenance Action
      3. Criticality Level (Low, Medium, High, Critical)
      4. Estimated Remaining Useful Life (RUL) impact.`,
      config: {
        systemInstruction: "You are a Senior Aerospace Systems Engineer and AI Maintenance Specialist. Provide technical, concise, and actionable insights for flight control systems.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate AI insights.";
  }
}
