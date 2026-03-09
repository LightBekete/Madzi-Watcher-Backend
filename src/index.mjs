import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.mjs'; 
import seedEmployees  from './seed/employeeSeeder.mjs'; 
import { seedWaterQuality } from './seed/waterQualitySeeder.mjs';
import authRoutes from './routes/authRoutes.mjs';
import waterMonitorRoutes from './routes/waterMonitorRoutes.mjs';
import waterQualityRoutes from './routes/waterQualityRoutes.mjs'
import notificationRoutes from './routes/notificationRoutes.mjs';
import { errorHandler } from './middleware/errorHandler.mjs';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupNotificationSocket } from './sockets/notificationSocket.mjs';
import { socketMiddleware } from './middleware/socketMiddleware.mjs';
import morgan from 'morgan';  
//import { mqttService } from './services/mqttService.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// server for Socket.IO
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});


connectDB();

// Seed database AFTER connection
await seedEmployees();
await seedWaterQuality();
// Pass Socket.IO instance to MQTT service for real-time updates
//mqttService.setSocketIo(io); 

// ===== MIDDLEWARE IN CORRECT ORDER =====

// 1. General middleware 
app.use(morgan('dev')); // Logging middleware
app.use(express.json()); // JSON parsing for all routes
app.use(cookieParser());
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: false
}));

// 2. Socket middleware
app.use(socketMiddleware(io));

// 3. Webhook route (needs raw body) for pay changu
//app.use("/api/payments/webhook", express.raw({ type: "application/json" }), paymentRoutes);

// 4. Regular routes
app.use('/api/auth', authRoutes);
app.use('/api/water-monitor', waterMonitorRoutes);
app.use('/api/water-quality',waterQualityRoutes);
app.use('/api/notifications', notificationRoutes);


// 5. Health check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// 6. Error handler 
app.use(errorHandler);

// Initialize sockets
setupNotificationSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});