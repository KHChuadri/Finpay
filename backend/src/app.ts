import express, { Request, Response, Express } from "express";
import multer from "multer";
import cors from "cors";
import { handleHTTPError } from "./helper/handleHTTPError";
import { getUserWallet } from "./user/getUserWallet";
import { getUserWalletInfo } from "./user/getUserWalletInfo";
import { getUserTransactionHistory } from "./user/getUserTransactionHistory";
import { adminGetUser } from "./admin/adminGetUser";
import { adminVerifyId } from "./admin/adminVerifyId";
import { adminBlockId } from "./admin/adminBlockId";
import { findRecipient } from "./findRecipient";
import { exchangeRate } from "./exchangeRate";
import { getProfile } from "./profile/getProfile";
import { editProfile } from "./profile/editProfile";
import { uploadKyc } from "./profile/uploadKyc";
import { leaveGroup } from "./group/leaveGroup";
import { adminCreateChallenge } from "./admin/adminCreateChallenge";
import { swaggerSpec } from "./swagger/swagger";
import { getGroup } from "./group/getGroup";
import { getGroupList } from "./group/getGrouplist";
import { getMemberList } from "./group/getMemberlist";
import { findInvitee } from "./group/findInvitee";
import { editGroupMember } from "./group/editGroupMember";
import { setGroup } from "./group/setGroups";
import { getNotification } from "./getNotifications";
import { checkNewNotification } from "./checkNewNotification";
import { getInvitationList } from "./group/invitations/getInvitation";
import { processInvitation } from "./group/invitations/processInvitation";
import { setDepositData } from "./group/setDepositData";
import { sendRequest } from "./transactions/sendRequest";
import { getRequestList } from "./transactions/getRequestList";
import { getCurrentWallet } from "./getCurrentWallet";
import { storeMultiWallet } from "./storeMultiWallet";
import { deleteWallet } from "./deleteWallet";
import { acceptRequest } from "./transactions/acceptRequest";
import { deleteRequest } from "./transactions/deleteRequest";
import swaggerUI from "swagger-ui-express";
import { getUserRank } from "./user/getUserRank";
import { initiateScheduledPayment } from "./transactions/initiateScheduledPayment";
import { sendOtpEmail } from "./otpVerification/sendOtpEmail";
import { verifyOtp } from "./otpVerification/verifyOtp";
import createHttpError from "http-errors";
import { cancelScheduledPayment } from "./transactions/cancelScheduledPayment";
import { scheduledPaymentQueue } from "../queues/scheduledPaymentQueue";
import { getTransactionToken } from "./bankIntegration/getTransactionToken";
import { createItem } from "./bankIntegration/createItem";
import { doWithdraw } from "./bankIntegration/doWithdraw";
import { adminGetRequest } from "./admin/adminGetRequest";
import { getPendingInvitation } from "./group/getPendingInvitation";
import { checkBalanceChallenges } from "./challenges/checkBalanceChallenges";
import User from "../model/User";
import WalletInfo from "../model/WalletInfo";
import UserChallengeProgress from "../model/UserChallengeProgress";
import Challenge from "../model/Challenge";
import { getScheduledPayment } from "./transactions/getScheduledPayments";
import { getSavedRecipient } from "./savedRecipient";
import { getChallenges } from "./challenges/getChallenges";
import { getUserIsAdmin } from "./user/getUserIsAdmin";
import { topup } from "./group/topup";
import { getGroupTransactionHistory } from "./group/getGroupTransactionHistory";
import { withdraw } from "./group/withdraw";
import { transactionRouter } from "./modules/transaction/transaction.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { passwordResetRouter } from "./modules/passwordReset/passwordReset.routes";

