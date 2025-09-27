import React, { useEffect, useState, useMemo, useCallback } from 'react';
// import Head from 'next/head'; // <-- Dihapus
// import { useRouter } from 'next/router'; // <-- Dihapus

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

const Checkout: React.FC = () => {
    
    const [cart, setCart] = useState<CartItem[]>([]); // Menggunakan tipe CartItem[] yang lebih spesifik
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    // Pengganti useRouter: menggunakan fungsi navigasi standar
    const handleNavigate = (path: string) => {
        window.location.href = path;
    };

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
            // Menyimpan keranjang terbaru, hanya item dengan quantity > 0
            const itemsToStore = cart.filter(item => item.quantity > 0);
            sessionStorage.setItem('cartItems', JSON.stringify(itemsToStore));
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

    // --- Handler Checkout: Memanggil API Backend Asli ---
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
            amount: summary.total, // Mengirim total harga yang sudah dihitung
            payerEmail: email,
            // Menambahkan data URL agar Xendit tahu harus redirect ke mana
            successRedirectUrl: `${window.location.origin}/success`, 
            failureRedirectUrl: `${window.location.origin}/failure`,
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
            
            // Hapus keranjang dari session storage setelah checkout berhasil
            sessionStorage.removeItem('cartItems');

            // Arahkan pengguna ke URL pembayaran Xendit
            if (result.invoice_url) {
                window.location.href = result.invoice_url;
            } else {
                setMessage({ type: 'error', text: 'URL pembayaran tidak ditemukan.' });
            }

        } catch (error) {
            console.error('Checkout Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga saat checkout.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsProcessing(false);
        }
    };


    if (loading) {
        return <div style={{padding: '32px', textAlign: 'center', fontSize: '20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6'}}>
            Memuat keranjang...
        </div>;
    }

    if (cart.length === 0 && !message) {
        return (
            <div style={{maxWidth: '800px', margin: '80px auto', padding: '32px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}>
                <title>Keranjang Kosong</title> {/* Pengganti Head */}
                <h1 style={{fontSize: '32px', fontWeight: '800', color: '#dc2626'}}>Keranjang Kosong 🛒</h1>
                <p style={{marginTop: '12px', fontSize: '18px', color: '#6b7280'}}>
                    Silakan kembali ke halaman produk untuk memilih item.
                </p>
                <button 
                    onClick={() => handleNavigate('/')} // Menggunakan navigasi aman
                    style={{display: 'inline-block', marginTop: '24px', backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', border: 'none', cursor: 'pointer'}}
                >
                    Lihat Produk
                </button>
            </div>
        );
    }

    return (
        <div style={{maxWidth: '1000px', margin: '40px auto', padding: '20px', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif'}}>
            <title>Checkout Pesanan</title> {/* Pengganti Head */}

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
                            <div key={item._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6'}}>
                                
                                <div style={{display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1}}>
                                    <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px'}} 
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => 
                                        e.currentTarget.src = 'https://placehold.co/60x60/3730a3/fff?text=Item'
                                    }
                                    />
                                    <span style={{fontWeight: '600', color: '#1f2937'}}>{item.name}</span>
                                </div>

                                <div style={{display: 'flex', alignItems: 'center', gap: '8px', width: '150px', justifyContent: 'center'}}>
                                    <button 
                                        onClick={() => updateQuantity(item._id, -1)}
                                        style={{backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: '700', transition: 'background-color 0.1s'}}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                                    >-</button>
                                    <span style={{fontWeight: '700', fontSize: '16px'}}>{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item._id, 1)}
                                        style={{backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '4px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: '700', transition: 'background-color 0.1s'}}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
                                    >+</button>
                                </div>
                                
                                <div style={{width: '150px', textAlign: 'right'}}>
                                    <span style={{fontWeight: '600', color: '#4f46e5'}}>
                                        Rp{(item.price * item.quantity).toLocaleString('id-ID')}
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
                            <span style={{fontWeight: '500'}}>Rp{summary.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb'}}>
                            <span style={{color: '#6b7280'}}>Biaya Pengiriman:</span>
                            <span style={{fontWeight: '500'}}>Rp{SHIPPING_COST.toLocaleString('id-ID')}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', paddingTop: '10px', fontSize: '20px', fontWeight: '800'}}>
                            <span style={{color: '#3730a3'}}>Total Pembayaran:</span>
                            <span style={{color: '#ec4899'}}>Rp{summary.total.toLocaleString('id-ID')}</span>
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
                        onMouseOver={(e) => {
                            if (!isProcessing) e.currentTarget.style.backgroundColor = '#4338ca';
                        }}
                        onMouseOut={(e) => {
                            if (!isProcessing) e.currentTarget.style.backgroundColor = '#4f46e5';
                        }}
                    >
                        {isProcessing ? 'Memproses Pesanan...' : `Lanjut ke Pembayaran Rp${summary.total.toLocaleString('id-ID')}`}
                    </button>
                    <p style={{textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#6b7280'}}>
                        Anda akan diarahkan ke halaman pembayaran eksternal (Xendit).
                    </p>
                </form>
            </div>
            <div style={{textAlign: 'center', marginTop: '20px'}}>
                <button 
                    onClick={() => handleNavigate('/')} // Menggunakan navigasi aman
                    style={{color: '#4f46e5', textDecoration: 'none', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'}}
                >
                    &larr; Kembali Berbelanja
                </button>
            </div>
        </div>
    );
};

export default Checkout;