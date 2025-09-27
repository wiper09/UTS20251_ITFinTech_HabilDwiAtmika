import { NextApiRequest, NextApiResponse } from 'next';
import { Buffer } from 'buffer'; // Import Buffer untuk Node.js

// --- INTERFACE DAN TYPING ---
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

// Definisikan tipe untuk req.body yang datang dari frontend
interface CheckoutRequestBody {
    items: CartItem[];
    payerEmail: string;
}

const mockDB: Record<string, Order> = {}; 

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Gunakan destructuring dan casting untuk typing yang kuat
    const { items, payerEmail } = req.body as CheckoutRequestBody; 

    if (!items || items.length === 0 || !payerEmail) {
        return res.status(400).json({ message: 'Data pesanan tidak lengkap.' });
    }

    const subtotal = items.reduce((acc: number, item: CartItem) => acc + (item.price * item.quantity), 0); // Tipe eksplisit untuk acc
    const SHIPPING_COST = 25000;
    const totalAmount = subtotal + SHIPPING_COST;
    
    const externalId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const invoiceDuration = 3600; 

    const vercelUrl = process.env.VERCEL_URL || 'http://localhost:3000';

    const invoiceData = {
        external_id: externalId,
        payer_email: payerEmail,
        description: `Pembelian produk di toko demo. Total ${items.length} item.`,
        amount: totalAmount,
        invoice_duration: invoiceDuration,
        success_redirect_url: `${vercelUrl}/success`, 
        failure_redirect_url: `${vercelUrl}/failure`, 
        items: items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
    };

    try {
        const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
        
        if (!XENDIT_SECRET_KEY) {
            throw new Error("XENDIT_SECRET_KEY not configured.");
        }

        const encodedKey = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

        const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${encodedKey}`
            },
            body: JSON.stringify(invoiceData)
        });

        // Hapus 'any' dengan membiarkan result infer dari response.json()
        const xenditResult: any = await xenditResponse.json(); 

        if (!xenditResponse.ok) {
            console.error('Xendit Error:', xenditResult);
            return res.status(xenditResponse.status).json({ message: xenditResult.message || 'Gagal membuat invoice di Xendit.' });
        }

        const newOrder: Order = { 
            externalId: externalId,
            email: payerEmail,
            items: items,
            status: 'PENDING', 
            createdAt: new Date(),
            xenditInvoiceId: xenditResult.id 
        };
        mockDB[xenditResult.id] = newOrder;

        return res.status(200).json({
            message: 'Invoice berhasil dibuat',
            invoice_url: xenditResult.invoice_url,
        });

    } catch (error) {
        console.error('API Error:', error);
        // Tipe error diperiksa dan dicasting untuk keamanan
        const errorMessage = error instanceof Error ? error.message : 'Kesalahan internal server saat memproses checkout.';
        return res.status(500).json({ message: errorMessage });
    }
}
