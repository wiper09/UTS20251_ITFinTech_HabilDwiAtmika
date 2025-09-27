import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

// --- Komponen Payment Status ---

const PaymentStatus: React.FC = () => {
    const router = useRouter();
    // Mengambil ID Transaksi dari URL: /payment?transaction_id=...
    const { transaction_id } = router.query;

    const [isLoading, setIsLoading] = useState(true);
    const [finalStatus, setFinalStatus] = useState<string | undefined>(undefined);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Data konfigurasi tampilan
    const statusConfig = {
        SUCCESS: { // Status dari Backend/Xendit
            title: 'Pembayaran LUNAS! 🎉',
            message: 'Transaksi Anda telah dikonfirmasi dan statusnya adalah LUNAS. Kami akan segera memproses pesanan Anda.',
            color: '#10b981', // green-500
            bgColor: '#d1fae5', // green-100
            icon: '✅'
        },
        PENDING: { // Status dari Backend/Xendit
            title: 'Pembayaran Tertunda ⏳',
            message: 'Menunggu konfirmasi pembayaran Anda dari Xendit. Status saat ini masih TERTUNDA.',
            color: '#f59e0b', // amber-500
            bgColor: '#fef3c7', // amber-100
            icon: '🔔'
        },
        EXPIRED: { // Status dari Backend/Xendit
            title: 'Pembayaran Gagal/Kadaluarsa ❌',
            message: 'Invoice telah kadaluarsa atau terjadi kesalahan. Silakan buat pesanan baru.',
            color: '#ef4444', // red-500
            bgColor: '#fee2e2', // red-100
            icon: '🛑'
        },
        LOADING: { // Status saat fetching
            title: 'Memeriksa Status Transaksi...',
            message: 'Kami sedang memverifikasi status pembayaran terbaru Anda dari sistem.',
            color: '#4f46e5', // indigo
            bgColor: '#e0e7ff', // indigo-100
            icon: '🔄'
        },
        ERROR: {
            title: 'Kesalahan Sistem',
            message: 'Terjadi masalah saat mengambil data status transaksi.',
            color: '#71717a', // zinc-500
            bgColor: '#e4e4e7', // zinc-200
            icon: '⚠️'
        }
    };

    const config = statusConfig[finalStatus as keyof typeof statusConfig] || statusConfig.LOADING;

    useEffect(() => {
        if (!router.isReady) return;

        if (!transaction_id) {
            setFinalStatus('ERROR');
            setErrorMessage('ID Transaksi tidak ditemukan di URL.');
            setIsLoading(false);
            return;
        }

        const fetchStatus = async () => {
            // Kita mensimulasikan fetch ke API Anda: /api/payment-status?transaction_id=...
            // API inilah yang bertanggung jawab mengembalikan status aktual dari DB Anda.
            // Di dunia nyata, API ini akan mencari status berdasarkan transaction_id
            // yang telah diperbarui oleh Webhook Xendit.
            
            try {
                // --- SIMULASI FETCH KE BACKEND ---
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulasi delay API 2 detik
                
                // Logika simulasi: asumsikan jika ID berakhir '1' maka sukses, '2' pending, lainnya expired.
                const sampleStatus = transaction_id.toString().endsWith('1') ? 'SUCCESS' 
                                   : transaction_id.toString().endsWith('2') ? 'PENDING'
                                   : 'EXPIRED';
                
                setFinalStatus(sampleStatus);
                // --- AKHIR SIMULASI ---


                /* // --- CODE NYATA (Contoh) ---
                const response = await fetch(`/api/payment-status?transaction_id=${transaction_id}`);
                if (!response.ok) throw new Error('Gagal mengambil status.');
                
                const data = await response.json();
                setFinalStatus(data.status); // data.status harus berupa 'SUCCESS', 'PENDING', atau 'EXPIRED'
                // --- END CODE NYATA --- 
                */


            } catch (err) {
                console.error("Gagal fetch status transaksi:", err);
                setFinalStatus('ERROR');
                setErrorMessage('Tidak dapat memverifikasi status transaksi Anda.');
            } finally {
                setIsLoading(false);
            }
        };

        setFinalStatus('LOADING');
        setIsLoading(true);
        fetchStatus();

    }, [router.isReady, transaction_id]);

    // Menampilkan pesan error jika finalStatus adalah ERROR
    if (finalStatus === 'ERROR' && errorMessage) {
        return (
            <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', padding: '20px'}}>
                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    backgroundColor: statusConfig.ERROR.bgColor,
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    padding: '40px',
                    textAlign: 'center',
                    border: `4px solid ${statusConfig.ERROR.color}`,
                }}>
                    <h1 style={{fontSize: '32px', fontWeight: '800', color: statusConfig.ERROR.color, marginBottom: '12px'}}>
                        {statusConfig.ERROR.title}
                    </h1>
                    <p style={{fontSize: '18px', color: '#4b5563', marginBottom: '24px'}}>
                        {errorMessage}
                    </p>
                    <Link href="/" style={{color: statusConfig.ERROR.color, textDecoration: 'none', fontWeight: '500'}}>
                        &larr; Kembali ke Halaman Utama
                    </Link>
                </div>
            </div>
        );
    }


    if (isLoading || finalStatus === 'LOADING') {
        return (
            <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif'}}>
                <div style={{fontSize: '20px', color: config.color, padding: '32px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'}}>
                    <span style={{display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '10px'}}>🔄</span>
                    {config.title}
                    {/* Definisikan animasi spin untuk inline styling */}
                    <style>{`
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }
    
    // Tampilan Utama (SUCCESS, PENDING, EXPIRED)
    return (
        <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', padding: '20px'}}>
            <Head>
                <title>{config.title}</title>
            </Head>

            <div style={{
                maxWidth: '600px',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                padding: '40px',
                textAlign: 'center',
                border: `4px solid ${config.color}`,
                transition: 'all 0.5s ease-in-out'
            }}>
                
                {/* Visual Status */}
                <div style={{
                    display: 'inline-block',
                    padding: '20px',
                    borderRadius: '50%',
                    backgroundColor: config.bgColor,
                    marginBottom: '24px',
                }}>
                    <span style={{fontSize: '48px'}} role="img" aria-label="Status Icon">
                        {config.icon}
                    </span>
                </div>

                {/* Judul & Pesan */}
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: config.color,
                    marginBottom: '12px'
                }}>
                    {config.title}
                </h1>
                
                <p style={{
                    fontSize: '18px',
                    color: '#4b5563',
                    marginBottom: '24px'
                }}>
                    {config.message}
                </p>

                {/* Detail Transaksi */}
                {transaction_id && (
                    <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '32px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <p style={{
                            fontSize: '16px',
                            color: '#4b5563',
                            fontWeight: '600',
                        }}>
                            ID Transaksi: 
                            <span style={{color: '#1f2937', display: 'block', wordBreak: 'break-all'}}>
                                {transaction_id}
                            </span>
                        </p>
                    </div>
                )}
                
                {/* Tombol Aksi */}
                <Link href="/">
                    <button style={{
                        padding: '12px 24px',
                        backgroundColor: '#4f46e5', // indigo-600
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '18px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#4338ca'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#4f46e5'; }}
                    >
                        Kembali ke Halaman Utama
                    </button>
                </Link>

            </div>
        </div>
    );
};

export default PaymentStatus;