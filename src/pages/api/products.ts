import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/dbConnect';
import Product, { IProduct } from '../../models/Product';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; data?: IProduct[] | null; message?: string }>
) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const products = await Product.find({});
      res.status(200).json({ success: true, data: products });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}