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
    icon: string;
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
 */
const useMockRouter = (): MockRouter => {
    const [query, setQuery] = useState<RouterQuery>({});
    
    useEffect(() => {
        // Mengambil parameter dari URL
        const urlParams = new URLSearchParams(window.location.search);
        // Default ID untuk pengujian: '123-test-pending-2'
        // Ubah query URL untuk menguji status lain (misalnya ?transaction_id=1)
        const transaction_id = urlParams.get('transaction_id') || '123-test-pending-2'; 
        
        setQuery({ transaction_id });
    }, []);

    return {
        query,
        isReady: query.transaction_id !== undefined,
        // Mock push untuk mencegah error
        push: (path: string) => console.log("Navigating to:", path)
    };
};

// --- KOMPONEN UTAMA ---

const PaymentStatus: React.FC = () => {
    const router = useMockRouter();
    // Pastikan transaction_id adalah string atau undefined
    const transaction_id = router.query.transaction_id; 

    const [isLoading, setIsLoading] = useState<boolean>(true);
    // State untuk status akhir, menggunakan union type
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
            buttonText: 'Loading...'
        },
        ERROR: {
            title: 'Kesalahan Sistem ⚠️',
            message: 'Terjadi masalah saat mengambil data status transaksi.',
            colorClass: 'text-gray-500',
            bgColorClass: 'bg-gray-200',
            borderColorClass: 'border-gray-500',
            icon: '⚠️',
            buttonText: 'Kembali ke Halaman Utama'
        }
    }), []);

    const currentStatusKey: PaymentStatusKey = finalStatus || (isLoading ? 'LOADING' : 'ERROR');
    const config: StatusConfigItem = statusConfig[currentStatusKey];

    // --- Efek untuk mengambil status ---
    useEffect(() => {
        if (!router.isReady) return;

        if (!transaction_id) {
            setFinalStatus('ERROR');
            setErrorMessage('ID Transaksi tidak ditemukan di URL.');
            setIsLoading(false);
            return;
        }

        const fetchStatus = async () => {
            // Tampilkan LOADING sebelum fetch
            setFinalStatus('LOADING');
            setIsLoading(true);

            try {
                // --- SIMULASI FETCH KE BACKEND ---
                await new Promise(resolve => setTimeout(resolve, 2500)); // Delay simulasi 2.5 detik
                
                let sampleStatus: PaymentStatusKey;
                const idString = transaction_id.toString().toLowerCase();

                // Logika simulasi:
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

    }, [router.isReady, transaction_id]); // Dependensi

    // --- Tampilan Loading ---
    if (isLoading || finalStatus === 'LOADING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
                <div className={`text-xl p-8 bg-white rounded-2xl shadow-xl ${config.colorClass} text-center`}>
                    <span 
                        className="inline-block mr-3 text-2xl"
                        // Menggunakan gaya inline untuk animasi spin yang didefinisikan di CSS global (atau di body style tag)
                        style={{ animation: 'spin 1s linear infinite' }} 
                    >
                        {config.icon}
                    </span>
                    {config.title}
                </div>
            </div>
        );
    }
    
    // --- Tampilan Status Akhir (SUCCESS, PENDING, EXPIRED, ERROR) ---
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
                <a href={finalStatus === 'PENDING' ? '/invoice' : '/'}>
                    <button className={`
                        w-full md:w-auto px-8 py-3 
                        bg-indigo-600 text-white font-bold text-xl 
                        rounded-xl border-b-4 border-indigo-700
                        hover:bg-indigo-700 active:border-b-0 active:translate-y-px 
                        shadow-lg hover:shadow-xl transition-all duration-200
                        focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50
                    `}>
                        {config.buttonText}
                    </button>
                </a>
            </div>
        </div>
    );
};

// Karena kita berada di lingkungan single file, kita perlu wrap dengan App component 
// dan menambahkan setup Tailwind/Font.
const App: React.FC = () => {
    return (
        <>
            {/* Load Tailwind CSS */}
            <script src="https://cdn.tailwindcss.com"></script>
            {/* Global Styles for Font and Animation */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <PaymentStatus />
        </>
    );
}

export default App;