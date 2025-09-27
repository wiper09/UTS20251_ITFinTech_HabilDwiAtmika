import React, { useEffect, useState, useMemo } from 'react';

// --- TYPESCRIPT DEFINITIONS ---

type PaymentStatusKey = 'SUCCESS' | 'PENDING' | 'EXPIRED' | 'LOADING' | 'ERROR';

// Interface untuk item konfigurasi tampilan
interface StatusConfigItem {
    title: string;
    message: string;
    colorClass: string; // Kelas warna Tailwind (e.g., text-green-600)
    bgColorClass: string; // Kelas latar belakang Tailwind (e.g., bg-green-100)
    borderColorClass: string; // Kelas border Tailwind (e.g., border-green-600)
    icon: string; // Emoji
    buttonText: string;
}

// Map konfigurasi status
type StatusConfig = Record<PaymentStatusKey, StatusConfigItem>;

// Interface untuk query router (untuk mock)
interface RouterQuery {
    transaction_id?: string;
}

// Interface untuk hasil dari mock router
interface MockRouter {
    query: RouterQuery;
    isReady: boolean;
    push: (url: string) => void;
}

// --- MOCK ROUTER IMPLEMENTATION ---

/**
 * Hook kustom untuk mensimulasikan useRouter dari Next.js 
 * agar komponen dapat mengambil query URL di lingkungan tunggal.
 * * Anda bisa menguji status yang berbeda dengan menambahkan ?transaction_id=...
 * Contoh: 
 * - ?transaction_id=success-1 -> SUCCESS
 * - ?transaction_id=pending-2 -> PENDING (Default)
 * - ?transaction_id=expired-9 -> EXPIRED
 * - ?transaction_id=error -> ID not found
 */
const useMockRouter = (): MockRouter => {
    const [query, setQuery] = useState<RouterQuery>({});
    
    useEffect(() => {
        // Mengambil parameter dari URL
        const urlParams = new URLSearchParams(window.location.search);
        // Default ID untuk pengujian: '123-test-pending-2'
        const transaction_id = urlParams.get('transaction_id') || '123-test-pending-2'; 
        
        setQuery({ transaction_id });
    }, []);

    return {
        query,
        isReady: query.transaction_id !== undefined,
        // Mock push untuk mencegah error, mengarahkan pengguna
        push: (path: string) => window.location.href = path
    };
};

// --- KOMPONEN UTAMA LOGIC (PaymentStatus) ---

