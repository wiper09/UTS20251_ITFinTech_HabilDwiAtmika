import { NextApiRequest, NextApiResponse } from 'next';

// --- INTERFACE DAN TYPING ---

interface XenditWebhookPayload {
    id: string; 
    external_id: string;
    user_id: string;
    status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED' | 'CANCELLED';
    paid_amount: number;
    // ... tambahkan properti lain yang Anda butuhkan
}

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

function findOrderById(invoiceId: string): Order | undefined {
    // Fungsi mock tetap sama, hanya untuk demonstrasi logika serverless
    console.log(`[Webhook] Trying to find order for Invoice ID: ${invoiceId}`);
    
    if (invoiceId) {
         return { 
            externalId: `order-from-db-${invoiceId.substring(0, 5)}`,
            email: 'verified_via_webhook@tokodemo.com',
            items: [],
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

    // Header selalu bertipe string atau string[] | undefined. Kita casting ke string.
    const receivedToken = req.headers['x-callback-token'] as string | undefined; 
    const expectedToken = process.env.XENDIT_CALLBACK_TOKEN;

    // --- 1. Validasi Token Keamanan ---
    if (!expectedToken) {
        console.error('ERROR: XENDIT_CALLBACK_TOKEN is not configured in environment.');
        return res.status(500).json({ message: 'Server configuration error.' });
    }
    
    if (receivedToken !== expectedToken) {
        console.warn('SECURITY WARNING: Webhook received with invalid callback token.');
        return res.status(403).json({ message: 'Forbidden: Invalid Callback Token' });
    }

    // --- 2. Validasi Payload ---
    // Casting req.body ke tipe yang spesifik untuk menghilangkan error 'any'
    const invoice = req.body as XenditWebhookPayload; 
    
    if (!invoice || !invoice.id || !invoice.status) {
        return res.status(400).json({ message: 'Invalid invoice payload' });
    }

    const invoiceId = invoice.id;
    const newStatus = invoice.status;

    try {
        // ... (Logika Webhook lainnya tidak berubah)

        const orderToUpdate = findOrderById(invoiceId); 

        if (!orderToUpdate) {
            console.error(`[Webhook] Order with Invoice ID ${invoiceId} not found in DB.`);
            return res.status(200).json({ message: 'Invoice received, but related order not found in DB.' });
        }

        if (newStatus === 'PAID' || newStatus === 'SETTLED') {
            if (orderToUpdate.status !== 'PAID') {
                orderToUpdate.status = 'PAID'; 
                console.log(`✅ Success: Invoice ${invoiceId} updated to PAID/SETTLED. Internal Order ID: ${orderToUpdate.externalId}`);
            } else {
                console.log(`[Webhook] Invoice ${invoiceId} already PAID. Skipping update.`);
            }
        } else if (newStatus === 'EXPIRED' || newStatus === 'CANCELLED') {
            orderToUpdate.status = 'EXPIRED'; 
            console.log(`⚠️ Warning: Invoice ${invoiceId} updated to ${newStatus}. Internal Order ID: ${orderToUpdate.externalId}`);
        }
        
        return res.status(200).json({ message: 'Webhook processed successfully' });

    } catch (error) {
        console.error('[Webhook] Processing Error:', error);
        return res.status(500).json({ message: 'Internal Server Error during webhook processing' });
    }
}