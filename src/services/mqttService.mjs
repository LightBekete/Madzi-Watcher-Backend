// src/services/mqttService.mjs
import mqtt from 'mqtt';
import dotenv from 'dotenv';
import WaterQualityData from '../models/WaterQualityData.mjs';
// import { calculateWQI } from '../utils/wqiCalculator.mjs'
dotenv.config();

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const MQTT_TOPIC_SENSOR = process.env.MQTT_TOPIC_SENSOR || 'waterquality/sensor';
const MQTT_TOPIC_CONTROL = process.env.MQTT_TOPIC_CONTROL || 'waterquality/control';
const MQTT_PORT = process.env.MQTT_PORT || 1883;  
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || `madzi-watcher-backend-${Math.random().toString(16).slice(3)}`;
const MQTT_USERNAME = process.env.MQTT_USERNAME || null;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || null;  

let ioInstance; // Will be set from server.mjs

console.log(`[MQTT] Connecting to broker at ${MQTT_BROKER}:${MQTT_PORT} with client ID ${MQTT_CLIENT_ID}`); 

const mqttClient = mqtt.connect(`${MQTT_BROKER}:${MQTT_PORT}`,{
  username: process.env.MQTT_USERNAME, // Optional: for authenticated brokers
  password: process.env.MQTT_PASSWORD, //Optional: for authenticated brokers
  clientId: MQTT_CLIENT_ID,
  clean: true,
  protocol: 'mqtt', // Use 'mqtts' for secure connection, 'mqtt' for unencrypted
  reconnectPeriod: 1000,
  rejectUnauthorized: false,   // Allow HiveMQ's certificate
  connectTimeout: 4000,       // Increase to 20 seconds for the cloud hop
  keepalive: 60,
});

mqttClient.on('connect', () => {
  console.log('[MQTT] Connected to broker');
  
  mqttClient.subscribe(MQTT_TOPIC_SENSOR, (err) => {
    if (err) {
      console.error('[MQTT] Subscribe error (sensor):', err);
    } else {
      console.log(`[MQTT] Subscribed to ${MQTT_TOPIC_SENSOR}`);
    }
  });

  mqttClient.subscribe(MQTT_TOPIC_CONTROL, (err) => {
    if (err) {
      console.error('[MQTT] Subscribe error (control):', err);
    } else {
      console.log(`[MQTT] Subscribed to ${MQTT_TOPIC_CONTROL}`);
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    if (topic === MQTT_TOPIC_SENSOR) {
      const {
        deviceId,
        turbidity,
        pH,
        tds,
        waterQualityIndex,
        electricalConductivity,
        anomaly,
        location = { district: 'Unknown', treatmentPlantId: 'N/A' }
      } = payload;

      if (
        typeof turbidity !== 'number' ||
        typeof pH !== 'number' ||
        typeof tds !== 'number' ||
        typeof waterQualityIndex !== 'number' ||
        typeof electricalConductivity !== 'number'
      ) {
        console.warn('[MQTT] Invalid sensor data:', payload);
        return;
      }

      const newReading = new WaterQualityData({
        deviceId,
        turbidity,
        pH,
        tds,
        waterQualityIndex,
        electricalConductivity,
        time: new Date(),
        anomaly,
        location,
      });

      await newReading.save();
      console.log('[MQTT] Saved reading:', newReading._id);

      // Real-time push via Socket.io
      if (ioInstance) {
        ioInstance.emit('water-quality-data', {
          deviceId: newReading.deviceId,
          turbidity: newReading.turbidity ?? null,
          pH: newReading.pH ?? null,                    // map pH → ph
          tds: newReading.tds ?? null,
          electricalConductivity: newReading.electricalConductivity ?? null,
          waterQualityIndex: newReading.waterQualityIndex ?? null,
          location: newReading.location,
          timestamp: newReading.times 
        });
      }
    }

    // Optional: handle valve feedback
    if (topic === MQTT_TOPIC_CONTROL) {
      console.log('[MQTT] Valve feedback:', payload);
      if (ioInstance) {
        ioInstance.emit('valveStatus', payload);
      }
    }
  } catch (err) {
    console.error('[MQTT] Message processing error:', err);
  }
});

mqttClient.on('error', (err) => {
  console.error('[MQTT] Client error:', err);
});

mqttClient.on('reconnect', () => {
  console.log('[MQTT] Reconnecting...');
});

mqttClient.on('offline', () => {
  console.log('[MQTT] Offline');
});

// Export both client and setter function
export const mqttService = {
  client: mqttClient,
  setSocketIo: (socketIoInstance) => {
    ioInstance = socketIoInstance;
  },
};