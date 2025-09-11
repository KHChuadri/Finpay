/**
 * @swagger
 * tags:
 *   - name: User authentication
 *     description: Manage user authentication
 *   - name: User services
 *     description: Manage user information
 *   - name: Wallet services
 *     description: Manage wallet information
 *   - name: Transaction services
 *     description: Manage transaction process
 *   - name: Admin services
 *     description: Manage admin operations
 *   - name: Shared Wallet services
 *     description: Manage Shared Wallet Service
 *
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [User authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *     responses:
 *       200:
 *         description: Successful registration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 userId:
 *                   type: string
 *       400:
 *         description: Corresponding email has been used
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Sign in
 *     tags: [User authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Successfully sign in.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 userToken:
 *                   type: string
 *       400:
 *         description: Incorrect password
 *       404:
 *         description: Account does not exists with the given email
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /send-password-reset-email:
 *   get:
 *     summary: send email to reset password
 *     tags: [User authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Successfully send reset password email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *               example:
 *                  success: true
 *                  message: Reset password email has been sent.
 *       400:
 *         description: User with this email not found
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /reset-password:
 *   put:
 *     summary: reset password
 *     tags: [User authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - token
 *               - password
 *     responses:
 *       200:
 *         description: Successfully reset password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   schema:
 *                     type: object
 *                     properties:
 *                       resetPasswordToken:
 *                         type: string
 *                       resetPasswordTokenExpiryDate:
 *                         type: string
 *       410:
 *         description: Reset password token has expired.
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /user/profile/{userId}:
 *   get:
 *     summary: Get user profile information
 *     tags: [User services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 passwordLength:
 *                   type: number
 *                 email:
 *                   type: string
 *                   format: email
 *                 dob:
 *                   type: string
 *                   format: date
 *                   nullable: true
 *                 address:
 *                   type: object
 *                   properties:
 *                     addressLine1:
 *                       type: string
 *                       nullable: true
 *                     addressLine2:
 *                       type: string
 *                       nullable: true
 *                     country:
 *                       type: string
 *                       nullable: true
 *                 isVerified:
 *                   type: boolean
 *                 isLocked:
 *                   type: boolean
 *                 KYCimg:
 *                   type: string
 *                   nullable: true
 *                 profileImg:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /user/profile/{userId}:
 *   put:
 *     summary: Edit user profile
 *     tags: [User services]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               country:
 *                 type: string
 *               profileImg:
 *                 type: string
 *                 description: Base64 encoded image string
 *     responses:
 *       200:
 *         description: Successfully updated user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated
 *       400:
 *         description: Invalid input (e.g., invalid date)
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update user profile
 */

/**
 * @swagger
 * /user/profile/upload-kyc:
 *   put:
 *     summary: Upload user's KYC image
 *     tags: [User services]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - kycImage
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user
 *               kycImage:
 *                 type: string
 *                 format: binary
 *                 description: The KYC image file to upload
 *     responses:
 *       200:
 *         description: KYC image successfully uploaded and user updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 imageUrl:
 *                   type: string
 *                   description: URL of the uploaded KYC image
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/kyc_users/image.png
 *       400:
 *         description: Missing user ID or KYC image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: Missing user ID
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error during upload or database update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: Something went wrong during KYC upload
 */

/**
 * @swagger
 * /user/transaction/history:
 *   get:
 *     summary: Get user's transaction history
 *     tags: [User services]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose transaction history is being requested.
 *     responses:
 *       200:
 *         description: Successfully retrieving user's transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   transactionType:
 *                     type: string
 *                     description: Type of transaction (e.g., transfer or request).
 *                   amountSrc:
 *                     type: number
 *                     description: The amount in the source currency.
 *                   currencySource:
 *                     type: string
 *                     description: The currency of the source amount (e.g., USD, EUR).
 *                   amountDest:
 *                     type: number
 *                     description: The amount in the destination currency.
 *                   currencyDest:
 *                     type: string
 *                     description: The currency of the destination amount (e.g., USD, EUR).
 *                   fromAccount:
 *                     type: string
 *                     description: The ID of the source account (referenced from the User model).
 *                   toAccount:
 *                     type: string
 *                     description: The ID of the destination account (referenced from the User model).
 *                   fromAccountEmail:
 *                     type: string
 *                     description: The email of the source account holder.
 *                   toAccountEmail:
 *                     type: string
 *                     description: The email of the destination account holder.
 *                   fromAccountId:
 *                     type: string
 *                     description: A unique identifier for the source account.
 *                   toAccountId:
 *                     type: string
 *                     description: A unique identifier for the destination account.
 *                   transactionDate:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the transaction occurred.
 *                   description:
 *                     type: string
 *                     description: A brief description of the transaction (e.g., payment, refund).
 *       400:
 *         description: Missing or invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: User not found or does not exist
 */


/**
 * @swagger
 * /find/recipients/{email}/{userId}:
 *   get:
 *     summary: retrieve list of recipients
 *     tags: [User services]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema: 
 *           type: string
 *         description: the user's email
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: Successfully retrieved recipient information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 walletInfo:
 *                   type: ObjectId
 *       404:
 *         description: Recipient or wallet not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /creditors/list:
 *   get:
 *     summary: Get list of users who have at least one wallet
 *     tags: [Wallet services]
 *     responses:
 *       200:
 *         description: Successfully retrieved list of creditors with wallet info.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: user@example.com
 *                   username:
 *                     type: string
 *                     example: johndoe
 *                   walletInfo:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: 60c72b2f9b1d4c23d8fdf123
 *                         walletBalance:
 *                           type: number
 *                           example: 100
 *                         walletCurrency:
 *                           type: string
 *                           example: AUD
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /currencywallet/{currency}/{userId}:
 *   get:
 *     summary: Get user wallet information by currency
 *     tags: [Wallet services]
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency code (e.g., "AUD", "IDR")
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Successfully fetched the user's wallet information for the specified currency.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 walletBalance:
 *                   type: number
 *                   description: The current balance of the user's wallet
 *                 walletCurrency:
 *                   type: string
 *                   description: The currency of the user's wallet
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: wallet not found
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: Unexpected error
 */