const PaymentStatus: React.FC = () => {
    const router = useMockRouter();
    
    // Pastikan transaction_id adalah string atau undefined
    const transaction_id = router.query.transaction_id; 

    const [isLoading, setIsLoading] = useState<boolean>(true);
    // State untuk status akhir, menggunakan union type PaymentStatusKey
    const [finalStatus, setFinalStatus] = useState<PaymentStatusKey | undefined>(undefined);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Konfigurasi Status menggunakan useMemo
    const statusConfig: StatusConfig = useMemo(() => ({
        SUCCESS: { 
            title: 'Pembayaran LUNAS! 🎉',
            message: 'Transaksi Anda telah dikonfirmasi dan statusnya adalah LUNAS. Kami akan segera memproses pesanan Anda.',
            colorClass: 'text-green-600',
            bgColorClass: 'bg-green-100',
            borderColorClass: 'border-green-600',
            icon: '✅',
            buttonText: 'Kembali ke Halaman Utama'
        },
        PENDING: {
            title: 'Pembayaran Tertunda ⏳',
            message: 'Menunggu konfirmasi pembayaran Anda. Status saat ini masih TERTUNDA. Harap selesaikan pembayaran.',
            colorClass: 'text-amber-600',
            bgColorClass: 'bg-amber-100',
            borderColorClass: 'border-amber-600',
            icon: '🔔',
            buttonText: 'Lihat Invoice Pembayaran'
        },
        EXPIRED: {
            title: 'Pembayaran Gagal/Kadaluarsa ❌',
            message: 'Invoice telah kadaluarsa atau terjadi kesalahan. Silakan buat pesanan baru untuk melanjutkan.',
            colorClass: 'text-red-600',
            bgColorClass: 'bg-red-100',
            borderColorClass: 'border-red-600',
            icon: '🛑',
            buttonText: 'Buat Pesanan Baru'
        },
        LOADING: {
            title: 'Memeriksa Status Transaksi...',
            message: 'Kami sedang memverifikasi status pembayaran terbaru Anda dari sistem.',
            colorClass: 'text-indigo-600',
            bgColorClass: 'bg-indigo-100',
            borderColorClass: 'border-indigo-600',
            icon: '🔄',
            buttonText: 'Mohon Tunggu...'
        },
        ERROR: {
            title: 'Kesalahan Sistem ⚠️',
            message: 'Terjadi masalah saat mengambil data status transaksi.',
            colorClass: 'text-gray-500',
            bgColorClass: 'bg-gray-200',
            borderColorClass: 'border-gray-500',
            icon: '⚠️',
            buttonText: 'Coba Lagi'
        }
    }), []);

    // Tentukan kunci status saat ini, default ke LOADING atau ERROR
    const currentStatusKey: PaymentStatusKey = finalStatus || (isLoading ? 'LOADING' : 'ERROR');
    const config: StatusConfigItem = statusConfig[currentStatusKey];

    // --- Efek untuk mengambil status ---
    useEffect(() => {
        // Hanya jalankan fetch jika router sudah siap
        if (!router.isReady) return;

        if (!transaction_id) {
            setFinalStatus('ERROR');
            setErrorMessage('ID Transaksi tidak ditemukan di URL.');
            setIsLoading(false);
            return;
        }

        const fetchStatus = async () => {
            setIsLoading(true);
            setFinalStatus('LOADING');

            try {
                // --- SIMULASI FETCH KE BACKEND (2.5 detik) ---
                await new Promise(resolve => setTimeout(resolve, 2500)); 
                
                let sampleStatus: PaymentStatusKey;
                const idString = transaction_id.toString().toLowerCase();

                // Logika simulasi berdasarkan ID:
                if (idString.includes('success') || idString.endsWith('1')) {
                    sampleStatus = 'SUCCESS';
                } else if (idString.includes('pending') || idString.endsWith('2')) {
                    sampleStatus = 'PENDING';
                } else {
                    sampleStatus = 'EXPIRED';
                }
                
                setFinalStatus(sampleStatus);
                // --- AKHIR SIMULASI ---

            } catch (err) {
                console.error("Gagal fetch status transaksi:", err);
                setFinalStatus('ERROR');
                setErrorMessage('Tidak dapat memverifikasi status transaksi Anda. Silakan hubungi dukungan.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatus();

    }, [router.isReady, transaction_id]); // Dipicu ulang ketika router siap atau ID berubah

    // --- Tampilan Loading / Status Akhir ---
    
    // Tampilan saat status sedang dimuat/diverifikasi
    if (isLoading || finalStatus === 'LOADING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
                <div className={`max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 text-center ${config.colorClass} border-4 border-indigo-300`}>
                    <div className="flex justify-center items-center mb-4">
                        <span 
                            className="inline-block mr-3 text-4xl"
                            // Menggunakan gaya inline untuk animasi spin
                            style={{ animation: 'spin 1.2s linear infinite' }} 
                        >
                            {config.icon}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
                    <p className="text-gray-500">{config.message}</p>
                    <div className="mt-6 text-sm text-gray-400">ID: {transaction_id || 'N/A'}</div>
                </div>
            </div>
        );
    }
    
    // Tampilan Status Akhir (SUCCESS, PENDING, EXPIRED, ERROR)
    const buttonAction = () => {
        if (finalStatus === 'PENDING') {
            router.push('/invoice'); // Misal: Arahkan ke halaman invoice
        } else {
            router.push('/'); // Kembali ke halaman utama atau buat pesanan baru
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
            {/* Main Card Container */}
            <div className={`
                max-w-xl w-full bg-white rounded-3xl 
                shadow-2xl p-8 md:p-10 text-center 
                transition-all duration-500
                ${config.borderColorClass} border-4
                transform hover:scale-[1.01]
            `}>
                
                {/* Visual Status Icon */}
                <div className={`
                    inline-block p-5 rounded-full mb-6
                    ${config.bgColorClass}
                `}>
                    <span className="text-5xl md:text-6xl" role="img" aria-label="Status Icon">
                        {config.icon}
                    </span>
                </div>

                {/* Judul & Pesan */}
                <h1 className={`
                    text-3xl md:text-4xl font-extrabold mb-3
                    ${config.colorClass}
                `}>
                    {config.title}
                </h1>
                
                <p className="text-lg text-gray-600 mb-6">
                    {finalStatus === 'ERROR' && errorMessage ? errorMessage : config.message}
                </p>

                {/* Detail Transaksi */}
                {transaction_id && (
                    <div className="bg-gray-50 p-4 rounded-xl mb-8 border border-gray-200">
                        <p className="text-base text-gray-600 font-semibold">
                            ID Transaksi: 
                            <span className="text-gray-800 block text-lg font-normal break-all mt-1">
                                {transaction_id}
                            </span>
                        </p>
                    </div>
                )}
                
                {/* Tombol Aksi */}
                <button 
                    onClick={buttonAction}
                    className={`
                        w-full md:w-auto px-8 py-3 
                        bg-indigo-600 text-white font-bold text-xl 
                        rounded-xl border-b-4 border-indigo-700
                        hover:bg-indigo-700 active:border-b-0 active:translate-y-px 
                        shadow-lg hover:shadow-xl transition-all duration-200
                        focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50
                    `}
                >
                    {config.buttonText}
                </button>
            </div>
        </div>
    );
};

// --- KOMPONEN UTAMA APLIKASI ---

const App: React.FC = () => {
    return (
        <>
            {/* Global Styles untuk Font dan Animasi Spin */}
            <style>{`
                /* Memuat Font Inter dari Google Fonts */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f3f4f6;
                    /* Ensure full height for min-h-screen to work */
                    height: 100vh; 
                    width: 100vw;
                    overflow: auto;
                }
                /* Keyframes untuk animasi loading */
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            
            <PaymentStatus />
        </>
    );
};

export default App;
