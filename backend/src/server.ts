import dotenv from "dotenv";
import { connectToDB } from "../lib/mongoClient";
import { createApp } from "./app";
import mongoose from "mongoose";
import { scheduledPaymentWorker } from "../workers/scheduledPaymentWorker";
import { QueueEvents } from "bullmq";
import connection from "../config/redis";
import type { Server } from "http";
import type { Express } from "express";
import "../workers/scheduledPaymentWorker";
import { initializeMonthlyBalanceCheck } from "./challenges/monthlyBalanceCheck";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

let server: Server;
const queueEvents = new QueueEvents("scheduled-payments", { connection });

const start = async () => {
  try {
    await connectToDB();
    const app: Express = createApp();
    initializeMonthlyBalanceCheck();
    server = app.listen(PORT, '0.0.0.0',() => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📘 Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("\n🛑 Gracefully shutting down...");

  try {
    if (server) {
      server.close(() => {
        console.log("🔒 HTTP server closed");
      });
    }

    await queueEvents.close();
    console.log("🧹 QueueEvents closed");

    await scheduledPaymentWorker.close();
    console.log("🧹 Worker closed");

    await mongoose.disconnect();
    console.log("🧹 MongoDB disconnected");
  } catch (err) {
    console.error("❌ Shutdown error:", err);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
