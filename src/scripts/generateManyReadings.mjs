import mqtt from 'mqtt';
import dotenv from 'dotenv';
dotenv.config();

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const TOPIC = 'waterquality/sensor';

const districts = ['Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba'];
const plants = ['TP-01', 'TP-02', 'TP-03', 'TP-04'];

const generateRandomReading = () => {
  const district = districts[Math.floor(Math.random() * districts.length)];
  const plant = plants[Math.floor(Math.random() * plants.length)];
  
  return {
    deviceId: 'WM-1002',
    pH: parseFloat((6.5 + Math.random() * 2).toFixed(1)),
    tds: Math.floor(200 + Math.random() * 300),
    electricalConductivity: Math.floor(600 + Math.random() * 600),
    turbidity: parseFloat((0.5 + Math.random() * 5).toFixed(1)),
    waterQualityIndex: Math.floor(60 + Math.random() * 40),
    location: { 
      district: district, 
      treatmentPlantId: plant 
    },
    anomaly: {
      detected: false,
      pH: false,
      tds: false,
      turbidity: false,
      electricalConductivity: false
    }
  };
};

console.log(`🔌 Connecting to MQTT broker at ${MQTT_BROKER}...`);

const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  console.log('📤 Generating 50 random readings...\n');
  
  let count = 0;
  const total = 50;
  
  const interval = setInterval(() => {
    if (count >= total) {
      clearInterval(interval);
      console.log('\n✅ Done! Published 50 readings');
      client.end();
      process.exit(0);
      return;
    }
    
    const reading = generateRandomReading();
    const payload = JSON.stringify(reading);
    
    client.publish(TOPIC, payload, (err) => {
      if (err) {
        console.error(`❌ Failed to publish reading ${count + 1}:`, err);
      } else {
        console.log(`✅ Published ${count + 1}/50: pH=${reading.pH}, TDS=${reading.tds}, WQI=${reading.waterQualityIndex}, District=${reading.location.district}`);
      }
    });
    
    count++;
  }, 500); // Publish every 500ms
});

client.on('error', (err) => {
  console.error('MQTT Error:', err);
  process.exit(1);
});