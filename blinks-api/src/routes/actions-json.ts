import { Request, Response } from 'express';

export function actionsJson(req: Request, res: Response) {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  
  res.json({
    rules: [
      {
        pathPattern: '/api/actions/**',
        apiPath: '/api/actions/**',
      },
    ],
  });
}
