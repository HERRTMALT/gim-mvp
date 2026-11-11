// Entrypoint que Vercel detecta como aplicación Express.
//
// Reexporta el bundle ESM ya compilado (`npm run build` -> tsup) para que el
// runtime serverless no tenga que compilar TypeScript ni resolver imports sin
// extensión, que fallan bajo ESM (`ERR_MODULE_NOT_FOUND`).
import express from 'express';
import app from './dist/vercel/index.js';

// Vercel exige que el entrypoint importe `express` para detectar el framework.
// La app real es la del bundle; este import solo cumple la detección.
void express;

export default app;
