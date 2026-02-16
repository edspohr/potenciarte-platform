import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import { createNestServer } from './main';

const server = express();
let appInitialized = false;

export const api = onRequest(async (request, response) => {
  if (!appInitialized) {
    await createNestServer(server);
    appInitialized = true;
  }
  server(request, response);
});
