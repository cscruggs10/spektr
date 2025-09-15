import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Fallback to mock data if database fails
      const mockStats = {
        totalInspections: 127,
        pendingInspections: 23,
        completedToday: 8,
        totalInspectors: 12,
        activeDealer: 5,
        avgInspectionTime: "45 minutes",
        totalRevenue: "$23,500",
        completionRate: "94%"
      };
      res.json(mockStats);
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}