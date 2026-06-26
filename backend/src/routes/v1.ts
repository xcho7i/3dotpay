import { Router } from 'express';

import { healthRouter } from '../modules/health/health.routes.js';
import { paymentRouter } from '../modules/payment/payment.routes.js';
import { qrRouter } from '../modules/qr/qr.routes.js';
import { quoteRouter } from '../modules/quote/quote.routes.js';
import { transactionRouter } from '../modules/transaction/transaction.routes.js';
import { userRouter } from '../modules/user/user.routes.js';
import { walletRouter } from '../modules/wallet/wallet.routes.js';

/** Aggregates all v1 feature routers. Mounted at /api/v1 in app.ts. */
export const v1Router: Router = Router();

v1Router.use(healthRouter);
v1Router.use(userRouter);
v1Router.use(walletRouter);
v1Router.use(qrRouter);
v1Router.use(quoteRouter);
v1Router.use(paymentRouter);
v1Router.use(transactionRouter);
