import React, { useEffect, useState, useMemo, useCallback } from 'react';

// Next.js imports removed: Head, useRouter, Link

// --- Interface dan Tipe Data (Harus konsisten dengan index.tsx) ---

interface Product {
    _id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    category: string;
}

interface CartItem extends Product {
    quantity: number;
}

const SHIPPING_COST = 25000; // Biaya pengiriman tetap

// Fungsi utilitas untuk memformat mata uang
const formatRupiah = (amount: number) => {
    // Memformat angka ke string Rupiah (contoh: 12.345)
    return `Rp${amount.toLocaleString('id-ID')}`;
};

const Checkout: React.FC = () => {
    const [cart, setCart] = useState<any[]>([]); 
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    // useRouter dihapus

    // --- Logic Pengambilan dan Perhitungan Keranjang ---
    useEffect(() => {
        const storedCart = sessionStorage.getItem('cartItems');
        if (storedCart) {
            try {
                const parsedCart = JSON.parse(storedCart) as CartItem[];
                setCart(parsedCart.filter(item => item.quantity > 0));
            } catch(e) {
                console.error("Gagal parse cart dari session storage:", e);
                setMessage({ type: 'error', text: 'Gagal memuat data keranjang.' });
                setCart([]);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!loading) {
            sessionStorage.setItem('cartItems', JSON.stringify(cart));
        }
    }, [cart, loading]);

    const summary = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const total = subtotal + SHIPPING_COST;
        return { subtotal, total };
    }, [cart]);
    
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    const updateQuantity = useCallback((id: string, delta: number) => {
        setCart(prevCart => {
            const updatedCart = prevCart.map(item =>
                item._id === id ? { ...item, quantity: item.quantity + delta } : item
            ).filter(item => item.quantity > 0);

            return updatedCart;
        });
    }, []);

    // --- Handler Checkout: MEMASTIKAN PENGALIHAN ---
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !email.includes('@')) {
            setMessage({ type: 'error', text: 'Mohon masukkan alamat email yang valid.' });
            return;
        }

        if (cart.length === 0) {
            setMessage({ type: 'error', text: 'Keranjang belanja Anda kosong.' });
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        const checkoutData = {
            items: cart.map(item => ({
                productId: item._id, 
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            payerEmail: email,
        };
        
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal membuat invoice dari backend.');
            }

            const result = await response.json();
            
            const redirectUrl = result.invoice_url;

            if (redirectUrl) {
                // --- LOG KRITIS: CEK DI CONSOLE BROWSER ANDA ---
                console.log("Xendit Invoice Successful. Redirecting to:", redirectUrl);
                
                // Hapus keranjang dari session storage setelah sukses
                sessionStorage.removeItem('cartItems'); 

                // Lakukan pengalihan ke URL eksternal Xendit
                window.location.href = redirectUrl; 
            } else {
                console.error("ERROR: URL pembayaran tidak ditemukan dalam respons:", result);
                setMessage({ type: 'error', text: 'URL pembayaran tidak ditemukan dalam respons server.' });
            }

        } catch (error) {
            console.error('Checkout Frontend Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga saat checkout.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Komponen Render ---

    if (loading) {
        return <div style={{padding: '32px', textAlign: 'center', fontSize: '20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6'}}>
            Memuat keranjang...
        </div>;
    }

    if (cart.length === 0 && !message) {
        return (
            <div style={{maxWidth: '800px', margin: '80px auto', padding: '32px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}>
                <title>Keranjang Kosong</title>
                <h1 style={{fontSize: '32px', fontWeight: '800', color: '#dc2626'}}>Keranjang Kosong 🛒</h1>
                <p style={{marginTop: '12px', fontSize: '18px', color: '#6b7280'}}>
                    Silakan kembali ke halaman produk untuk memilih item.
                </p>
                <a href="/" style={{display: 'inline-block', marginTop: '24px', backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600'}}>
                    Lihat Produk
                </a>
            </div>
        );
    }

    return (
        <div style={{maxWidth: '1000px', margin: '40px auto', padding: '20px', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', borderRadius: '16px'}}>
            {/* Mengganti <Head> dengan <title> biasa */}
            <title>Checkout Pesanan</title>

            <header style={{textAlign: 'center', marginBottom: '32px'}}>
                <h1 style={{fontSize: '36px', fontWeight: '800', color: '#3730a3'}}>
                    Konfirmasi Checkout
                </h1>
                <p style={{fontSize: '18px', color: '#6b7280'}}>Tinjau pesanan Anda sebelum melanjutkan ke pembayaran.</p>
            </header>

            <div style={{display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: '#ffffff', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}>
                
                {/* Bagian 1: Daftar Item Keranjang */}
                <div>
                    <h2 style={{fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px'}}>
                        🛒 Detail Pesanan ({totalItems} Item)
                    </h2>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                        {cart.map((item) => (
                            <div key={item._id} style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6'}}>
                                
                                <div style={{display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1, minWidth: '200px'}}>
                                    <img 
                                        src={item.image || `https://placehold.co/60x60/3730a3/ffffff?text=${item.name.substring(0, 1)}`} 
                                        alt={item.name} 
                                        style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px'}} 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).onerror = null; 
                                            (e.target as HTMLImageElement).src = `https://placehold.co/60x60/3730a3/ffffff?text=${item.name.substring(0, 1)}`;
                                        }}
                                    />
                                    <span style={{fontWeight: '600', color: '#1f2937'}}>{item.name}</span>
                                </div>

                                <div style={{display: 'flex', alignItems: 'center', gap: '8px', width: '150px', justifyContent: 'center', margin: '8px 0'}}>
                                    <button 
                                        onClick={() => updateQuantity(item._id, -1)}
                                        style={{backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: '700'}}
                                    >-</button>
                                    <span style={{fontWeight: '700', fontSize: '16px'}}>{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item._id, 1)}
                                        style={{backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: '700'}}
                                    >+</button>
                                </div>
                                
                                <div style={{width: '150px', textAlign: 'right', margin: '8px 0'}}>
                                    <span style={{fontWeight: '600', color: '#4f46e5'}}>
                                        {formatRupiah(item.price * item.quantity)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bagian 2: Ringkasan Tagihan */}
                <div style={{marginTop: '20px', padding: '20px', border: '2px dashed #e5e7eb', borderRadius: '16px', backgroundColor: '#f9fafb'}}>
                    <h2 style={{fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '20px'}}>
                        📄 Ringkasan Tagihan
                    </h2>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '16px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span style={{color: '#6b7280'}}>Subtotal Produk:</span>
                            <span style={{fontWeight: '500'}}>{formatRupiah(summary.subtotal)}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb'}}>
                            <span style={{color: '#6b7280'}}>Biaya Pengiriman:</span>
                            <span style={{fontWeight: '500'}}>{formatRupiah(SHIPPING_COST)}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', paddingTop: '10px', fontSize: '20px', fontWeight: '800'}}>
                            <span style={{color: '#3730a3'}}>Total Pembayaran:</span>
                            <span style={{color: '#ec4899'}}>{formatRupiah(summary.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Bagian 3: Formulir & Tombol Checkout */}
                <form onSubmit={handleCheckout} style={{marginTop: '20px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                    
                    <h2 style={{fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '16px'}}>
                        ✉️ Data Pembeli
                    </h2>
                    
                    <label htmlFor="email" style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4b5563'}}>Alamat Email (Wajib untuk Invoice)</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contoh@email.com"
                        required
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '16px',
                            marginBottom: '20px',
                            boxSizing: 'border-box'
                        }}
                        disabled={isProcessing}
                    />

                    {/* Pesan Status */}
                    {message && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            fontWeight: '600',
                            backgroundColor: message.type === 'error' ? '#fee2e2' : '#d1fae5',
                            color: message.type === 'error' ? '#dc2626' : '#059669',
                            border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#34d399'}`
                        }}>
                            {message.text}
                        </div>
                    )}
                    
                    {/* Tombol Proses Pembayaran */}
                    <button
                        type="submit"
                        disabled={isProcessing}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: isProcessing ? '#93c5fd' : '#4f46e5',
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '18px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s',
                            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)'
                        }}
                    >
                        {isProcessing ? 'Memproses Pesanan...' : `Lanjut ke Pembayaran ${formatRupiah(summary.total)}`}
                    </button>
                    <p style={{textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#6b7280'}}>
                        Anda akan diarahkan ke halaman pembayaran eksternal (Xendit).
                    </p>
                </form>
            </div>
            <div style={{textAlign: 'center', marginTop: '20px'}}>
                <a href="/" style={{color: '#4f46e5', textDecoration: 'none', fontWeight: '500'}}>
                    &larr; Kembali Berbelanja
                </a>
            </div>
        </div>
    );
};

export default Checkout;