import { NextApiRequest, NextApiResponse } from 'next';

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
    status: 'PENDING' | 'PAID' | 'EXPIRED'; // Status Pembayaran
    createdAt: Date;
    xenditInvoiceId?: string; // Akan ditambahkan setelah invoice dibuat
}

// --- SIMULASI DATABASE SEMENTARA (In-memory Storage) ---
// Key: Xendit Invoice ID (string), Value: Order Object
// Dalam aplikasi nyata, ini harus diganti dengan Database yang persisten.
const mockDB: Record<string, Order> = {};

// Anda mungkin perlu menyesuaikan tipe req.body karena ia datang dari frontend
interface CheckoutRequestBody {
    items: CartItem[];
    payerEmail: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        // Next.js NextApiResponse menggunakan .json() secara otomatis
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { items, payerEmail } = req.body as CheckoutRequestBody;

    if (!items || items.length === 0 || !payerEmail) {
        return res.status(400).json({ message: 'Data pesanan tidak lengkap.' });
    }

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const SHIPPING_COST = 25000;
    const totalAmount = subtotal + SHIPPING_COST;
    
    // Siapkan data untuk Xendit
    const externalId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const invoiceDuration = 3600; // 1 jam

    const invoiceData = {
        external_id: externalId,
        payer_email: payerEmail,
        description: `Pembelian produk di toko demo. Total ${items.length} item.`,
        amount: totalAmount,
        invoice_duration: invoiceDuration,
        // Pastikan VERCEL_URL diatur di environtment Anda
        success_redirect_url: process.env.VERCEL_URL ? `${process.env.VERCEL_URL}/success` : 'http://localhost:3000/success',
        failure_redirect_url: process.env.VERCEL_URL ? `${process.env.VERCEL_URL}/failure` : 'http://localhost:3000/failure',
        items: items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
    };

    try {
        // Ambil Kunci Rahasia Xendit dari Environment Variables
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

        const xenditResult = await xenditResponse.json();

        if (!xenditResponse.ok) { // Menggunakan .ok untuk memeriksa status 2xx
            console.error('Xendit Error:', xenditResult);
            return res.status(xenditResponse.status).json({ message: xenditResult.message || 'Gagal membuat invoice di Xendit.' });
        }

        // --- SIMPAN DATA PESANAN KE DB MOCK ---
        const newOrder: Order = { 
            externalId: externalId,
            email: payerEmail,
            items: items,
            status: 'PENDING', 
            createdAt: new Date(),
            xenditInvoiceId: xenditResult.id // Simpan ID Invoice Xendit
        };

        // Simpan ke mockDB menggunakan Xendit Invoice ID sebagai kunci
        mockDB[xenditResult.id] = newOrder;

        console.log(`Order created and saved: ${newOrder.xenditInvoiceId}`);

        return res.status(200).json({
            message: 'Invoice berhasil dibuat',
            invoice_url: xenditResult.invoice_url,
        });

    } catch (error) {
        console.error('API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Kesalahan internal server saat memproses checkout.';
        return res.status(500).json({ message: errorMessage });
    }
}