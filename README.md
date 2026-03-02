# 💧 Madzi-Watcher-Backend

Madzi-Watcher-Backend is a Node.js + Express backend system that powers an IoT-based Automated Water Quality Monitoring Platform using ESP32 devices and an MQTT broker.

The system collects real-time water quality data (Turbidity, pH, TDS, EC, Temperature, etc.) from ESP32 devices deployed at water treatment plants. The data is transmitted via MQTT to the backend, stored in MongoDB, processed, and analyzed using Water Quality Index (WQI) calculations.

This platform is designed to support water boards in Malawi by enabling real-time monitoring, automated alerts, and intelligent decision-making for water treatment operations.

---

## SYSTEM ARCHITECTURE OVERVIEW

1. ESP32 reads water quality sensors.
2. ESP32 publishes sensor data to MQTT broker.
3. Backend subscribes to MQTT topic.
4. Data is validated and stored in MongoDB.
5. Water Quality Index (WQI) is calculated.
6. Alerts are triggered if thresholds are exceeded.
7. Frontend dashboard receives real-time updates via WebSocket.

---

## PROJECT STRUCTURE

├── LICENSE
├── package.json
├── package-lock.json
├── README.md
└── src
├── config
│ ├── db.mjs
│ └── session.mjs
├── controllers
│ ├── authController.mjs
│ ├── notificationController.mjs
│ ├── waterMonitorController.mjs
│ └── waterQualityController.mjs
├── index.mjs
├── middleware
│ ├── authMiddleware.mjs
│ ├── errorHandler.mjs
│ ├── roleMiddleware.mjs
│ ├── socketMiddleware.mjs
│ └── validateRequest.mjs
├── models
│ ├── Employee.mjs
│ ├── IdentityVerificationSession.mjs
│ ├── Notification.mjs
│ ├── Otp.mjs
│ ├── RefreshToken.mjs
│ ├── WaterMonitors.mjs
│ └── WaterQualityData.mjs
├── routes
│ ├── authRoutes.mjs
│ ├── notificationRoutes.mjs
│ ├── waterMonitorRoutes.mjs
│ └── waterQualityRoutes.mjs
├── seed
│ └── employeeSeeder.mjs
├── services
│ └── mqttService.mjs
├── sockets
│ └── notificationSocket.mjs
└── utils
├── helpers.mjs
├── jwt.mjs
├── multerConfig.mjs
├── sendEmail.mjs
├── smsSender.mjs
└── validators.mjs

---

## CORE FUNCTIONALITIES

Authentication & Role Management

- JWT-based authentication
- Role-based access control
- Refresh token system
- OTP verification
- Identity verification sessions

Water Quality Monitoring

- Receives real-time sensor data via MQTT
- Stores water quality readings in MongoDB
- Computes Water Quality Index (WQI)
- Tracks monitor device information
- Provides API for dashboard visualization

Water Quality Index (WQI)
The backend calculates WQI based on:

- Turbidity
- pH
- TDS
- Electrical Conductivity (EC)
- Temperature

WQI Categories:

- 0–50 → Excellent
- 51–100 → Good
- 101–200 → Poor
- 201–300 → Very Poor
- > 300 → Unsuitable for drinking

Notification System

- Email alerts
- SMS alerts
- Real-time WebSocket notifications
- MQTT control messaging to devices

MQTT Integration

- Subscribes to sensor topic
- Publishes control commands
- Handles secure IoT communication

---

## INSTALLATION GUIDE

1️ Clone the Repository

git clone https://github.com/your-username/Madzi-Watcher-Backend.git
cd Madzi-Watcher-Backend

2️ Install Dependencies

npm run install

OR

npm install

3️ Create Environment File

Create a .env file in the root directory and add:

MONGO_URL_CLASTER=mongodb://localhost:27017/Madzi-Watcher
MONGO_URI_CAMPUSS=mongodb://localhost:27017/Madzi-Watcher
SUPER_ADMIN_EMAIL=superadmin@madzi.com
SUPER_ADMIN_PASSWORD=superadminpassword
RESEND_API_KEY=
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
PORT=5000
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
MQTT_CLIENT_ID=madzi-watcher-backend-001
MQTT_BROKER=mqtt://broker.hivemq.com
MQTT_TOPIC_SENSOR=waterquality/sensor
MQTT_TOPIC_CONTROL=waterquality/control

4️⃣ Run in Development Mode

npm run dev

(Uses nodemon for automatic restart)

5️⃣ Run in Production

npm start

---

## 📡 MQTT CONFIGURATION

Sensor Topic:
waterquality/sensor

Expected JSON Payload Example:

{
"deviceId": "ESP32-001",
"turbidity": 6.4,
"pH": 7.2,
"tds": 540,
"ec": 800,
"temperature": 26.5
}

Control Topic:
waterquality/control

Used to:

- Activate solenoid valve
- Trigger alarm
- Reset device
- Send remote commands to ESP32

---

## DATABASE MODELS

Employee
WaterMonitors
WaterQualityData
Notification
Otp
RefreshToken
IdentityVerificationSession

Stores:

- Sensor readings
- Device metadata
- User accounts
- Alerts history
- Authentication sessions

---

## SECURITY FEATURES

- JWT authentication
- Role-based access control
- Centralized error handling
- Request validation middleware
- Secure session management

---

## REAL-TIME FEATURES

- WebSocket live notifications
- MQTT live data subscription
- Instant dashboard updates

---

## SEEDING SUPER ADMIN

node src/seed/employeeSeeder.mjs

---

## TECHNOLOGIES USED

- Node.js
- Express.js
- MongoDB + Mongoose
- MQTT.js
- WebSocket
- JWT
- Nodemailer
- SMS Gateway Integration
- ES Modules (.mjs)
- Nodemon

---

## PROJECT VISION

Madzi-Watcher aims to:

- Improve water quality monitoring in Malawi
- Enable real-time surveillance of treatment plants
- Support water boards with automated alerts
- Reduce waterborne disease risks
- Provide data-driven decision support using WQI
- Enable scalable IoT infrastructure for national deployment

---

## CONTRIBUTING

For new collaborators:

1. Clone the repository
2. Run npm install
3. Configure .env
4. Run npm run dev

Before pushing changes:

git checkout -b feature/your-feature-name

Then push your branch.

---

## LICENSE

This project is licensed under the MIT License.
