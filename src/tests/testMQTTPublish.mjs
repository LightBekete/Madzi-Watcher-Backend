import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

// MQTT Configuration from .env
const MQTT_BROKER = process.env.MQTT_BROKER;           // e.g. "your-cluster-id.s2.eu.hivemq.cloud"
const MQTT_PORT = parseInt(process.env.MQTT_PORT) || 8883;
const MQTT_USER = process.env.MQTT_USERNAME;
const MQTT_PASS = process.env.MQTT_PASSWORD;

const MQTT_TOPIC_SENSOR = process.env.MQTT_TOPIC_SENSOR || "waterquality/sensor";

if (!MQTT_BROKER || !MQTT_USER || !MQTT_PASS) {
  console.error("❌ Missing MQTT credentials in .env file");
  process.exit(1);
}

// Better connection options for HiveMQ Cloud
const options = {
  username: MQTT_USER,
  password: MQTT_PASS,
  clientId: `TEST-PUBLISHER-${Math.random().toString(16).substring(2, 10)}`,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 15000,           // Increased timeout
  keepalive: 60,
  rejectUnauthorized: false,       // For testing with self-signed / Let's Encrypt certs
  protocolVersion: 4,              // MQTT 3.1.1 (most stable)
};

console.log(`🔌 Connecting to ${MQTT_BROKER}:${MQTT_PORT}...`);

const client = mqtt.connect(`${MQTT_BROKER}:${MQTT_PORT}`, options);

client.on("connect", () => {
  console.log("✅ Successfully connected to MQTT Broker");

  const sensorPayload = {
    deviceId: "WM-1002",
    pH: Number((Math.random() * 1.4 + 6.8).toFixed(1)),           // 6.8 - 8.2
    tds: Math.floor(Math.random() * 251 + 200),                   // 200 - 450
    electricalConductivity: Math.floor(Math.random() * 601 + 800), // 800 - 1400
    turbidity: Number((Math.random() * 7.5 + 0.5).toFixed(1)),    // 0.5 - 8.0
    waterQualityIndex: Math.floor(Math.random() * 26 + 70),       // 70 - 95
    location: {
      district: "Blantyre",
      treatmentPlantId: "TP-02"
    },
    anomaly: {
      detected: false,
      pH: false,
      tds: false,
      turbidity: false,
      electricalConductivity: false
    }
  };

  client.publish(
    MQTT_TOPIC_SENSOR,
    JSON.stringify(sensorPayload),
    { qos: 1, retain: false },
    (err) => {
      if (err) {
        console.error("❌ Publish error:", err);
      } else {
        console.log("📤 Sensor data published successfully!");
        console.log("Payload:", sensorPayload);
      }

      // Close connection after publishing
      setTimeout(() => {
        client.end();
        console.log("🔌 Connection closed.");
      }, 1000);
    }
  );
});

client.on("error", (err) => {
  console.error("❌ MQTT Error:", err.message);
});

client.on("reconnect", () => {
  console.log("🔄 Attempting to reconnect...");
});

client.on("offline", () => {
  console.log("📴 Client is offline");
});