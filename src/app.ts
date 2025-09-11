import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import journeysRouter from "./routes/journeys";
import usersRouter from "./routes/users";
import { connectToDatabase } from "./lib/db";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/ping", (_req, res) => {
  res.send("pong");
});

app.get("/health", async (_req, res) => {
  try {
    await connectToDatabase();
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error" });
  }
});

app.use("/api/journeys", journeysRouter);
app.use("/api/users", usersRouter);

app.use(errorHandler);

export default app;
