import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import { createNestServer } from './main';

const server = express();

export const api = onRequest(async (request, response) => {
  await createNestServer(server);
  server(request, response);
});
