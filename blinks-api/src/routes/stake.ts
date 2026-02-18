import { Router } from 'express';
import { ACTIONS_CORS_HEADERS, ActionGetResponse } from '@solana/actions';

const router = Router();

router.get('/', async (req, res) => {
  const response: ActionGetResponse = {
    icon: 'https://flux.market/stake-icon.png',
    title: 'Stake SOL for SLA Tier',
    description: 'Stake SOL to increase your provider reputation and unlock higher SLA tiers with better earnings.',
    label: 'Stake SOL',
    links: {
      actions: [
        {
          type: 'transaction',
          label: 'Bronze (10 SOL)',
          href: '/api/actions/stake?amount=10&tier=0',
        },
        {
          type: 'transaction',
          label: 'Silver (50 SOL)',
          href: '/api/actions/stake?amount=50&tier=1',
        },
        {
          type: 'transaction',
          label: 'Gold (100 SOL)',
          href: '/api/actions/stake?amount=100&tier=2',
        },
        {
          type: 'transaction',
          label: 'Platinum (250 SOL)',
          href: '/api/actions/stake?amount=250&tier=3',
        },
      ],
    },
  };
  
  res.set(ACTIONS_CORS_HEADERS).json(response);
});

router.options('/', (req, res) => {
  res.set(ACTIONS_CORS_HEADERS).status(200).end();
});

export { router as stakeRouter };
