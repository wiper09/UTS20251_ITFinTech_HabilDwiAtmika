import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/dbConnect';
import Payment from '../../models/Payment';
// Pastikan Anda juga mengimpor model Checkout jika Anda ingin memperbarui statusnya juga
// import Checkout from '../../models/Checkout'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            // Data yang dikirim oleh Xendit dalam body request
            // external_id: ID yang kita kirim ke Xendit (yaitu Checkout ID Mongoose)
            // status: Status pembayaran dari Xendit (PAID, EXPIRED, dll.)
            const { external_id, status } = req.body; 

            // --- PENTING: VERIFIKASI X-Callback-Token ---
            // SANGAT DISARANKAN untuk keamanan. Anda perlu mengatur token di .env dan Dashboard Xendit.
            /*
            const xCallbackToken = req.headers['x-callback-token'];
            if (xCallbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) { 
               return res.status(401).json({ message: 'Unauthorized Webhook' }); 
            }
            */

            // Lakukan koneksi ke database
            await dbConnect();

            // Kita hanya peduli jika statusnya PAID
            if (status === 'PAID' || status === 'paid') {
                
                // 1. Perbarui status di koleksi Payment
                // Mencari payment berdasarkan externalId (yang merupakan Checkout ID Mongoose)
                const updatedPayment = await Payment.findOneAndUpdate(
                    { externalId: external_id }, 
                    { status: 'SUCCESS', paidAt: new Date() }, // Set status ke SUCCESS
                    { new: true }
                );

                if (!updatedPayment) {
                    console.warn(`Webhook received for unknown externalId (Checkout ID): ${external_id}`);
                    // Mengembalikan 404 jika ID tidak ditemukan adalah respons yang wajar
                    return res.status(404).json({ message: 'Payment record not found for the given externalId' });
                }

                // 2. (Opsional) Perbarui status di koleksi Checkout
                // Jika Anda ingin memperbarui status di koleksi Checkout juga:
                // await Checkout.findByIdAndUpdate(updatedPayment.checkoutId, { status: 'SUCCESS' }); 

                console.log(`[XENDIT WEBHOOK] SUCCESS: Payment for externalId ${external_id} updated to SUCCESS.`);
                res.status(200).json({ success: true, message: 'Payment status updated to SUCCESS' });
            } else {
                // Handle status lain (misalnya EXPIRED atau CANCELLED)
                if (status === 'EXPIRED') {
                     await Payment.findOneAndUpdate(
                        { externalId: external_id }, 
                        { status: 'EXPIRED' },
                        { new: true }
                    );
                }
                console.log(`[XENDIT WEBHOOK] Received status: ${status}. No action taken for non-PAID event.`);
                res.status(200).json({ message: `Status received: ${status}, update logic skipped.` });
            }
        } catch (error: any) {
            console.error('Xendit Webhook Error:', error);
            // Penting: Kembalikan respons, meskipun dengan status error internal, untuk mencegah Xendit retry.
            res.status(400).json({ success: false, message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
