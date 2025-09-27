import React, { useEffect, useState, useMemo, useCallback } from 'react';

// --- Interface dan Tipe Data ---

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

// --- KOMPONEN CHECKOUT UTAMA ---

const Checkout: React.FC = () => {
    
    const [cart, setCart] = useState<CartItem[]>([]);
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
        // Simulasi data keranjang jika session storage kosong (untuk testing)
        if (!storedCart || JSON.parse(storedCart).length === 0) {
            setCart([
                { _id: 'A1', name: 'Kopi Arabica Premium', price: 55000, description: '...', image: 'https://placehold.co/60x60/3730a3/fff?text=Kopi', category: 'Kopi', quantity: 2 },
                { _id: 'B2', name: 'Teh Hijau Organic', price: 30000, description: '...', image: 'https://placehold.co/60x60/10b981/fff?text=Teh', category: 'Teh', quantity: 1 }
            ]);
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
        
        // Mocking checkout data for display purposes
        const transactionId = `TRX-${Date.now()}`;
        
        const checkoutData = {
            items: cart.map(item => ({
                productId: item._id, 
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            amount: summary.total, 
            payerEmail: email,
            // Note: Menggunakan window.location.origin hanya untuk simulasi
            successRedirectUrl: `${window.location.origin}/payment_status.html?transaction_id=${transactionId}&status=success`, 
            failureRedirectUrl: `${window.location.origin}/payment_status.html?transaction_id=${transactionId}&status=fail`,
        };
        
        try {
            // --- SIMULASI PANGGILAN API KE BACKEND UNTUK MEMBUAT INVOICE ---
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            // Di sini seharusnya Anda memanggil '/api/checkout'
            // const response = await fetch('/api/checkout', { ... });
            // const result = await response.json();

            // Simulasi hasil sukses dari backend (redirect URL Xendit)
            const mockInvoiceUrl = `${window.location.origin}/payment_status.html?transaction_id=${transactionId}&status=pending`; 
            
            // Hapus keranjang dari session storage setelah checkout berhasil
            sessionStorage.removeItem('cartItems');

            // Arahkan pengguna ke URL pembayaran (simulasi)
            if (mockInvoiceUrl) {
                window.location.href = mockInvoiceUrl;
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
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
                <p className="text-xl font-medium text-indigo-700">Memuat keranjang...</p>
            </div>
        );
    }

    if (cart.length === 0 && !message) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 text-center bg-white rounded-xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-red-600 mb-3">Keranjang Kosong 🛒</h1>
                <p className="text-gray-600 mb-6">
                    Silakan kembali ke halaman produk untuk memilih item.
                </p>
                <button 
                    onClick={() => handleNavigate('/')}
                    className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition duration-200 shadow-md"
                >
                    Lihat Produk
                </button>
            </div>
        );
    }

    return (
        // Wrapper utama: Max width 1000px, centering, padding, background
        <div className="max-w-4xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50 font-sans">
            
            <header className="text-center mb-8 mt-4">
                <h1 className="text-4xl font-extrabold text-indigo-800">
                    Konfirmasi Checkout
                </h1>
                <p className="text-lg text-gray-600 mt-2">Tinjau pesanan Anda sebelum melanjutkan ke pembayaran.</p>
            </header>

            {/* Main Card Container */}
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl space-y-8">
                
                {/* Bagian 1: Daftar Item Keranjang */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-indigo-100 pb-3">
                        🛒 Detail Pesanan ({totalItems} Item)
                    </h2>
                    
                    <div className="space-y-4 divide-y divide-gray-100">
                        {cart.map((item) => (
                            <div key={item._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4">
                                
                                {/* Nama & Gambar (Flexible on Mobile) */}
                                <div className="flex items-center gap-4 flex-grow w-full sm:w-auto mb-3 sm:mb-0">
                                    <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        className="w-16 h-16 object-cover rounded-lg shadow-sm" 
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => 
                                        e.currentTarget.src = 'https://placehold.co/64x64/3730a3/fff?text=Item'
                                    }
                                    />
                                    <span className="font-semibold text-gray-700">{item.name}</span>
                                </div>

                                {/* Kontrol Kuantitas */}
                                <div className="flex items-center gap-2 w-full sm:w-1/4 justify-start sm:justify-center">
                                    {/* Tombol Kurang */}
                                    <button 
                                        onClick={() => updateQuantity(item._id, -1)}
                                        className="w-8 h-8 bg-red-500 text-white rounded-md font-bold transition-colors hover:bg-red-600 shadow-sm active:shadow-none"
                                    >&minus;</button>
                                    
                                    {/* Kuantitas */}
                                    <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                                    
                                    {/* Tombol Tambah */}
                                    <button 
                                        onClick={() => updateQuantity(item._id, 1)}
                                        className="w-8 h-8 bg-green-500 text-white rounded-md font-bold transition-colors hover:bg-green-600 shadow-sm active:shadow-none"
                                    >+</button>
                                </div>
                                
                                {/* Harga Subtotal Item */}
                                <div className="w-full sm:w-1/4 text-left sm:text-right mt-2 sm:mt-0">
                                    <span className="font-bold text-lg text-indigo-600">
                                        Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bagian 2: Ringkasan Tagihan */}
                <div className="p-5 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        📄 Ringkasan Tagihan
                    </h2>
                    
                    <div className="space-y-3 text-lg">
                        {/* Subtotal */}
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal Produk:</span>
                            <span className="font-medium text-gray-700">Rp{summary.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {/* Pengiriman */}
                        <div className="flex justify-between pb-3 border-b border-indigo-100">
                            <span className="text-gray-600">Biaya Pengiriman:</span>
                            <span className="font-medium text-gray-700">Rp{SHIPPING_COST.toLocaleString('id-ID')}</span>
                        </div>
                        {/* TOTAL */}
                        <div className="flex justify-between pt-3 text-xl font-extrabold">
                            <span className="text-indigo-800">Total Pembayaran:</span>
                            <span className="text-pink-600">Rp{summary.total.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {/* Bagian 3: Formulir & Tombol Checkout */}
                <form onSubmit={handleCheckout} className="p-6 border border-gray-200 rounded-xl bg-white shadow-inner">
                    
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        ✉️ Data Pembeli
                    </h2>
                    
                    <label htmlFor="email" className="block mb-2 font-semibold text-gray-700">Alamat Email (Wajib untuk Invoice)</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contoh@email.com"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base mb-5 transition duration-150"
                        disabled={isProcessing}
                    />

                    {/* Pesan Status */}
                    {message && (
                        <div className={`p-3 rounded-lg font-semibold mb-5 border 
                            ${message.type === 'error' 
                                ? 'bg-red-100 text-red-700 border-red-300' 
                                : 'bg-green-100 text-green-700 border-green-300'}`}>
                            {message.text}
                        </div>
                    )}
                    
                    {/* Tombol Proses Pembayaran */}
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className={`
                            w-full py-4 text-xl font-bold rounded-xl transition-all duration-300
                            text-white shadow-lg 
                            ${isProcessing 
                                ? 'bg-indigo-400 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl active:shadow-md active:translate-y-0.5'}
                        `}
                    >
                        {isProcessing 
                            ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses Pesanan...
                                </span>
                            ) 
                            : `Lanjut ke Pembayaran Rp${summary.total.toLocaleString('id-ID')}`
                        }
                    </button>
                    <p className="text-center mt-3 text-sm text-gray-500">
                        Anda akan diarahkan ke halaman pembayaran eksternal (Xendit).
                    </p>
                </form>
            </div>
            {/* Tombol Kembali */}
            <div className="text-center mt-6">
                <button 
                    onClick={() => handleNavigate('/')}
                    className="text-indigo-600 font-medium hover:text-indigo-800 transition duration-150 p-2"
                >
                    &larr; Kembali Berbelanja
                </button>
            </div>
        </div>
    );
};

// Wrapper Component untuk menambahkan Tailwind CSS dan Font Inter
const App: React.FC = () => {
    return (
        <>
            <script src="https://cdn.tailwindcss.com"></script>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
            <Checkout />
        </>
    );
}

export default App;