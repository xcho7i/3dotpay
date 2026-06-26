import { type RequestHandler } from 'express';

import { getHealth } from './health.service.js';

export const healthCheck: RequestHandler = (_req, res) => {
  res.json(getHealth());
};
