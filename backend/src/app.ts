import express, { Request, Response, Express } from "express";
import cors from "cors";
import { handleHTTPError } from "./helper/handleHTTPError";
import { exchangeRate } from "./exchangeRate";
import { swaggerSpec } from "./swagger/swagger";
import swaggerUI from "swagger-ui-express";
import createHttpError from "http-errors";
import { scheduledPaymentQueue } from "../queues/scheduledPaymentQueue";
import { getTransactionToken } from "./bankIntegration/getTransactionToken";
import { createItem } from "./bankIntegration/createItem";
import { doWithdraw } from "./bankIntegration/doWithdraw";
import { checkBalanceChallenges } from "./challenges/checkBalanceChallenges";
import User from "../model/User";
import WalletInfo from "../model/WalletInfo";
import UserChallengeProgress from "../model/UserChallengeProgress";
import Challenge from "../model/Challenge";
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

  // get currency conversion rate
  app.get(
    "/exchangerate/:currencySource/:currencyDest",
    async (req: Request, res: Response) => {
      try {
        const { currencySource, currencyDest } = req.params;
        const response = await exchangeRate(currencySource, currencyDest);
        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // create a transaction item to Zai
  app.get("/bankintegration/withdraw", async (req: Request, res: Response) => {
    try {
      const { amount, userId } = req.query;
      const getToken = await getTransactionToken();
      const response = await createItem(
        userId as string,
        "Withdraw-Request",
        Number(amount),
        "buyer-1556502326027",
        "buyer-6543217890",
        getToken
      );
      res.json(response);
    } catch (err: unknown) {
      if (createHttpError.isHttpError(err)) {
        res.status(err.status).json({ errorMsg: err.message });
      } else {
        res.status(500).json({ errorMsg: "Unexpected error" });
      }
    }
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

  // create Zai deposit Item
  app.get("/bankintegration/deposit", async (req: Request, res: Response) => {
    try {
      const { amount, userId } = req.query;
      const getToken = await getTransactionToken();
      const response = await createItem(
        userId as string,
        "Deposit-Request",
        Number(amount),
        "buyer-6543217890",
        "buyer-1556502326027",
        getToken
      );
      res.json(response);
    } catch (err: unknown) {
      if (createHttpError.isHttpError(err)) {
        res.status(err.status).json({ errorMsg: err.message });
      } else {
        res.status(500).json({ errorMsg: "Unexpected error" });
      }
    }
  });

  // handle withdraw done by admin
  app.get(
    "/bankintegration/doTransaction/:transactionId",
    async (req: Request, res: Response) => {
      try {
        const { transactionId } = req.params;
        const getToken = await getTransactionToken();
        const response = await doWithdraw(getToken, transactionId);
        res.json(response);
      } catch (err: unknown) {
        if (createHttpError.isHttpError(err)) {
          res.status(err.status).json({ errorMsg: err.message });
        } else {
          res.status(500).json({ errorMsg: "Unexpected error" });
        }
      }
    }
  );

  // Create new Wallet if user does not have target currency
  app.post(
    "/test/updateBalanceAndCheck",
    async (req: Request, res: Response) => {
      const { userId, newBalance, walletCurrency = "USD" } = req.body;

      try {
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
          res.status(404).json({ success: false, errorMsg: "User not found" });
        }

        // Update or create wallet balance
        // Option 1: Update all wallets proportionally
        const wallets = await WalletInfo.find({ userId });

        if (wallets.length === 0) {
          // Create a new wallet if none exists
          await WalletInfo.create({
            userId,
            walletBalance: newBalance,
            walletCurrency: walletCurrency,
          });
        } else {
          // Option 2: Update the primary wallet (first one) to the new balance
          // and set others to 0 for testing purposes
          for (let i = 0; i < wallets.length; i++) {
            if (i === 0) {
              wallets[i].walletBalance = newBalance;
            } else {
              wallets[i].walletBalance = 0;
            }
            await wallets[i].save();
          }
        }

        // Check balance challenges
        const result = await checkBalanceChallenges(userId);

        // Get updated wallet info
        const updatedWallets = await WalletInfo.find({ userId });
        const totalBalance = updatedWallets.reduce(
          (sum, wallet) => sum + wallet.walletBalance,
          0
        );

        res.status(200).json({
          success: true,
          user: {
            id: user?._id,
            exp: user?.exp,
            rank: user?.rank,
          },
          wallets: updatedWallets.map((w) => ({
            id: w._id,
            balance: w.walletBalance,
            currency: w.walletCurrency,
          })),
          totalBalance,
          challengeResult: result,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err: unknown) {
        res.status(500).json({ errorMsg: "Something went wrong" });
      }
    }
  );

  // Simulate month change for challenges
  app.post("/test/simulateMonthChange", async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {
      // Get all active save challenges for the user
      const progresses = await UserChallengeProgress.find({ userId }).populate(
        "challengeId"
      );

      // Update lastCheckedDate to last month for all save challenges
      for (const progress of progresses) {
        // @ts-expect-error - TypeScript might not recognize populated fields
        if (progress.challengeId && progress.challengeId.category === "save") {
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          progress.lastCheckedDate = lastMonth;
          await progress.save();
        }
      }

      // Now check balance challenges
      const result = await checkBalanceChallenges(userId);

      res.status(200).json({
        success: true,
        message: "Month change simulated",
        result,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      res.status(500).json({ success: false, errorMsg: err.message });
    }
  });

  app.post(
    "/test/runBudgetChallengeScenario",
    async (req: Request, res: Response) => {
      try {
        // Step 1: Create test user
        const user = await User.create({
          firstName: "Test",
          lastName: "User",
          email: `test${Date.now()}@example.com`,
          password: "hashedpassword",
          username: `testuser${Date.now()}`,
          exp: 0,
          rank: "bronze",
        });

        // Step 2: Create wallet with initial balance
        const wallet = await WalletInfo.create({
          userId: user._id,
          walletBalance: 500,
          walletCurrency: "USD",
        });

        user.walletInfo.push(wallet._id);
        await user.save();

        // Step 3: Create save challenges
        const now = new Date();
        const challenge1 = await Challenge.create({
          category: "save",
          title: "Save $1000",
          description: "Maintain a balance of at least $1000",
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 2, 0),
          exp: 100,
          amountToGoal: 1000,
        });

        const challenge2 = await Challenge.create({
          category: "save",
          title: "Save $500",
          description: "Maintain a balance of at least $500",
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 2, 0),
          exp: 50,
          amountToGoal: 500,
        });

        // Step 4: Initial check (should complete challenge2 only)
        let result = await checkBalanceChallenges(user._id.toString());
        const initialResult = { ...result };

        // Step 5: Update wallet balance to $1200
        wallet.walletBalance = 1200;
        await wallet.save();

        // Step 6: Check again (should not complete challenge1 yet - same month)
        result = await checkBalanceChallenges(user._id.toString());
        const sameMonthResult = { ...result };

        // Step 7: Simulate month change for challenge1
        const progress1 = await UserChallengeProgress.findOne({
          userId: user._id,
          challengeId: challenge1._id,
        });
        if (progress1) {
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          progress1.lastCheckedDate = lastMonth;
          await progress1.save();
        }

        // Step 8: Check again (should complete challenge1 now)
        result = await checkBalanceChallenges(user._id.toString());
        const afterMonthChangeResult = { ...result };

        // Get final user state
        const finalUser = await User.findById(user._id);
        const finalWallet = await WalletInfo.findById(wallet._id);

        res.status(200).json({
          success: true,
          testResults: {
            userId: user._id,
            rank: user.rank,
            walletId: wallet._id,
            initialBalance: 500,
            finalBalance: finalWallet?.walletBalance,
            initialExp: 0,
            finalExp: finalUser?.exp,
            expectedExp: 150, // 100 + 50
            challenges: [
              { id: challenge1._id, goal: 1000, exp: 100 },
              { id: challenge2._id, goal: 500, exp: 50 },
            ],
            steps: {
              initial: initialResult,
              afterBalanceUpdate: sameMonthResult,
              afterMonthChange: afterMonthChangeResult,
            },
          },
        });

        // Cleanup (optional - comment out if you want to keep test data)
        await User.findByIdAndDelete(user._id);
        await WalletInfo.findByIdAndDelete(wallet._id);
        await Challenge.findByIdAndDelete(challenge1._id);
        await Challenge.findByIdAndDelete(challenge2._id);
        await UserChallengeProgress.deleteMany({ userId: user._id });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        res.status(500).json({ success: false, errorMsg: err.message });
      }
    }
  );

  // Helper endpoint to get user's total balance
  app.get(
    "/test/getUserBalance/:userId",
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      try {
        const user = await User.findById(userId);
        if (!user) {
          res.status(404).json({ success: false, errorMsg: "User not found" });
        }

        const wallets = await WalletInfo.find({ userId });
        const totalBalance = wallets.reduce(
          (sum, wallet) => sum + wallet.walletBalance,
          0
        );

        res.status(200).json({
          success: true,
          userId,
          wallets: wallets.map((w) => ({
            id: w._id,
            balance: w.walletBalance,
            currency: w.walletCurrency,
          })),
          totalBalance,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        res.status(500).json({ success: false, errorMsg: err.message });
      }
    }
  );

  return app;
}
