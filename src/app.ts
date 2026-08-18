import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger';
import authRoutes from './routes/auth.routes';
import todoRoutes from './routes/todo.routes';
import notificationRoutes from './routes/notification.routes';
import "./cron/notification.cron";

import logger from './middleware/logger';
import path from 'path';

import dotenv from "dotenv";
import Stripe from 'stripe';

import i18n from "./config/i18n";
import languageMiddleware from "./middleware/language.middleware";
import userRoutes from "./routes/user.routes";
import { globalLimiter } from './middleware/rate.limiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(logger);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 🌍 Apply to all routes
app.use(globalLimiter);


// Initialize i18n
app.use(i18n.init);

// Apply language middleware
app.use(languageMiddleware);

// Routes
app.use("/api", userRoutes);


app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/notification", notificationRoutes);

const stripe = new Stripe("sk_test_51TBYJ9QNh8SDUnEiDtPLpZsnb7FkMmDDyYoRerQV0gxJsZNOxFVG1gMz5YxyhcUVW8HdWO3mhuYLEiNONC4xS5XG00aJh1A2Zr");

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // cents
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).send({ error: errorMessage });
  }
});
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

export default app;
