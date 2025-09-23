import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "@/lib/swagger";
import authRouter from "@/routes/auth";
import { connectToDatabase } from "@/lib/db";
import { errorHandler } from "@/middlewares/errorHandler";
import logger from "@/lib/logger";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:8081",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
// Morgan middleware to log HTTP requests to Winston
const stream = {
  write: (message: string) => logger.http(message.trim()),
};

app.use(morgan("combined", { stream }));
app.use(cookieParser());

app.get("/ping", (_req, res) => {
  res.send("pong");
});

app.get("/health", async (_req, res) => {
  try {
    await connectToDatabase();
    res.json({ status: "ok" });
  } catch (err) {
    logger.error(`Health check failed: ${err}`);
    res.status(500).json({ status: "error" });
  }
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1/auth", authRouter);

app.use(errorHandler);

export default app;
