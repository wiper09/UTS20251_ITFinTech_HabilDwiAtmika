import React, { useEffect, useState } from 'react';
// import Link from 'next/link'; // Import Link dihapus untuk menghindari error resolusi

const SuccessPage: React.FC = () => {
    const [message, setMessage] = useState('Memverifikasi pembayaran Anda...');
    
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const externalId = urlParams.get('external_id');
        
        if (externalId) {
            setMessage(`Pembayaran berhasil! Kami sedang memproses pesanan Anda (ID: ${externalId}).`);
        } else {
            setMessage('Pembayaran berhasil! Terima kasih atas pesanan Anda. Status pesanan akan diperbarui segera.');
        }
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0fdf4', // Greenish background
            padding: '20px',
            textAlign: 'center'
        }}>
            <title>Pembayaran Sukses</title>
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
                    className="h-16 w-16 mx-auto text-green-500" 
                    viewBox="0 0 24 24" 
                    fill="#10b981" 
                    width="64px" 
                    height="64px"
                    style={{marginBottom: '20px'}}
                >
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#10b981', // Emerald green
                    marginBottom: '10px'
                }}>
                    Pembayaran Berhasil!
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: '#4b5563',
                    marginBottom: '30px'
                }}>
                    {message}
                </p>
                {/* Diganti menjadi <a> murni untuk menghindari error resolusi Next.js Link di lingkungan ini */}
                <a 
                    href="/" // Mengganti <Link href="/" passHref> menjadi <a href="/">
                    style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4338ca')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
                >
                    Kembali ke Beranda
                </a>
            </div>
        </div>
    );
};

export default SuccessPage;