import express, { Request, Response, Express } from "express";
import cors from "cors";
import { swaggerSpec } from "./swagger/swagger";
import swaggerUI from "swagger-ui-express";
import { scheduledPaymentQueue } from "../queues/scheduledPaymentQueue";
import { transactionRouter } from "./modules/transaction/transaction.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { passwordResetRouter } from "./modules/passwordReset/passwordReset.routes";
import { otpRouter } from "./modules/otp/otp.routes";
import { walletRouter } from "./modules/wallet/wallet.routes";
import { userRouter } from "./modules/user/user.routes";
import { requestRouter } from "./modules/request/request.routes";
import { scheduledPaymentRouter } from "./modules/scheduledPayment/scheduledPayment.routes";
import { groupRouter } from "./modules/group/group.routes";
import { profileRouter } from "./modules/profile/profile.routes";
import { challengeRouter } from "./modules/challenge/challenge.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { notificationRouter } from "./modules/notification/notification.routes";
import { exchangeRouter } from "./modules/exchange/exchange.routes";
import { bankRouter } from "./modules/bank/bank.routes";

export function createApp(): Express {
  const app: Express = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(transactionRouter);
  app.use(authRouter);
  app.use(passwordResetRouter);
  app.use(otpRouter);
  app.use(walletRouter);
  app.use(userRouter);
  app.use(requestRouter);
  app.use(scheduledPaymentRouter);
  app.use(groupRouter);
  app.use(profileRouter);
  app.use(challengeRouter);
  app.use(adminRouter);
  app.use(notificationRouter);
  app.use(exchangeRouter);
  app.use(bankRouter);

  // Serve Swagger API documentation
  app.use(
    "/api-docs",
    swaggerUI.serve,
    swaggerUI.setup(swaggerSpec, { explorer: true })
  );

  // Home EndPoint
  app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to Finpay Backend Endpoint");
  });

  // Checking the status of scheduled payment queue
  app.get("/queue/status", async (req, res) => {
    const waitingCount = await scheduledPaymentQueue.getWaitingCount();
    const activeCount = await scheduledPaymentQueue.getActiveCount();
    const completedCount = await scheduledPaymentQueue.getCompletedCount();
    const failedCount = await scheduledPaymentQueue.getFailedCount();
    const delayedCount = await scheduledPaymentQueue.getDelayedCount();

    res.json({
      queue: "scheduled-payments",
      status: {
        waiting: waitingCount,
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
        delayed: delayedCount,
      },
    });
  });

  // Test endpoint to get job details
  app.get("/queue/job/:jobId", async (req, res) => {
    const job = await scheduledPaymentQueue.getJob(req.params.jobId);
    if (job) {
      res.json({
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: job.progress,
        delay: job.delay,
        timestamp: job.timestamp,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        returnvalue: job.returnvalue,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
      });
    } else {
      res.status(404).json({ error: "Job not found" });
    }
  });

  return app;
}
