import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger';
import authRoutes from './routes/auth.routes';
import todoRoutes from './routes/todo.routes';
import notificationRoutes from './routes/notification.routes';
import stripeRoutes from './routes/stripe.routes';
import { handleWebhook } from './controllers/stripe.controller';
import "./cron/notification.cron";

import logger from './middleware/logger';
import path from 'path';

import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Special handling for Stripe Webhook to get raw body
// This MUST be defined before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(logger);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/stripe", stripeRoutes);

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

export default app;
