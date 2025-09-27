import React, { useEffect, useState } from 'react';
// import Link from 'next/link'; // Import Link dihapus untuk menghindari error resolusi

const FailurePage: React.FC = () => {
    const [message, setMessage] = useState('Transaksi Anda tidak dapat diproses saat ini.');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const reason = urlParams.get('reason');

        if (reason) {
            setMessage(`Transaksi gagal. Alasan: ${reason}.`);
        } else {
            setMessage('Pembayaran Anda gagal atau dibatalkan. Mohon coba lakukan checkout lagi.');
        }
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff7f7', // Reddish background
            padding: '20px',
            textAlign: 'center'
        }}>
            <title>Pembayaran Gagal</title>
            <div style={{
                backgroundColor: '#ffffff',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                maxWidth: '500px',
                width: '100%'
            }}>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-16 w-16 mx-auto text-red-500" 
                    viewBox="0 0 24 24" 
                    fill="#ef4444" 
                    width="64px" 
                    height="64px"
                    style={{marginBottom: '20px'}}
                >
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#ef4444', // Red color
                    marginBottom: '10px'
                }}>
                    Transaksi Gagal
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: '#4b5563',
                    marginBottom: '30px'
                }}>
                    {message}
                </p>
                
                {/* Diganti dengan <a> murni untuk menghindari error resolusi Next.js Link */}
                <a 
                    href="/checkout"
                    style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        backgroundColor: '#f97316',
                        color: '#ffffff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        transition: 'background-color 0.3s',
                        marginRight: '10px'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ea580c')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f97316')}
                >
                    Coba Lagi di Checkout
                </a>

                {/* Diganti dengan <a> murni untuk menghindari error resolusi Next.js Link */}
                <a 
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        backgroundColor: '#9ca3af',
                        color: '#ffffff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#9ca3af')}
                >
                    Kembali ke Beranda
                </a>
            </div>
        </div>
    );
};

export default FailurePage;