import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger';
import authRoutes from './routes/auth.routes';
import todoRoutes from './routes/todo.routes';
import logger from './middleware/logger';
import path from 'path';

import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
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

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

export default app;