export function createApp(): Express {
  const upload = multer({ storage: multer.memoryStorage() });

  const app: Express = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(transactionRouter);
  app.use(authRouter);
  app.use(passwordResetRouter);

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

  // Webhook Endpoint
  app.post("/webhook", async (req: Request, res: Response) => {
    try {
      const depositData = req.body;
      const response = await setDepositData(depositData);
      res.status(201).json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // Get Either All User's Wallet or Specific Currency
  app.get("/wallet/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const currency = req.query.currency as string;
      const response = currency
        ? await getUserWalletInfo(userId, currency)
        : await getUserWallet(userId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // Get User Rank
  app.get("/:userId/rank", async (req: Request, res: Response) => {
    const userId = req.params.userId;

    try {
      const response = await getUserRank(userId);
      res.status(200).json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // Check if User is Admin
  app.get("/isAdmin/:userId", async (req: Request, res: Response) => {
    const userId = req.params.userId;

    try {
      const response = await getUserIsAdmin(userId);
      res.status(200).json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // Create New Currency Wallet
  app.put("/wallet/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { walletCurrency } = req.body;

      const response = await storeMultiWallet(userId, walletCurrency);
      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // Handle Group Topup
  app.post("/topup", async (req: Request, res: Response) => {
    try {
      const {
        debtorAccountWallet,
        groupId,
        amountSrc,
        amountDest,
        srcCurrency,
        destCurrency,
      } = req.body;

      const response = await topup(
        debtorAccountWallet,
        groupId,
        amountSrc,
        amountDest,
        srcCurrency,
        destCurrency
      );

      res.status(200).json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // Handle Group Payment
  app.post("/withdraw", async (req: Request, res: Response) => {
    try {
      const {
        creditorInfo,
        groupId,
        amountSrc,
        amountDest,
        srcCurrency,
        destCurrency,
      } = req.body;

      const response = await withdraw(
        creditorInfo,
        groupId,
        amountSrc,
        amountDest,
        srcCurrency,
        destCurrency
      );

      res.status(200).json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // Create scheduled payment
  app.post("/schedule/payment", async (req: Request, res: Response) => {
    try {
      const {
        debtorUserId,
        creditorUserEmail,
        scheduledDate,
        amountSrc,
        amountDest,
        currencySrc,
        currencyDest,
      } = req.body;

      const response = await initiateScheduledPayment(
        debtorUserId,
        creditorUserEmail,
        scheduledDate,
        amountSrc,
        amountDest,
        currencySrc,
        currencyDest
      );

      res.status(200).json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // cancel scheduled payment
  app.delete(
    "/schedule/payment/:paymentId",
    async (req: Request, res: Response) => {
      try {
        const { paymentId } = req.params;
        const userId = req.query.userId as string;

        const response = await cancelScheduledPayment(paymentId, userId);
        res.status(200).json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // get user transaction history
  app.get("/user/transaction/history", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const response = await getUserTransactionHistory(userId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // get group transaction history
  app.get("/group/transaction/history", async (req: Request, res: Response) => {
    try {
      const groupId = req.query.groupId as string;
      const response = await getGroupTransactionHistory(groupId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // Find tranbsaction recipient
  app.get(
    "/find/recipients/:email/:userId",
    async (req: Request, res: Response) => {
      try {
        const { email, userId } = req.params;
        const response = await findRecipient(email, userId);

        res.status(200).json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // create new challenge
  app.post("/admin/createChallenge", async (req: Request, res: Response) => {
    const {
      category,
      title,
      description,
      startDate,
      endDate,
      exp,
      amountToGoal,
    } = req.body;

    try {
      const response = await adminCreateChallenge(
        category,
        title,
        description,
        startDate,
        endDate,
        exp,
        amountToGoal
      );
      res.status(200).json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // get user profile information
  app.get("/user/profile/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const response = await getProfile(userId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // update verification image
  app.put(
    "/user/profile/upload-kyc",
    upload.single("kycImage"),
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.body;
        const kycImg = req.file;
        const response = await uploadKyc(userId, kycImg);
        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // edit profile information and image
  app.put(
    "/user/profile/:userId",
    upload.single("profileImg"),
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        let profileImg: Express.Multer.File | string | undefined;

        if (req.file) {
          profileImg = req.file;
        } else if (!req.file && req.body.profileImg !== undefined) {
          profileImg = req.body.profileImg;
        }

        const payload = {
          ...req.body,
          profileImg,
        };

        const response = await editProfile(userId, payload);

        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // create new group/sharedwallet
  app.post("/groups/create", async (req: Request, res: Response) => {
    try {
      const { groupName, description, userId, currency } = req.body;
      const response = await setGroup(groupName, description, userId, currency);
      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // leave shared wallet
  app.put("/groups/leave", async (req: Request, res: Response) => {
    try {
      const { groupId, userId } = req.query as {
        groupId: string;
        userId: string;
      };
      const response = await leaveGroup(groupId, userId);
      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // send invitation for shared wallet
  app.put(
    "/groups/invite/:groupId/:targetId/:creatorId",
    async (req: Request, res: Response) => {
      try {
        const { groupId, targetId, creatorId } = req.params;
        const response = await editGroupMember(
          groupId,
          targetId,
          "add",
          creatorId
        );
        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // kick member from shared wallet
  app.put(
    "/groups/remove/:groupId/:targetId/:creatorId",
    async (req: Request, res: Response) => {
      try {
        const { groupId, targetId, creatorId } = req.params;
        const response = await editGroupMember(
          groupId,
          targetId,
          "remove",
          creatorId
        );
        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // accept or decline invitation
  app.put(
    "/invitation/process/:invitationId/:mode",
    async (req: Request, res: Response) => {
      try {
        const { invitationId, mode } = req.params;
        const response = await processInvitation(invitationId, mode);

        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // get user's group list
  app.get("/groups/batch", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const response = await getGroupList(userId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });
  
  // get invitation list
  app.get("/invitation/batch", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const response = await getInvitationList(userId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // get pending invitation list
  app.get("/groups/invitation/pending", async (req: Request, res: Response) => {
    try {
      const groupId = req.query.groupId as string;
      const response = await getPendingInvitation(groupId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });
  
  // get group member
  app.get("/groups/member", async (req: Request, res: Response) => {
    try {
      const groupId = req.query.groupId as string;
      const response = await getMemberList(groupId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // get specific group information and details
  app.get("/groups/:groupId", async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const response = await getGroup(groupId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // get user list in admin control
  app.get("/admin/users", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const response = await adminGetUser(page, limit);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // get request list in admin control
  app.get("/admin/requests", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const response = await adminGetRequest(page, limit);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // find recepient of invitation
  app.get(
    "/find/invitee/:email/:userId/:groupId",
    async (req: Request, res: Response) => {
      try {
        const { email, userId, groupId } = req.params;
        const response = await findInvitee(email, userId, groupId);
        res.status(200).json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // check if user has new notification
  app.get("/notification/new/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const response = await checkNewNotification(userId);
      res.status(200).json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // get notification list
  app.get("/notification/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const response = await getNotification(userId);
      res.status(200).json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // verify user by admin
  app.put("/admin/verify/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const verify = req.body.isVerified;
      const response = await adminVerifyId(userId, verify);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // block user by admin
  app.put("/admin/block/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const block = req.body.isLocked;
      const response = await adminBlockId(userId, block);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
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

  // send a new request
  app.post("/transaction/send-request", async (req: Request, res: Response) => {
    try {
      const { email, senderId, amount, currency, notes } = req.body;
      const response = await sendRequest(
        email,
        senderId,
        amount,
        currency,
        notes
      );
      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  // get request list
  app.get(
    "/transaction/request/:userId",
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const response = await getRequestList(userId);
        res.status(200).json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // get current currency wallet information
  app.get(
    "/currencywallet/:currency/:userId",
    async (req: Request, res: Response) => {
      try {
        const { currency, userId } = req.params;
        const response = await getCurrentWallet(currency, userId);

        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // delete wallet
  app.delete(
    "/currencywallet/:currency/:userId",
    async (req: Request, res: Response) => {
      try {
        const { currency, userId } = req.params;
        const response = await deleteWallet(currency, userId);

        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // accept request
  app.post(
    "/transaction/request/accept",
    async (req: Request, res: Response) => {
      try {
        const { requestId } = req.body;
        const response = await acceptRequest(requestId);
        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // decline or delete request
  app.delete(
    "/transaction/request/delete/:requestId",
    async (req: Request, res: Response) => {
      try {
        const { requestId } = req.params;
        const response = await deleteRequest(requestId);
        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // Create an otp and send it to user (This should be done after the user has seen a request)
  app.post(
    "/authentication/create/otp",
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.body;
        const response = await sendOtpEmail(userId);
        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // Verify the otp
  app.post(
    "/authentication/verify/otp",
    async (req: Request, res: Response) => {
      try {
        const { otpId, otp, userId, email } = req.body;
        const response = await verifyOtp(otpId, otp, userId, email);
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

  // check user balance challenges
  app.post(
    "/user/checkBalanceChallenges",
    async (req: Request, res: Response) => {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          errorMsg: "userId is required",
        });
      }

      try {
        const result = await checkBalanceChallenges(userId);
        res.status(200).json(result);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  // check balance challenges of all user
  app.post(
    "/admin/checkAllBalanceChallenges",
    async (req: Request, res: Response) => {
      try {
        const users = await User.find({ isActive: true });
        const results = [];

        for (const user of users) {
          try {
            const result = await checkBalanceChallenges(user._id.toString());
            results.push({ userId: user._id, ...result });
          } catch (error) {
            results.push({
              userId: user._id,
              success: false,
              error: error,
            });
          }
        }

        res.status(200).json({
          success: true,
          totalUsers: users.length,
          results,
        });
      } catch (err: unknown) {
        handleHTTPError(err, res);
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

  // get user scheduledpayment list
  app.get(
    "/getScheduledPayments/:userId",
    async (req: Request, res: Response) => {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);

      try {
        const response = await getScheduledPayment(userId, page, limit);

        res.status(200).json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );
  // Get saved recipients
  app.get(
    "/transaction/save-recipient/:userId",
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const response = await getSavedRecipient(userId);
        res.status(200).json(response);
      } catch (err: unknown) {
        if (createHttpError.isHttpError(err)) {
          res.status(err.status).json({ errorMsg: err.message });
        } else {
          res.status(500).json({ errorMsg: "Unexpected error" });
        }
      }
    }
  );

  // get user challenge list
  app.get("/view/challenges/:userId", async (req: Request, res: Response) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);
    try {
      const response = await getChallenges(userId, page, limit);

      if (response.success) {
        res.status(200).json(response);
      }
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  return app;
}
