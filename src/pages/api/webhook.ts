import { NextApiRequest, NextApiResponse } from 'next';

// --- INTERFACE DAN TYPING ---

// Interface untuk payload yang dikirim oleh Xendit Webhook
interface XenditWebhookPayload {
    id: string; // Xendit Invoice ID
    external_id: string;
    user_id: string;
    status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED' | 'CANCELLED';
    paid_amount: number;
    // ... properti lain dari Xendit payload
}

// Interface Order (harus sama dengan yang ada di checkout.ts)
interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    externalId: string;
    email: string;
    items: CartItem[];
    status: 'PENDING' | 'PAID' | 'EXPIRED'; 
    createdAt: Date;
    xenditInvoiceId?: string;
}

// PENTING: Untuk lingkungan Vercel atau produksi, Anda HARUS menggunakan database
// eksternal (seperti MongoDB, Firestore, atau Redis) yang dapat diakses oleh kedua file API.
// mockDB yang diekspor/disimpan di satu file tidak akan dapat diakses oleh file serverless
// lainnya. Untuk DEMO ini, kita harus mengasumsikan adanya mekanisme untuk mencari pesanan
// berdasarkan ID.

// Karena kita tidak dapat menggunakan import/export silang (cross-file import/export) yang
// aman di lingkungan serverless ini, kita hanya bisa mendemonstrasikan LOGIKA pencarian dan pembaruan.
function findOrderById(invoiceId: string): Order | undefined {
    // Di sini seharusnya ada: return db.orders.findByXenditId(invoiceId);
    // Untuk demo, kita kembalikan objek mock yang PENDING jika ID cocok:
    if (invoiceId.startsWith('invoice-')) {
         return { 
            externalId: 'mock-order-123',
            email: 'dummy@example.com',
            items: [{ productId: 'P01', name: 'Product A', price: 100000, quantity: 1 }],
            status: 'PENDING', 
            createdAt: new Date(),
            xenditInvoiceId: invoiceId
        };
    }
    return undefined;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 1. Ambil X-Callback-Token dari header
    const receivedToken = req.headers['x-callback-token'];
    
    // Ambil Callback Token dari Environment Variables
    const expectedToken = process.env.XENDIT_CALLBACK_TOKEN;

    // 2. Validasi Token Keamanan
    if (!expectedToken) {
        console.error('XENDIT_CALLBACK_TOKEN is not configured in environment.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }
    
    if (receivedToken !== expectedToken) {
        console.warn('Webhook received with invalid callback token.');
        return res.status(403).json({ message: 'Forbidden: Invalid Callback Token' });
    }

    // 3. Destrukturisasi Payload Xendit
    const invoice = req.body as XenditWebhookPayload;
    
    if (!invoice || !invoice.id || !invoice.status) {
        return res.status(400).json({ message: 'Invalid invoice payload' });
    }

    const invoiceId = invoice.id;
    const newStatus = invoice.status;

    try {
        // 4. Cari Pesanan di Database Anda
        const orderToUpdate = findOrderById(invoiceId); 

        if (!orderToUpdate) {
            console.error(`Order with Invoice ID ${invoiceId} not found in DB.`);
            // Beri respons 200 agar Xendit tidak mencoba mengirim ulang
            return res.status(200).json({ message: 'Invoice received, but related order not found in DB.' });
        }

        // 5. Perbarui Status Pembayaran
        if (newStatus === 'PAID' || newStatus === 'SETTLED') {
            // Perbarui status hanya jika status saat ini belum LUNAS
            if (orderToUpdate.status !== 'PAID') {
                
                // --- LOGIKA UPDATE DATABASE NYATA DI SINI ---
                // await db.orders.update(orderToUpdate.id, { status: 'PAID' });
                // --- SIMULASI ---
                orderToUpdate.status = 'PAID'; 
                
                console.log(`✅ Success: Invoice ${invoiceId} updated to PAID for ${orderToUpdate.email}.`);

            } else {
                console.log(`Invoice ${invoiceId} already PAID. No update needed.`);
            }
        } else if (newStatus === 'EXPIRED' || newStatus === 'CANCELLED') {
            // Logika untuk pesanan kadaluarsa/dibatalkan
            // await db.orders.update(orderToUpdate.id, { status: 'EXPIRED' });
            orderToUpdate.status = 'EXPIRED'; // SIMULASI UPDATE DB
            console.log(`⚠️ Warning: Invoice ${invoiceId} updated to ${newStatus}.`);
        }
        
        // Selalu kembalikan status 200 OK ke Xendit
        return res.status(200).json({ message: 'Webhook processed successfully' });

    } catch (error) {
        console.error('Webhook Processing Error:', error);
        // Kembalikan 500 jika ada kesalahan internal yang parah
        return res.status(500).json({ message: 'Internal Server Error during webhook processing' });
    }
}