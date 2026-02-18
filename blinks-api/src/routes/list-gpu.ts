import { Router } from 'express';
import { ACTIONS_CORS_HEADERS, ActionGetResponse } from '@solana/actions';

const router = Router();

router.get('/', async (req, res) => {
  const response: ActionGetResponse = {
    icon: 'https://flux.market/provider-icon.png',
    title: 'List Your GPU on Flux',
    description: 'Monetize your idle GPU by listing it on the Flux marketplace. Earn passive income from your hardware.',
    label: 'List GPU',
    links: {
      actions: [
        {
          type: 'transaction',
          label: 'List GPU',
          href: '/api/actions/list-gpu',
          parameters: [
            {
              name: 'gpuModel',
              label: 'GPU Model (e.g., RTX4090)',
              required: true,
            },
            {
              name: 'pricePerHour',
              label: 'Price per hour (SOL)',
              required: true,
            },
            {
              name: 'vram',
              label: 'VRAM (GB)',
              required: true,
            },
          ],
        },
      ],
    },
  };
  
  res.set(ACTIONS_CORS_HEADERS).json(response);
});

router.options('/', (req, res) => {
  res.set(ACTIONS_CORS_HEADERS).status(200).end();
});

export { router as listGPURouter };
