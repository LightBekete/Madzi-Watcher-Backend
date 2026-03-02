# 💧 Madzi-Watcher-Backend

Madzi-Watcher-Backend is a Node.js and Express-based backend system designed to power an IoT-driven Automated Water Quality Monitoring Platform using ESP32 devices and an MQTT broker.

The system collects real-time water quality parameters such as Turbidity, pH, TDS, Electrical Conductivity (EC), and Temperature from ESP32 devices deployed at water treatment facilities. Sensor data is transmitted through MQTT, processed by the backend, stored in MongoDB, and analyzed using Water Quality Index (WQI) computation.

This platform supports water boards and treatment plants in Malawi by enabling real-time monitoring, automated alerts, and data-driven decision-making.

---

## System Architecture Overview

1. ESP32 reads water quality sensors.
2. Sensor readings are published to an MQTT broker.
3. The backend subscribes to the configured MQTT topic.
4. Incoming data is validated and stored in MongoDB.
5. Water Quality Index (WQI) is calculated.
6. Notifications are triggered when thresholds are exceeded.
7. The frontend dashboard receives real-time updates via WebSocket.

---

## Project Structure

```
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
└── src
    ├── config
    │   ├── db.mjs
    │   └── session.mjs
    ├── controllers
    │   ├── authController.mjs
    │   ├── notificationController.mjs
    │   ├── waterMonitorController.mjs
    │   └── waterQualityController.mjs
    ├── index.mjs
    ├── middleware
    │   ├── authMiddleware.mjs
    │   ├── errorHandler.mjs
    │   ├── roleMiddleware.mjs
    │   ├── socketMiddleware.mjs
    │   └── validateRequest.mjs
    ├── models
    │   ├── Employee.mjs
    │   ├── IdentityVerificationSession.mjs
    │   ├── Notification.mjs
    │   ├── Otp.mjs
    │   ├── RefreshToken.mjs
    │   ├── WaterMonitors.mjs
    │   └── WaterQualityData.mjs
    ├── routes
    │   ├── authRoutes.mjs
    │   ├── notificationRoutes.mjs
    │   ├── waterMonitorRoutes.mjs
    │   └── waterQualityRoutes.mjs
    ├── seed
    │   └── employeeSeeder.mjs
    ├── services
    │   └── mqttService.mjs
    ├── sockets
    │   └── notificationSocket.mjs
    └── utils
        ├── helpers.mjs
        ├── jwt.mjs
        ├── multerConfig.mjs
        ├── sendEmail.mjs
        ├── smsSender.mjs
        └── validators.mjs
```

---

## Core Functionalities

### Authentication and Role Management

- JWT-based authentication
- Role-based access control
- Refresh token mechanism
- OTP verification
- Identity verification sessions

### Water Quality Monitoring

- Real-time sensor data ingestion via MQTT
- Storage of readings in MongoDB
- Water Quality Index (WQI) computation
- Device monitoring and tracking
- REST APIs for dashboard integration

### Water Quality Index (WQI)

The backend calculates WQI using measured parameters:

- Turbidity
- pH
- Total Dissolved Solids (TDS)
- Electrical Conductivity (EC)
- Temperature

WQI Classification:

- 0–50: Excellent
- 51–100: Good
- 101–200: Poor
- 201–300: Very Poor
- Above 300: Unsuitable for Drinking

### Notification System

- Email alerts
- SMS alerts
- Real-time WebSocket notifications
- MQTT-based device control messaging

### MQTT Integration

- Subscribes to sensor topic
- Publishes control commands
- Enables secure IoT communication

---

## Installation Guide

### 1. Clone the Repository

```
git clone https://github.com/your-username/Madzi-Watcher-Backend.git
cd Madzi-Watcher-Backend
```

### 2. Install Dependencies

```
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add the following:

```
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
```

### 4. Run in Development Mode

```
npm run dev
```

This uses nodemon for automatic server restarts.

### 5. Run in Production

```
npm start
```

---

## MQTT Configuration

### Sensor Topic

```
waterquality/sensor
```

Expected JSON payload example:

```
{
  "deviceId": "ESP32-001",
  "turbidity": 6.4,
  "pH": 7.2,
  "tds": 540,
  "ec": 800,
  "temperature": 26.5
}
```

### Control Topic

```
waterquality/control
```

Used to:

- Activate solenoid valves
- Trigger alarms
- Reset devices
- Send remote operational commands

---

## Database Models

- Employee
- WaterMonitors
- WaterQualityData
- Notification
- Otp
- RefreshToken
- IdentityVerificationSession

The database stores:

- Sensor readings
- Device metadata
- User accounts
- Alert history
- Authentication sessions

---

## Security Features

- JWT authentication
- Role-based authorization
- Centralized error handling
- Request validation middleware
- Secure session management

---

## Real-Time Capabilities

- WebSocket-based live notifications
- Continuous MQTT subscription
- Instant dashboard data updates

---

## Seeding Initial Super Admin

```
node src/seed/employeeSeeder.mjs
```

---

## Technologies Used

- Node.js
- Express.js
- MongoDB and Mongoose
- MQTT.js
- WebSocket
- JSON Web Tokens (JWT)
- Nodemailer
- SMS Gateway Integration
- ES Modules (.mjs)
- Nodemon

---

## Project Vision

Madzi-Watcher aims to:

- Improve water quality monitoring in Malawi
- Enable real-time surveillance of water treatment plants
- Support water boards with automated alerts
- Reduce waterborne disease risks
- Provide data-driven decision support through WQI analytics
- Enable scalable IoT infrastructure for nationwide deployment

---

## Contributing

For new collaborators:

1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Run the development server

Before pushing changes:

```
git checkout -b feature/your-feature-name
```

Then push your branch and open a pull request.

---

## License

This project is licensed under the MIT License.
