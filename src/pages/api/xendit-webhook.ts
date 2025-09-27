import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/dbConnect';
import Payment from '../../models/Payment';
// Pastikan Anda juga mengimpor model Checkout jika Anda ingin memperbarui statusnya juga
// import Checkout from '../../models/Checkout'; 

// --- INTERFACE XENDIT WEBHOOK BODY ---
// Definisikan tipe untuk data yang paling penting dari body webhook Xendit Invoice
interface XenditWebhookBody {
    event: string; // Misalnya: 'invoice.paid', 'invoice.expired'
    external_id: string; // ID yang kita kirim ke Xendit (yaitu externalId/Checkout ID Mongoose)
    status: 'PAID' | 'EXPIRED' | 'SETTLED' | 'PENDING' | 'CANCELLED' | string; 
    id: string; // ID Invoice Xendit
    // Tambahkan properti lain yang mungkin Anda gunakan, misal:
    // amount: number;
    // payer_email: string;
}

// Definisikan tipe respons API
type ApiResponse = {
    success: boolean;
    message: string;
} | {
    message: string;
};


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method === 'POST') {
        
        // Casting req.body ke tipe yang telah didefinisikan
        const { external_id, status } = req.body as XenditWebhookBody; 

        try {
            // --- PENTING: VERIFIKASI X-Callback-Token ---
            const xCallbackToken = req.headers['x-callback-token'];
            
            // Logika verifikasi token (dapat diaktifkan jika XENDIT_WEBHOOK_TOKEN sudah diatur)
            // if (xCallbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) { 
            //    return res.status(401).json({ message: 'Unauthorized Webhook' }); 
            // }
            
            if (!external_id || !status) {
                return res.status(400).json({ message: 'Invalid webhook data: missing external_id or status' });
            }

            // Lakukan koneksi ke database
            await dbConnect();

            // Kita hanya peduli jika statusnya PAID
            if (status.toUpperCase() === 'PAID' || status.toUpperCase() === 'SETTLED') {
                
                // 1. Perbarui status di koleksi Payment
                const updatedPayment = await Payment.findOneAndUpdate(
                    { externalId: external_id }, 
                    { status: 'SUCCESS', paidAt: new Date() }, // Set status ke SUCCESS
                    { new: true }
                );

                if (!updatedPayment) {
                    console.warn(`Webhook received for unknown externalId (Checkout ID): ${external_id}`);
                    // Mengembalikan 200/202 adalah lebih baik untuk webhook, agar Xendit tidak retry, 
                    // namun tetap log warning
                    return res.status(202).json({ message: 'Payment record not found, skipped update.' });
                }

                // 2. (Opsional) Perbarui status di koleksi Checkout
                // Jika Anda ingin memperbarui status di koleksi Checkout juga:
                // await Checkout.findByIdAndUpdate(updatedPayment.checkoutId, { status: 'SUCCESS' }); 

                console.log(`[XENDIT WEBHOOK] SUCCESS: Payment for externalId ${external_id} updated to SUCCESS.`);
                return res.status(200).json({ success: true, message: 'Payment status updated to SUCCESS' });
            
            } else if (status.toUpperCase() === 'EXPIRED' || status.toUpperCase() === 'CANCELLED') {
                // Handle status lain (misalnya EXPIRED atau CANCELLED)
                await Payment.findOneAndUpdate(
                    { externalId: external_id }, 
                    { status: status.toUpperCase() },
                    { new: true }
                );
                
                console.log(`[XENDIT WEBHOOK] Received status: ${status}. Order updated to ${status.toUpperCase()}.`);
                return res.status(200).json({ message: `Status received: ${status}, order updated.` });
            
            } else {
                console.log(`[XENDIT WEBHOOK] Received status: ${status}. No specific action taken.`);
                return res.status(200).json({ message: `Status received: ${status}, no action taken.` });
            }

        } catch (error) {
            // Menghapus 'any' dengan pemeriksaan tipe
            let errorMessage = 'Kesalahan internal server saat memproses webhook.';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = (error as { message: string }).message;
            }
            
            console.error('Xendit Webhook Error:', errorMessage);
            
            // Penting: Kembalikan 200/202 meskipun ada error internal *setelah* koneksi, 
            // agar Xendit tidak terus menerus me-retry. 
            // Namun, jika error di awal (sebelum dbConnect), 400 atau 500 bisa digunakan.
            return res.status(202).json({ message: `Failed to process webhook internally: ${errorMessage}` });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}