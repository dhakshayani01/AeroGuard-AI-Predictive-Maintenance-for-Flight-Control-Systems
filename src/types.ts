export interface SensorData {
  timestamp: number;
  vibration: number;
  hydraulicPressure: number;
  temperature: number;
  actuatorPosition: number;
  aileronAngle: number;
  rudderAngle: number;
  elevatorAngle: number;
}

export interface Anomaly {
  id: string;
  timestamp: number;
  type: 'Vibration' | 'Pressure' | 'Temperature' | 'Actuator';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  component: string;
  value: number;
}

export interface SystemHealth {
  overall: number;
  subsystems: {
    ailerons: number;
    rudder: number;
    elevators: number;
    hydraulics: number;
  };
}
