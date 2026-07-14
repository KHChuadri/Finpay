import dotenv from "dotenv";
import { pool } from "../lib/db";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { createApp } from "./app";
import { scheduledPaymentWorker } from "../workers/scheduledPaymentWorker";
import { QueueEvents } from "bullmq";
import connection from "../config/redis";
import type { Server } from "http";
import type { Express } from "express";
import "../workers/scheduledPaymentWorker";
import { initializeMonthlyBalanceCheck } from "./challenges/monthlyBalanceCheck";

dotenv.config();

const PORT = Number(process.env.PORT) || 10000;

let server: Server;
const queueEvents = new QueueEvents("scheduled-payments", { connection });

const start = async () => {
  try {
    // Apply pending migrations, then verify connectivity.
    await migrate(drizzle(pool), { migrationsFolder: "./src/db/migrations" });
    await pool.query("SELECT 1");
    console.log("✅ Connected to PostgreSQL");
    const app: Express = createApp();
    initializeMonthlyBalanceCheck();
    server = app.listen(PORT,() => {
      console.log(`🚀 Server running port: ${PORT}`);
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

    await pool.end();
    console.log("🧹 PostgreSQL pool closed");
  } catch (err) {
    console.error("❌ Shutdown error:", err);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