/**
 * @swagger
 * /currencywallet/{currency}/{userId}:
 *   delete:
 *     summary: Delete user wallet by currency
 *     tags: [Wallet services]
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency code of the wallet to delete (e.g., "AUD", "IDR")
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Wallet successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Wallet deleted successfully
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: wallet not found
 *       500:
 *         description: Unexpected server error or deletion failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: Unexpected error
 */

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Receive provider webhook (finalise deposit or withdraw)
 *     description: >
 *       Processes deposit/withdraw item callbacks. The request is handled only when `items.state` is `"completed"`.
 *       For deposits, credits the user's wallet and writes a transaction record. For withdrawals, writes a transaction record.
 *     tags: [Transaction services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: object
 *                 required: [id, name, description, state, amount, currency]
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                     description: e.g., Deposit-Request or Withdraw-Request
 *                   description:
 *                     type: string
 *                     description: Used as remittance/depositId
 *                   custom_descriptor:
 *                     type: string
 *                     nullable: true
 *                   payout_descriptor:
 *                     type: string
 *                     nullable: true
 *                   created_at:
 *                     type: string
 *                   updated_at:
 *                     type: string
 *                   state:
 *                     type: string
 *                     description: Must be 'completed' to be processed
 *                   net_amount:
 *                     type: number
 *                   chargedback_amount:
 *                     type: number
 *                   refunded_amount:
 *                     type: number
 *                   released_amount:
 *                     type: number
 *                   seller_url:
 *                     type: string
 *                   buyer_url:
 *                     type: string
 *                   remaining_amount:
 *                     type: number
 *                   status:
 *                     type: number
 *                   amount:
 *                     type: number
 *                     description: Cents
 *                   payment_type_id:
 *                     type: number
 *                   due_date:
 *                     type: string
 *                     nullable: true
 *                   requested_release_amount:
 *                     type: number
 *                   pending_release_amount:
 *                     type: number
 *                   dynamic_descriptor:
 *                     type: string
 *                     nullable: true
 *                   invoice_url:
 *                     type: string
 *                     nullable: true
 *                   deposit_reference:
 *                     type: string
 *                   buyer_fees:
 *                     type: number
 *                   seller_fees:
 *                     type: number
 *                   credit_card_fee:
 *                     type: number
 *                   direct_debit_fee:
 *                     type: number
 *                   paypal_fee:
 *                     type: number
 *                   promisepay_fee:
 *                     type: number
 *                   batch_state:
 *                     type: string
 *                     nullable: true
 *                   total_outstanding:
 *                     type: number
 *                   total_amount:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   payment_method:
 *                     type: string
 *                   buyer_name:
 *                     type: string
 *                   buyer_email:
 *                     type: string
 *                   buyer_country:
 *                     type: string
 *                   seller_name:
 *                     type: string
 *                   seller_email:
 *                     type: string
 *                   seller_country:
 *                     type: string
 *                   payment_credit_card_enabled:
 *                     type: boolean
 *                   payment_direct_debit_enabled:
 *                     type: boolean
 *                   related:
 *                     type: object
 *                     properties:
 *                       buyers:
 *                         type: string
 *                       sellers:
 *                         type: string
 *                   links:
 *                     type: object
 *                     properties:
 *                       self:
 *                         type: string
 *                       buyers:
 *                         type: string
 *                       sellers:
 *                         type: string
 *                       status:
 *                         type: string
 *                       fees:
 *                         type: string
 *                       transactions:
 *                         type: string
 *                       batch_transactions:
 *                         type: string
 *                       wire_details:
 *                         type: string
 *                       bpay_details:
 *                         type: string
 *           example:
 *             items:
 *               id: "b8dd2780-48bd-013e-f604-0a58a9feac03"
 *               name: "Deposit-Request"
 *               description: "USER-REM-12345"
 *               custom_descriptor: null
 *               payout_descriptor: null
 *               created_at: "2025-07-22T00:07:04.370Z"
 *               updated_at: "2025-07-22T00:07:04.372Z"
 *               state: "completed"
 *               net_amount: 10000
 *               chargedback_amount: 0
 *               refunded_amount: 0
 *               released_amount: 10000
 *               seller_url: "https://example.com/seller/123"
 *               buyer_url: "https://example.com/buyer/456"
 *               remaining_amount: 0
 *               status: 200
 *               amount: 10000
 *               payment_type_id: 1
 *               due_date: null
 *               requested_release_amount: 0
 *               pending_release_amount: 0
 *               dynamic_descriptor: null
 *               invoice_url: null
 *               deposit_reference: "DEP-123456"
 *               buyer_fees: 0
 *               seller_fees: 0
 *               credit_card_fee: 0
 *               direct_debit_fee: 0
 *               paypal_fee: 0
 *               promisepay_fee: 0
 *               batch_state: null
 *               total_outstanding: 0
 *               total_amount: 10000
 *               currency: "AUD"
 *               payment_method: "npp_payin"
 *               buyer_name: "Michael Darren"
 *               buyer_email: "buyer@example.com"
 *               buyer_country: "AU"
 *               seller_name: "Teknoaus Dev"
 *               seller_email: "seller@example.com"
 *               seller_country: "AU"
 *               payment_credit_card_enabled: false
 *               payment_direct_debit_enabled: true
 *               related:
 *                 buyers: "/buyers/buyer-123"
 *                 sellers: "/sellers/seller-456"
 *               links:
 *                 self: "/items/b8dd2780-48bd-013e-f604-0a58a9feac03"
 *                 buyers: "/buyers/buyer-123"
 *                 sellers: "/sellers/seller-456"
 *                 status: "/items/.../status"
 *                 fees: "/items/.../fees"
 *                 transactions: "/items/.../transactions"
 *                 batch_transactions: "/items/.../batch_transactions"
 *                 wire_details: "/items/.../wire_details"
 *                 bpay_details: "/items/.../bpay_details"
 *     responses:
 *       201:
 *         description: Webhook processed; transaction recorded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookSuccess'
 *       400:
 *         description: |
 *           Bad request. Possible reasons:
 *             - Deposit Has Been Processed
 *             - Missing remittance_information
 *             - Invalid depositId, please contact support
 *             - Invalid DepoWallet, please contact support
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: |
 *           Not found / Not processed. Possible reasons:
 *             - Transaction Data not found
 *             - Transaction Failed (items.state !== "completed")
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /wallet/{userId}:
 *   put:
 *     summary: Adds new wallet information to multiwallet
 *     tags: [Wallet services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update wallet info for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletCurrency:
 *                 type: string
 *                 example: AUD
 *     responses:
 *       200:
 *         description: Successfully updated multiwallet information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Store multi wallet successful
 *       400:
 *         description: |
 *           Bad request. Possible reasons:
 *             - The user does not exist
 *             - The wallet with the given currency already exists
 *       500:
 *         description: Unexpected server error
 */

/**
 * @swagger
 * /wallet/{userId}:
 *   get:
 *     summary: Get user's multiwallet information
 *     tags: [Wallet services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve wallet info for
 *     responses:
 *       200:
 *         description: Successfully retrieved multiwallet information.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   wallets:
 *                     type: object
 *                     properties:
 *                       userId: 
 *                         type: Types.ObjectId
 *                         example: "60c72b2f9b1d4c23d8fdf123"  
 *                       walletBalance:
 *                         type: number
 *                         example: 100
 *                       walletCurrency:
 *                         type: string
 *                         example: AUD
 *       404:
 *         description: |
 *           Bad request. Possible reasons:
 *             - The user does not exist
 *       500:
 *         description: Unexpected server error
 */

/**
 * @swagger
 * /wallet/{userId}?currency={currency}:
 *   get:
 *     summary: Get user's multiwallet information for transaction purpose
 *     tags: [Wallet services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve wallet info for
 *       - in: query
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency code (e.g., "AUD", "IDR") to filter the wallet information
 *     responses:
 *       200:
 *         description: Successfully retrieved multiwallet information.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   correspondingWallet:
 *                     type: object
 *                     properties:
 *                       userId: 
 *                         type: Types.ObjectId
 *                         example: "60c72b2f9b1d4c23d8fdf123"  
 *                       walletBalance:
 *                         type: number
 *                         example: 100
 *                       walletCurrency:
 *                         type: string
 *                         example: AUD
 *       400:
 *        description: |
 *          Bad request. Possible reasons:
 *            - Missing userId parameter
 *            - Missing currency query parameter
 *       404:
 *         description: |
 *           Not found. Possible reasons:
 *             - The user does not exist
 *             - The wallet with the given currency does not exist
 *       500:
 *         description: Unexpected server error
 */

/**
 * @swagger
 * /exchangerate/{currencySource}/{currencyDest}:
 *   get:
 *     summary: Retrieve the exchange rate between two currencies
 *     tags: [Wallet services]
 *     parameters:
 *       - in: path
 *         name: currencySource
 *         required: true
 *         schema:
 *           type: string
 *         description: The source currency code (e.g., AUD)
 *       - in: path
 *         name: currencyDest
 *         required: true
 *         schema:
 *           type: string
 *         description: The destination currency code (e.g., IDR)
 *     responses:
 *       200:
 *         description: Successfully retrieved exchange rate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rate:
 *                   type: number
 *                   example: 100
 *       404:
 *         description: |
 *           Currency not supported. Possible reasons:
 *             - Source currency is invalid or not supported
 *             - Destination currency is invalid or not supported
 *       500:
 *         description: Unexpected internal server error
 */

/**
 * @swagger
 * /p2ptransfer:
 *   post:
 *     summary: Peer to peer transfer
 *     tags: [Transaction services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               debtorWalletId:
 *                 type: string
 *               creditorInfo:
 *                 type: string
 *               amountSrc:
 *                 type: number
 *               amountDest:
 *                 type: number
 *               currencySource:
 *                 type: string
 *               currencyDest:
 *                 type: string
 *             required:
 *               - debtorWalletId
 *               - creditorInfo
 *               - amountSrc
 *               - amountDest
 *               - currencySource
 *               - currencyDest
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Transfer successful
 *                 debtorWalletId:
 *                   type: string
 *                   example: "60c72g5d9b1d4c23d8fd4523"
 *                 creditorWalletId:
 *                   type: string
 *                   example: "60c72b2f9b1d4c23d8fdf123"
 *                 amountTransferred:
 *                   type: string
 *                   example: "100 AUD"
 *                 newDebtorBalance:
 *                   type: number
 *                   example: 50
 *                 newCreditorBalance:
 *                   type: number
 *                   example: 150
 *       400:
 *         description: Insufficient funds in debtor's wallet
 *       404:
 *          description: |
 *           Possible reasons:
 *           - Missing or invalid debtor wallet ID
 *           - Creditor not found or does not exist
 *       500:
 *         description: Internal server error encountered
 */

/**
 * @swagger
 * /transaction/send-request:
 *   post:
 *     summary: making a transaction request
 *     tags: [Transaction services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: 
 *                 type: string
 *               senderId: 
 *                 type: string
 *               amount: 
 *                 type: number
 *               currency: 
 *                 type: string
 *               notes: 
 *                 type: string 
 *             required:
 *                 - email
 *                 - senderId
 *                 - amount
 *                 - currency
 *                 - notes 
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestId:
 *                   type: string
 *       400:
 *         description: User not found or does not exists || Recipient does not exist
 *       500:
 *         description: Internal server error encountered
 */

/**
 * @swagger
 * /transaction/request/{userId}:
 *   get:
 *     summary: retrieve a transaction request from a user
 *     tags: [Transaction services]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestId:
 *                   type: string
 *                 senderEmail:
 *                   type: string
 *                 requestDate:
 *                   type: Date
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 notes:
 *                   type: string
 *       404:
 *         description: User not found or does not exists
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /transaction/request/accept:
 *   post:
 *     summary: accept a transaction request
 *     tags: [Transaction services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestId:
 *                 type: string
 *             required:
 *               - requestId
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Request, sender or wallet not found
 *       500:
 *         description: Internal server error encountered
 */

/**
 * @swagger
 * /transaction/request/delete/{requestId}:
 *   delete:
 *     summary: delete a transaction request
 *     tags: [Transaction services]
 *     parameters:
 *       - in: query
 *         name: requestId
 *         schema:
 *           type: string
 *         description: The transaction request's ID
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Request not found or does not exist
 *       500:
 *         description: Internal server error encountered
 */

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out
 *     tags: [User authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               userId:
 *                 type: string
 *             required:
 *               - token
 *               - userId
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: User not found or does not exists || Token does not exist
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all user data
 *     tags: [Admin services]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Get total number of pages
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Get limit per page
 *     responses:
 *       200:
 *         description: Retrieve all users information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       isLocked:
 *                         type: boolean
 *                       isVerified:
 *                         type: boolean
 *                       email:
 *                         type: string
 *                         format: email
 *                       updatedAt:
 *                         type: string
 *                       KYCimg:
 *                         type: string
 *                         format: binary
 *                         description: image
 *                 currentPage:
 *                   type: number
 *                 totalUsers:
 *                   type: number
 *                 totalPages:
 *                   type: number
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /admin/verify/{userId}:
 *   put:
 *     summary: Update user verification status
 *     tags: [Admin services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update verification for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *                 description: Set to true to verify, false to unverify
 *     responses:
 *       200:
 *         description: Successfully updated user verification status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       404:
 *         description: User not found
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /admin/block/{userId}:
 *   put:
 *     summary: Update user blocked status
 *     tags: [Admin services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to block or unblock
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isLocked
 *             properties:
 *               isLocked:
 *                 type: boolean
 *                 description: Set to true to block, false to unblock
 *     responses:
 *       200:
 *         description: Successfully updated user lock status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       404:
 *         description: User not found
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /admin/createChallenge:
 *   post:
 *     summary: making a budgeting challenge
 *     tags: [Admin services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *               exp: 
 *                 type: number
 *               amountToGoal:
 *                 type: number
 *             required:
 *               - category
 *               - title
 *               - description
 *               - startDate
 *               - endDate
 *               - exp
 *               - amountToGoal  
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 newChallenge:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                     exp: 
 *                       type: number
 *                     amountToGoal:
 *                       type: number
 *       400:
 *         description: Missing fields or end date cannot be before start date
 *       500:
 *         description: Error encountered
 */
/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin sign in
 *     tags: [Admin services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *           example:
 *             email: admin@example.com
 *             password: strong-password-123
 *     responses:
 *       200:
 *         description: Successfully signed in as admin.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 userId:
 *                   type: string
 *       400:
 *         description: |
 *           Bad request. Possible reasons:
 *             - Email and password are required
 *             - Incorrect password
 *             - User is not an admin
 *       404:
 *         description: Account does not exist with the given email
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /reset-password-token/{token}:
 *   get:
 *     summary: Validate reset password token
 *     tags: [User authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token sent to the user's email
 *     responses:
 *       200:
 *         description: Token is valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Couldn't find user or link does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: Couldn't find user
 *       405:
 *         description: Link has expired.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: Link has expired
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /{userId}/rank:
 *   get:
 *     summary: Get user's account rank
 *     tags: [User services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user's rank.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rank:
 *                   type: string
 *                   example: "Gold"
 *       400:
 *         description: "getUserRank: missing required field: userId"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "getUserRank: missing required field: userId"
 *       404:
 *         description: "getUserRank: User with id 60c72b2f9b1d4c23d8fdf123 not found!"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "getUserRank: User with id 60c72b2f9b1d4c23d8fdf123 not found!"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /isAdmin/{userId}:
 *   get:
 *     summary: Check if user is admin
 *     tags: [Admin services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: Successfully checked admin status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 isAdmin:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: "getUserIsAdmin: User with id 60c72b2f9b1d4c23d8fdf123 not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "getUserIsAdmin: User with id 60c72b2f9b1d4c23d8fdf123 not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /topup:
 *   post:
 *     summary: Top up a shared group wallet
 *     tags: [Shared Wallet services]
 *     description: >
 *       Moves funds from a user's wallet to a group's shared wallet and records a transaction.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - debtorAccountWallet
 *               - groupId
 *               - amountSrc
 *               - amountDest
 *               - srcCurrency
 *               - destCurrency
 *             properties:
 *               debtorAccountWallet:
 *                 type: string
 *                 description: The debtor (user) wallet ID to debit.
 *               groupId:
 *                 type: string
 *                 description: The target group's shared wallet ID to credit.
 *               amountSrc:
 *                 type: number
 *                 description: Amount to deduct from the debtor wallet (in source currency).
 *               amountDest:
 *                 type: number
 *                 description: Amount to add to the group wallet (in destination currency).
 *               srcCurrency:
 *                 type: string
 *                 description: Source currency code (e.g., "AUD").
 *               destCurrency:
 *                 type: string
 *                 description: Destination currency code (e.g., "AUD").
 *           example:
 *             debtorAccountWallet: "66bc9c6f3f1a3b0012ab3456"
 *             groupId: "66bca1a03f1a3b0012ab7890"
 *             amountSrc: 25
 *             amountDest: 25
 *             srcCurrency: "AUD"
 *             destCurrency: "AUD"
 *     responses:
 *       200:
 *         description: Transfer successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Transfer successful"
 *                 debtorWalletId:
 *                   type: string
 *                   example: "66bc9c6f3f1a3b0012ab3456"
 *                 creditorWalletId:
 *                   type: string
 *                   example: "66bca1a03f1a3b0012ab7890"
 *                 amountTransferred:
 *                   type: string
 *                   description: Concatenation of amount and source currency with no space.
 *                   example: "25AUD"
 *                 newDebtorBalance:
 *                   type: number
 *                   example: 75
 *                 newCreditorBalance:
 *                   type: number
 *                   example: 225
 *       400:
 *         description: "Insufficient balance"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Insufficient balance"
 *       404:
 *         description: "Not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "topup: Debtor wallet not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /withdraw:
 *   post:
 *     summary: Pay from a shared group wallet to a user's wallet
 *     tags: [Shared Wallet services]
 *     description: >
 *       Debits a group's shared wallet and credits a recipient user's wallet. Creates a transaction history record for both.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creditorInfo
 *               - groupId
 *               - amountSrc
 *               - amountDest
 *               - srcCurrency
 *               - destCurrency
 *             properties:
 *               creditorInfo:
 *                 type: object
 *                 required: [email, walletInfo]
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Recipient user's email.
 *                   walletInfo:
 *                     type: array
 *                     description: Array of the recipient's wallet IDs (strings). System will pick/create the one matching destCurrency.
 *                     items:
 *                       type: string
 *               groupId:
 *                 type: string
 *                 description: The group's shared wallet ID to debit.
 *               amountSrc:
 *                 type: number
 *                 description: Amount to deduct from the group wallet (in source currency).
 *               amountDest:
 *                 type: number
 *                 description: Amount to add to the recipient wallet (in destination currency).
 *               srcCurrency:
 *                 type: string
 *                 description: Source currency code (e.g., "AUD").
 *               destCurrency:
 *                 type: string
 *                 description: Destination currency code (e.g., "AUD").
 *           example:
 *             creditorInfo:
 *               email: "user@example.com"
 *               walletInfo: ["66c0f0b13f1a3b0012ab1111", "66c0f0b13f1a3b0012ab2222"]
 *             groupId: "66bca1a03f1a3b0012ab7890"
 *             amountSrc: 50
 *             amountDest: 50
 *             srcCurrency: "AUD"
 *             destCurrency: "AUD"
 *     responses:
 *       200:
 *         description: Transfer successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Transfer successful"
 *                 creditorWalletId:
 *                   type: string
 *                   example: "66c0f0b13f1a3b0012ab1111"
 *                 debtorWalletId:
 *                   type: string
 *                   description: The group (shared wallet) ID.
 *                   example: "66bca1a03f1a3b0012ab7890"
 *                 amountTransferred:
 *                   type: string
 *                   description: Concatenation of amount and source currency with no space.
 *                   example: "50AUD"
 *                 newCreditorBalance:
 *                   type: number
 *                   example: 175
 *                 newDeptorBalance:
 *                   type: number
 *                   description: "Group wallet balance after debit (note: field name mirrors current implementation)."
 *                   example: 450
 *       400:
 *         description: "Insufficient balance"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Insufficient balance"
 *       404:
 *         description: >
 *           "topup: user not found" |
 *           "topup: Shared wallet not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "topup: Shared wallet not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /schedule/payment:
 *   post:
 *     summary: Create a scheduled payment
 *     tags: [Transaction services]
 *     description: >
 *       Schedules a future payment from a debtor user to a creditor user, enqueues a background job,
 *       and immediately reserves (deducts) the amount from the debtor's wallet.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - debtorUserId
 *               - creditorUserEmail
 *               - scheduledDate
 *               - amountSrc
 *               - amountDest
 *               - currencySrc
 *               - currencyDest
 *             properties:
 *               debtorUserId:
 *                 type: string
 *                 description: Debtor user's ID.
 *               creditorUserEmail:
 *                 type: string
 *                 format: email
 *                 description: Creditor user's email.
 *               scheduledDate:
 *                 type: string
 *                 description: ISO datetime when the payment should execute.
 *                 example: "2025-09-01T10:00:00.000Z"
 *               amountSrc:
 *                 type: number
 *                 description: Amount to deduct from the debtor wallet (source currency).
 *               amountDest:
 *                 type: number
 *                 description: Amount to credit to the creditor wallet (destination currency).
 *               currencySrc:
 *                 type: string
 *                 description: Source currency code (e.g., "AUD").
 *               currencyDest:
 *                 type: string
 *                 description: Destination currency code (e.g., "AUD").
 *           example:
 *             debtorUserId: "66c1e2a43f1a3b0012ab0001"
 *             creditorUserEmail: "recipient@example.com"
 *             scheduledDate: "2025-09-01T10:00:00.000Z"
 *             amountSrc: 50
 *             amountDest: 775000
 *             currencySrc: "AUD"
 *             currencyDest: "IDR"
 *     responses:
 *       200:
 *         description: Payment scheduled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment scheduled successfully"
 *                 paymentId:
 *                   type: string
 *                   example: "66c1e4b63f1a3b0012ab1234"
 *                 date:
 *                   type: string
 *                   example: "2025-09-01T10:00:00.000Z"
 *       400:
 *         description: >
 *           "initiateScheduledPayment: required field(s) [...] are missing" |
 *           "initiateScheduledPayment: date and time must be later than today" |
 *           "initiateScheduledPayment: insufficient balance"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "initiateScheduledPayment: insufficient balance"
 *       404:
 *         description: >
 *           "schedulePayment: Debtor user with ID {debtorUserId} not found" |
 *           "schedulePayment: Creditor user with email {creditorUserEmail} not found" |
 *           "initiateScheduledPayment: debtor wallet not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "schedulePayment: Creditor user with email recipient@example.com not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /schedule/payment/{paymentId}:
 *   delete:
 *     summary: Cancel a scheduled payment
 *     tags: [Transaction services]
 *     description: Cancels a pending scheduled payment and refunds the reserved amount to the debtor's wallet.
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The scheduled payment ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Debtor user's ID
 *     responses:
 *       200:
 *         description: Payment cancelled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment cancelled successfully"
 *       400:
 *         description: "Only pending payments can be cancelled"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Only pending payments can be cancelled"
 *       403:
 *         description: "Unauthorized to cancel this payment"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Unauthorized to cancel this payment"
 *       404:
 *         description: "Payment not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Payment not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /group/transaction/history:
 *   get:
 *     summary: Get a group's transaction history
 *     tags: [Shared Wallet services]
 *     parameters:
 *       - in: query
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group's ID
 *     responses:
 *       200:
 *         description: Successfully retrieved group transaction history.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   transactionType:
 *                     type: string
 *                     example: "Shared Wallet Topup"
 *                   amountSrc:
 *                     type: number
 *                   currencySource:
 *                     type: string
 *                     example: "AUD"
 *                   amountDest:
 *                     type: number
 *                   currencyDest:
 *                     type: string
 *                     example: "AUD"
 *                   fromAccount:
 *                     type: string
 *                     description: User or group ObjectId
 *                   toAccount:
 *                     type: string
 *                     description: User or group ObjectId
 *                   fromAccountEmail:
 *                     type: string
 *                   toAccountEmail:
 *                     type: string
 *                   fromAccountId:
 *                     type: string
 *                   toAccountId:
 *                     type: string
 *                   description:
 *                     type: string
 *                     example: "Shared Wallet Topup"
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *             example:
 *               - _id: "66cd0c2f3f1a3b0012ab1234"
 *                 transactionType: "Shared Wallet Topup"
 *                 amountSrc: 25
 *                 currencySource: "AUD"
 *                 amountDest: 25
 *                 currencyDest: "AUD"
 *                 fromAccount: "66bc9c6f3f1a3b0012ab3456"
 *                 toAccount: "66bca1a03f1a3b0012ab7890"
 *                 fromAccountEmail: "alice@example.com"
 *                 toAccountEmail: "My Housemates"
 *                 fromAccountId: "66bc9c6f3f1a3b0012ab3456"
 *                 toAccountId: "66bca1a03f1a3b0012ab7890"
 *                 description: "Shared Wallet Topup"
 *                 createdAt: "2025-08-14T05:30:00.000Z"
 *                 updatedAt: "2025-08-14T05:30:00.000Z"
 *       400:
 *         description: "User not found or does not exist"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User not found or does not exist"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /groups/create:
 *   post:
 *     summary: Create a new shared group wallet
 *     tags: [Shared Wallet services]
 *     description: Creates a group, sets the requesting user as admin and first member, and sets the group's wallet currency.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [groupName, description, userId, currency]
 *             properties:
 *               groupName:
 *                 type: string
 *               description:
 *                 type: string
 *               userId:
 *                 type: string
 *                 description: ID of the user creating the group
 *               currency:
 *                 type: string
 *                 description: Group wallet currency code (e.g., "AUD")
 *           example:
 *             groupName: "Housemates"
 *             description: "Monthly utilities and groceries"
 *             userId: "66c2a8d43f1a3b0012ab0001"
 *             currency: "AUD"
 *     responses:
 *       200:
 *         description: Group created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupId:
 *                   type: string
 *                   example: "66c2ab7a3f1a3b0012ab1111"
 *       404:
 *         description: "User user not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User user not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /groups/leave:
 *   put:
 *     summary: Leave a shared group wallet
 *     tags: [Shared Wallet services]
 *     description: >
 *       Removes the user from the group's members. If the leaving user is the admin, admin is reassigned to the next member.
 *       If the last remaining member tries to leave while the group wallet has a non-zero balance, the request fails.
 *     parameters:
 *       - in: query
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group to leave
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user who is leaving
 *     responses:
 *       200:
 *         description: Successfully left group.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully Left Group"
 *       404:
 *         description: >
 *           "group not found" |
 *           "User not found" |
 *           "You Are The Only Member Left And Wallet Balance Is Not Empty"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "group not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /groups/invite/{groupId}/{targetId}/{creatorId}:
 *   put:
 *     summary: Send an invitation to join a shared group wallet
 *     tags: [Shared Wallet services]
 *     description: Sends a group invitation from the group admin (**creatorId**) to a target user (**targetId**). Also creates a notification for the target user.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group sending the invite
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user being invited
 *       - in: path
 *         name: creatorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the inviting user (must be the group's admin)
 *     responses:
 *       200:
 *         description: Invitation created and group updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group updated"
 *       400:
 *         description: >
 *           "User is not the admin" |
 *           "This Person is Already Part Of The Group" |
 *           "This Person already has a pending invite"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "This Person already has a pending invite"
 *       404:
 *         description: >
 *           "group not found" |
 *           "User not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "group not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /groups/remove/{groupId}/{targetId}/{creatorId}:
 *   put:
 *     summary: Remove a member from a shared group wallet
 *     tags: [Shared Wallet services]
 *     description: Removes the target user from the group's members. The creator must be the group admin. The admin cannot remove themself.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to remove
 *       - in: path
 *         name: creatorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the acting user (must be the group's admin)
 *     responses:
 *       200:
 *         description: Member removed and group updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group updated"
 *       400:
 *         description: >
 *           "User is not the admin" |
 *           "You Cannot Remove Yourself"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "You Cannot Remove Yourself"
 *       404:
 *         description: >
 *           "group not found" |
 *           "User not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "group not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /invitation/process/{invitationId}/{mode}:
 *   put:
 *     summary: Accept or reject a shared wallet invitation
 *     tags: [Shared Wallet services]
 *     description: Processes a pending invitation; updates group membership and removes the invitation.
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invitation to process
 *       - in: path
 *         name: mode
 *         required: true
 *         schema:
 *           type: string
 *           enum: [accept, reject]
 *         description: Action to perform on the invitation
 *     responses:
 *       200:
 *         description: Invitation processed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invitation Processed"
 *       404:
 *         description: >
 *           "invitation not found" |
 *           "Group not found" |
 *           "User not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "invitation not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /groups/batch:
 *   get:
 *     summary: Get a list of groups the user is a member of
 *     tags: [Shared Wallet services]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user's groups.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   groupName:
 *                     type: string
 *                   description:
 *                     type: string
 *                   admin:
 *                     type: string
 *                     description: ObjectId of the group's admin
 *                   members:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of member ObjectIds
 *                   pendingInvite:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of invitation ObjectIds
 *                   walletCurrency:
 *                     type: string
 *                     example: "AUD"
 *                   walletBalance:
 *                     type: number
 *                   transactionHistory:
 *                     type: array
 *                     items:
 *                       type: string
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *             example:
 *               - _id: "66d001ef3f1a3b0012ab1111"
 *                 groupName: "Housemates"
 *                 description: "Monthly shared expenses"
 *                 admin: "66c2a8d43f1a3b0012ab0001"
 *                 members:
 *                   - "66c2a8d43f1a3b0012ab0001"
 *                   - "66c2a8d43f1a3b0012ab0002"
 *                 pendingInvite:
 *                   - "66cf11aa3f1a3b0012ab2222"
 *                 walletCurrency: "AUD"
 *                 walletBalance: 250
 *                 transactionHistory:
 *                   - "66cd0c2f3f1a3b0012ab1234"
 *                 createdAt: "2025-08-10T03:15:00.000Z"
 *                 updatedAt: "2025-08-14T05:30:00.000Z"
 *       400:
 *         description: >
 *           "User not found or does not exist" |
 *           "User has no group list"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User not found or does not exist"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /invitation/batch:
 *   get:
 *     summary: Get invitations received by a user
 *     tags: [Shared Wallet services]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user's invitations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   groupName:
 *                     type: string
 *                   groupId:
 *                     type: string
 *                   sender:
 *                     type: string
 *                   receiver:
 *                     type: string
 *                   senderName:
 *                     type: string
 *                   receiverName:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *             example:
 *               - _id: "66d0409a3f1a3b0012ab1111"
 *                 groupName: "Housemates"
 *                 groupId: "66bca1a03f1a3b0012ab7890"
 *                 sender: "66c2a8d43f1a3b0012ab0001"
 *                 receiver: "66c2a8d43f1a3b0012ab0002"
 *                 senderName: "Alex Smith"
 *                 receiverName: "Jamie Lee"
 *                 createdAt: "2025-08-14T05:30:00.000Z"
 *                 updatedAt: "2025-08-14T05:30:00.000Z"
 *       400:
 *         description: >
 *           "User not found or does not exist" |
 *           "User has no invitation list"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User not found or does not exist"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /groups/member:
 *   get:
 *     summary: Get members of a shared group wallet
 *     tags: [Shared Wallet services]
 *     parameters:
 *       - in: query
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group
 *     responses:
 *       200:
 *         description: Successfully retrieved group members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: User ObjectId as string
 *                   name:
 *                     type: string
 *                     example: "Alex Smith"
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "alex@example.com"
 *                   role:
 *                     type: string
 *                     enum: [Admin, Member]
 *                     example: "Member"
 *             example:
 *               - id: "66c2a8d43f1a3b0012ab0002"
 *                 name: "Alex Smith"
 *                 email: "alex@example.com"
 *                 role: "Admin"
 *               - id: "66c2a8d43f1a3b0012ab0003"
 *                 name: "Jamie Lee"
 *                 email: "jamie@example.com"
 *                 role: "Member"
 *       400:
 *         description: >
 *           "Groups not found or does not exist" |
 *           "Groups has no member list"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Groups not found or does not exist"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /groups/{groupId}:
 *   get:
 *     summary: Get specific shared group wallet details
 *     tags: [Shared Wallet services]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved group details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   description: Array of user documents who are members of the group.
 *                   items:
 *                     type: object
 *                     description: User document (fields may vary by model).
 *                 transactionHistory:
 *                   type: array
 *                   description: Array of transaction history documents linked to the group.
 *                   items:
 *                     type: object
 *                     description: TransactionHistory document (fields may vary by model).
 *                 admin:
 *                   type: object
 *                   description: The group's admin user document.
 *                 groupName:
 *                   type: string
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 walletCurrency:
 *                   type: string
 *                   example: "AUD"
 *                 walletBalance:
 *                   type: number
 *             example:
 *               members:
 *                 - _id: "66c2a8d43f1a3b0012ab0002"
 *                   firstName: "Alex"
 *                   lastName: "Smith"
 *                   email: "alex@example.com"
 *                 - _id: "66c2a8d43f1a3b0012ab0003"
 *                   firstName: "Jamie"
 *                   lastName: "Lee"
 *                   email: "jamie@example.com"
 *               transactionHistory:
 *                 - _id: "66cd0c2f3f1a3b0012ab1234"
 *                   description: "Shared Wallet Topup"
 *                   amountSrc: 25
 *                   currencySource: "AUD"
 *                   amountDest: 25
 *                   currencyDest: "AUD"
 *                   createdAt: "2025-08-14T05:30:00.000Z"
 *               admin:
 *                 _id: "66c2a8d43f1a3b0012ab0001"
 *                 firstName: "Taylor"
 *                 lastName: "Nguyen"
 *                 email: "taylor@example.com"
 *               groupName: "Housemates"
 *               description: "Monthly shared expenses"
 *               walletCurrency: "AUD"
 *               walletBalance: 250
 *       404:
 *         description: >
 *           "group not found" |
 *           "Admin user not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "group not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /admin/requests:
 *   get:
 *     summary: Get active withdraw requests
 *     tags: [Admin services]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved withdraw requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemid:
 *                         type: string
 *                       name:
 *                         type: string
 *                       transactionId:
 *                         type: string
 *                       currency:
 *                         type: string
 *                         example: "AUD"
 *                       amount:
 *                         type: number
 *                       userId:
 *                         type: string
 *                 currentPage:
 *                   type: integer
 *                 totalRequest:
 *                   type: integer
 *                   description: "Number of requests returned in this page (not a global count)."
 *                 totalPages:
 *                   type: integer
 *             example:
 *               requests:
 *                 - itemid: "66d10f4f3f1a3b0012ab5555"
 *                   name: "Withdraw"
 *                   transactionId: "b8dd2780-48bd-013e-f604-0a58a9feac03"
 *                   currency: "AUD"
 *                   amount: 120
 *                   userId: "66c2a8d43f1a3b0012ab0001"
 *               currentPage: 1
 *               totalRequest: 1
 *               totalPages: 1
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /find/invitee/{email}/{userId}/{groupId}:
 *   get:
 *     summary: Find invitee by email for a shared wallet
 *     tags: [Shared Wallet services]
 *     description: Returns the userId of the invitee if the requester is the group's admin and the user can be invited.
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email of the target user to invite
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the acting user (must be the group's admin)
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group
 *     responses:
 *       200:
 *         description: Invitee found; returns the invitee's userId.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             example: "66c2a8d43f1a3b0012ab0002"
 *       400:
 *         description: >
 *           "You Need To Be An Admin To Invite" |
 *           "Cannot Invite Oneself" |
 *           "This Person is Already Part Of The Group" |
 *           "This Person already has a pending invite"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "You Need To Be An Admin To Invite"
 *       404:
 *         description: "Recipient not found."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Recipient not found."
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /notification/new/{userId}:
 *   get:
 *     summary: Check if user has new notifications
 *     tags: [User services]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: Returns true if there are notifications newer than the user's last seen timestamp.
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *             example: true
 *       400:
 *         description: >
 *           "User not found or does not exist" |
 *           "User has no Notification"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User not found or does not exist"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /notification/{userId}:
 *   get:
 *     summary: Get a user's notifications
 *     tags: [User services]
 *     description: Returns all notifications associated with the user and updates the user's last-seen timestamp.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: Successfully retrieved notifications.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     example: "Invitation"
 *                   sender:
 *                     oneOf:
 *                       - type: string
 *                         description: Sender user ID
 *                       - type: object
 *                         description: Populated sender user document
 *                   receiver:
 *                     oneOf:
 *                       - type: string
 *                         description: Receiver user ID
 *                       - type: object
 *                         description: Populated receiver user document
 *                   description:
 *                     type: string
 *                     example: "Alex Smith invites you to join Housemates"
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *             example:
 *               - _id: "66d1552a3f1a3b0012ab3333"
 *                 type: "Invitation"
 *                 sender:
 *                   _id: "66c2a8d43f1a3b0012ab0001"
 *                   firstName: "Alex"
 *                   lastName: "Smith"
 *                   email: "alex@example.com"
 *                 receiver:
 *                   _id: "66c2a8d43f1a3b0012ab0002"
 *                   firstName: "Jamie"
 *                   lastName: "Lee"
 *                   email: "jamie@example.com"
 *                 description: "Alex Smith invites you to join Housemates"
 *                 createdAt: "2025-08-14T05:30:00.000Z"
 *                 updatedAt: "2025-08-14T05:30:00.000Z"
 *       400:
 *         description: >
 *           "User not found or does not exist" |
 *           "User has no Notification"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User not found or does not exist"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /authentication/create/otp:
 *   post:
 *     summary: Create and email a one-time passcode (OTP)
 *     tags: [User authentication]
 *     description: Generates a 6-digit OTP for the user and sends it to their registered email address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The user's ID
 *           example:
 *             userId: "66c2a8d43f1a3b0012ab0001"
 *     responses:
 *       200:
 *         description: OTP created and email send initiated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 otpId:
 *                   type: string
 *                   description: The ID of the created OTP
 *             example:
 *               otpId: "66d1aa6a3f1a3b0012ab9999"
 *       400:
 *         description: "User Id does not exists"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User Id does not exists"
 *       500:
 *         description: >
 *           "Unable to send otp number to your email" |
 *           "Email timeout"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Unable to send otp number to your email"
 */

/**
 * @swagger
 * /authentication/verify/otp:
 *   post:
 *     summary: Verify a one-time passcode (OTP) and issue a session token
 *     tags: [User authentication]
 *     description: Verifies the OTP for the given otpId. On success, returns a JWT token and the user's ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otpId, otp, userId, email]
 *             properties:
 *               otpId:
 *                 type: string
 *                 description: ID of the OTP document to verify
 *               otp:
 *                 type: number
 *                 description: 6-digit code sent to the user's email
 *                 example: 123456
 *               userId:
 *                 type: string
 *                 description: The user's ID
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *           example:
 *             otpId: "66d1aa6a3f1a3b0012ab9999"
 *             otp: 123456
 *             userId: "66c2a8d43f1a3b0012ab0001"
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP verified successfully; session token issued.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT session token
 *                 userId:
 *                   type: string
 *                   example: "66c2a8d43f1a3b0012ab0001"
 *       400:
 *         description: >
 *           "OTP does not exist" |
 *           "No OTP has been send"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "OTP does not exist"
 *       404:
 *         description: >
 *           "OTP code has expired" |
 *           "Incorrect OTP number"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Incorrect OTP number"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /bankintegration/withdraw:
 *   get:
 *     summary: Create a Zai withdraw item
 *     tags: [Transaction services]
 *     description: Creates a **Withdraw-Request** item with the external provider and (on success) records a pending withdraw for the user.
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Amount to withdraw in source currency (AUD in current implementation)
 *         example: 120
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user initiating the withdrawal
 *         example: "66c2a8d43f1a3b0012ab0001"
 *     responses:
 *       200:
 *         description: Withdraw item created with the provider.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item Created"
 *       400:
 *         description: "User Main Balance Is Insufficient"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User Main Balance Is Insufficient"
 *       404:
 *         description: >
 *           "User user not found" |
 *           "user main wallet not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "user main wallet not found"
 *       500:
 *         description: "Unexpected error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Unexpected error"
 */

/**
 * @swagger
 * /bankintegration/deposit:
 *   get:
 *     summary: Create a Zai deposit item
 *     tags: [Transaction services]
 *     description: Creates a **Deposit-Request** item with the external provider and records a pending deposit for the user.
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Amount to deposit in source currency (AUD in current implementation)
 *         example: 120
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user initiating the deposit
 *         example: "66c2a8d43f1a3b0012ab0001"
 *     responses:
 *       200:
 *         description: Deposit item created with the provider.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item Created"
 *       404:
 *         description: >
 *           "User user not found" |
 *           "user main wallet not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "user main wallet not found"
 *       500:
 *         description: "Unexpected error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Unexpected error"
 */

/**
 * @swagger
 * /bankintegration/doTransaction/{transactionId}:
 *   get:
 *     summary: Process a pending withdraw request (admin)
 *     tags: [Admin services]
 *     description: Deletes the pending withdraw request locally and calls the provider to make the payment for the given transaction ID.
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the pending transaction to process
 *     responses:
 *       200:
 *         description: Provider processed the withdrawal.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Raw response from the external payments provider.
 *             example:
 *               id: "b8dd2780-48bd-013e-f604-0a58a9feac03"
 *               state: "completed"
 *               amount: 12000
 *               currency: "AUD"
 *               message: "Payment made"
 *       404:
 *         description: "Request not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Request not found"
 *       500:
 *         description: "Unexpected error"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "Unexpected error"
 */

/**
 * @swagger
 * /user/checkBalanceChallenges:
 *   post:
 *     summary: Check user's progress for balance-based challenges
 *     tags: [User services]
 *     description: >
 *       Evaluates all active **save** category challenges for the user, updates their progress/completions,
 *       awards EXP for newly completed challenges, and updates the user's rank.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The user's ID
 *           example:
 *             userId: "66c2a8d43f1a3b0012ab0001"
 *     responses:
 *       200:
 *         description: Challenge progress checked and updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 updated:
 *                   type: number
 *                   description: Number of active challenges that were evaluated
 *                   example: 3
 *                 completedChallenges:
 *                   type: array
 *                   description: List of challenge IDs newly completed during this check
 *                   items:
 *                     type: string
 *                   example: ["66d200aa3f1a3b0012ab1111", "66d200aa3f1a3b0012ab2222"]
 *       400:
 *         description: "userId is required"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errorMsg:
 *                   type: string
 *                   example: "userId is required"
 *       404:
 *         description: "User {userId} not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User 66c2a8d43f1a3b0012ab0001 not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /getScheduledPayments/{userId}:
 *   get:
 *     summary: Get a user's scheduled payments (paginated)
 *     tags: [Transaction services]
 *     description: Returns pending scheduled payments for a given user, with pagination.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The debtor user's ID
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved scheduled payments.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scheduledPayment:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       debtorId:
 *                         type: string
 *                       debtorEmail:
 *                         type: string
 *                         example: "alice@example.com"
 *                       creditorId:
 *                         type: string
 *                       creditorEmail:
 *                         type: string
 *                         example: "bob@example.com"
 *                       amountSrc:
 *                         type: number
 *                       amountDest:
 *                         type: number
 *                       currencySrc:
 *                         type: string
 *                         example: "AUD"
 *                       currencyDest:
 *                         type: string
 *                         example: "AUD"
 *                       scheduledDate:
 *                         type: string
 *                 currentPage:
 *                   type: integer
 *                 totalPayments:
 *                   type: integer
 *                   description: Total number of scheduled payments for the user
 *                 totalPages:
 *                   type: integer
 *             example:
 *               scheduledPayment:
 *                 - _id: "66d2c07e3f1a3b0012ab0001"
 *                   debtorId: "66c2a8d43f1a3b0012ab0001"
 *                   debtorEmail: "alice@example.com"
 *                   creditorId: "66c2a8d43f1a3b0012ab0002"
 *                   creditorEmail: "bob@example.com"
 *                   amountSrc: 50
 *                   amountDest: 50
 *                   currencySrc: "AUD"
 *                   currencyDest: "AUD"
 *                   scheduledDate: "2025-09-01T10:00:00.000Z"
 *               currentPage: 1
 *               totalPayments: 3
 *               totalPages: 1
 *       404:
 *         description: "getScheduledPayment: User not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "getScheduledPayment: User not found"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /admin/checkAllBalanceChallenges:
 *   post:
 *     summary: Check balance challenges for all active users
 *     tags: [Admin services]
 *     description: "Runs the balance-challenge evaluation for every user with `isActive: true` and returns per-user results."
 *     responses:
 *       200:
 *         description: Batch check completed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalUsers:
 *                   type: integer
 *                   description: Number of active users processed
 *                 results:
 *                   type: array
 *                   description: Per-user results (success or error)
 *                   items:
 *                     oneOf:
 *                       - type: object
 *                         required: [userId, success, updated, completedChallenges]
 *                         properties:
 *                           userId:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                             enum: [true]
 *                           updated:
 *                             type: number
 *                             description: Number of active challenges evaluated for this user
 *                           completedChallenges:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Challenge IDs newly completed
 *                       - type: object
 *                         required: [userId, success, error]
 *                         properties:
 *                           userId:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                             enum: [false]
 *                           error:
 *                             oneOf:
 *                               - type: string
 *                               - type: object
 *                                 description: Error object as returned by the server
 *             example:
 *               success: true
 *               totalUsers: 3
 *               results:
 *                 - userId: "66c2a8d43f1a3b0012ab0001"
 *                   success: true
 *                   updated: 2
 *                   completedChallenges:
 *                     - "66d200aa3f1a3b0012ab1111"
 *                 - userId: "66c2a8d43f1a3b0012ab0002"
 *                   success: false
 *                   error: "User 66c2a8d43f1a3b0012ab0002 not found"
 *                 - userId: "66c2a8d43f1a3b0012ab0003"
 *                   success: true
 *                   updated: 1
 *                   completedChallenges: []
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /transaction/save-recipient/{userId}:
 *   get:
 *     summary: Get saved recipients from past transactions
 *     tags: [Transaction services]
 *     description: Returns unique recipients the user has previously sent transactions to.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: Successfully retrieved saved recipients.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recipients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "recipient@example.com"
 *                       firstName:
 *                         type: string
 *                         example: "Alex"
 *                       lastName:
 *                         type: string
 *                         example: "Smith"
 *             example:
 *               recipients:
 *                 - email: "jamie@example.com"
 *                   firstName: "Jamie"
 *                   lastName: "Lee"
 *                 - email: "michael@example.com"
 *                   firstName: "Michael"
 *                   lastName: "Darren"
 *       404:
 *         description: "User id does not exist"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "User id does not exist"
 *       500:
 *         description: Error encountered
 */

/**
 * @swagger
 * /view/challenges/{userId}:
 *   get:
 *     summary: Get a user's challenge list
 *     tags: [User services]
 *     description: Returns all challenges (paginated) and the requesting user's progress for each, when available.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved challenges and user progress.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 challenge:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       exp:
 *                         type: number
 *                       startDate:
 *                         type: string
 *                         description: ISO date string
 *                       endDate:
 *                         type: string
 *                         description: ISO date string
 *                       category:
 *                         type: string
 *                         example: "save"
 *                       progress:
 *                         type: number
 *                         description: "Static field for display; not tied to user's progress in this response."
 *                       amountToGoal:
 *                         type: number
 *                       userProgress:
 *                         type: array
 *                         nullable: true
 *                         description: Present if the user has progress for this challenge.
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id: { type: string }
 *                             userId: { type: string }
 *                             challengeId: { type: string }
 *                             progress: { type: number }
 *                             completed: { type: boolean }
 *                             lastCheckedDate: { type: string }
 *                             createdAt: { type: string }
 *                             updatedAt: { type: string }
 *                 currentPage:
 *                   type: integer
 *                 totalPayments:
 *                   type: integer
 *                   description: "Total number of challenges (mirrors current implementation field name)."
 *                 totalPages:
 *                   type: integer
 *             example:
 *               success: true
 *               challenge:
 *                 - _id: "66d310aa3f1a3b0012ab0001"
 *                   title: "Save $500 this month"
 *                   description: "Keep your combined wallet balance at or above $500 by month end."
 *                   exp: 100
 *                   startDate: "2025-08-01T00:00:00.000Z"
 *                   endDate: "2025-08-31T23:59:59.999Z"
 *                   category: "save"
 *                   progress: 0
 *                   amountToGoal: 500
 *                   userProgress:
 *                     - _id: "66d311223f1a3b0012ababcd"
 *                       userId: "66c2a8d43f1a3b0012ab0001"
 *                       challengeId: "66d310aa3f1a3b0012ab0001"
 *                       progress: 420
 *                       completed: false
 *                       lastCheckedDate: "2025-08-14T05:30:00.000Z"
 *                       createdAt: "2025-08-02T10:00:00.000Z"
 *                       updatedAt: "2025-08-14T05:30:00.000Z"
 *                 - _id: "66d310aa3f1a3b0012ab0002"
 *                   title: "Save $1000 this quarter"
 *                   description: "Maintain a $1000 balance across wallets."
 *                   exp: 300
 *                   startDate: "2025-07-01T00:00:00.000Z"
 *                   endDate: "2025-09-30T23:59:59.999Z"
 *                   category: "save"
 *                   progress: 0
 *                   amountToGoal: 1000
 *                   userProgress: null
 *               currentPage: 1
 *               totalPayments: 12
 *               totalPages: 2
 *       404:
 *         description: "getChallenges: User not found"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorMsg:
 *                   type: string
 *                   example: "getChallenges: User not found"
 *       500:
 *         description: Error encountered
 */