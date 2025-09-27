import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/dbConnect';

// Asumsikan model Product memiliki tipe IProduct yang sudah didefinisikan 
// di file Product.ts, yang perlu diimpor
import Product, { IProduct } from '../../models/Product'; 

// Definisikan tipe respons yang ketat
type ApiResponse = { 
  success: boolean; 
  data?: IProduct[] | null; 
  message?: string; 
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse> // Gunakan tipe yang sudah didefinisikan
) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      // Mengambil semua produk dari database
      const products = await Product.find({});
      res.status(200).json({ success: true, data: products as IProduct[] });
    } catch (error) {
      // Pengecekan tipe untuk variabel error
      let errorMessage = 'Terjadi kesalahan pada server.';
      
      if (error instanceof Error) {
        // Jika error adalah instance dari Error, gunakan message-nya
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        // Penanganan jika error adalah objek dengan properti 'message'
        errorMessage = (error as { message: string }).message;
      }
      
      // Kirim respons error dengan pesan yang aman
      res.status(500).json({ 
        success: false, 
        message: `Gagal memuat produk: ${errorMessage}` 
      });
    }
  } else {
    // Penanganan Method Not Allowed
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
