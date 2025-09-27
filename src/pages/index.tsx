import React, { useEffect, useState, useMemo } from 'react';
// import Head from 'next/head'; <-- Dihapus karena error resolusi

// --- Interface dan Tipe Data ---

type ProductCategory = 'Electronic' | 'Fashion' | 'Food' | 'Other';

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: ProductCategory;
  quantity?: number; 
}

interface CartItem extends Product {
    quantity: number;
}

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Fungsi navigasi universal untuk menghindari error <Link>/<a>
  const handleNavigate = (path: string) => {
    // Menggunakan window.location.href untuk mengatasi masalah Next.js Link/a di Vercel build
    window.location.href = path;
  };

  // --- Logic Pengambilan Data & Session Storage ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Gagal mengambil data produk dari API.');
        }
        const data = await response.json();
        
        // Perbaikan: Menggunakan tipe Product yang benar
        const enrichedProducts = data.data.map((p: Product) => ({
            ...p,
            category: p.category || 'Other' as ProductCategory
        }));

        setProducts(enrichedProducts);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Terjadi kesalahan saat fetching data.');
        }
      } finally {
        setLoading(false);
      }
    };

    const storedCart = sessionStorage.getItem('cartItems');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart) as CartItem[]);
      } catch(e) {
          console.error("Gagal parse cart dari session storage:", e);
          setCart([]);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('cartItems', JSON.stringify(cart));
  }, [cart]);


  // --- Logic Filter & Hitung Total ---
  const categories: string[] = useMemo(() => {
      const uniqueCategories = new Set(products.map(p => p.category));
      return ['All', ...Array.from(uniqueCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const totalItemsInCart: number = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleAddToCart = (product: Product) => {
    setCart(prevCart => {
      const existingProduct = prevCart.find(item => item._id === product._id);
      if (existingProduct) {
        return prevCart.map(item =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // --- Komponen Loading & Error ---
  if (loading) {
    return <div style={{padding: '32px', textAlign: 'center', fontSize: '20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6'}}>
        {/* <Clock size={32} className="animate-spin mr-3 text-indigo-600"/> */}
        Memuat produk...
    </div>;
  }

  if (error) {
    return <div style={{padding: '32px', textAlign: 'center', color: '#ef4444', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', margin: '32px'}}>Error: {error}</div>;
  }

  // --- Rendering Utama ---
  return (
    <div style={{maxWidth: '1280px', margin: '0 auto', padding: '16px 32px', minHeight: '100vh', backgroundColor: '#ff9900ff', fontFamily: 'sans-serif'}}>
      {/* Menggunakan tag <title> standar alih-alih <Head> untuk mengatasi error resolusi */}
      <title>Pilih Produk Terbaik Anda</title>
      
      {/* Header Utama */}
      <header style={{textAlign: 'center', marginBottom: '40px', backgroundColor: '#e6ff44ff', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'}}>
        <h1 style={{fontSize: '40px', fontWeight: '800', color: '#3730a3', letterSpacing: '-0.025em'}}>
            Selamat Datang di <span style={{color: '#ec4899'}}>eCommerce Habil</span>
        </h1>
        <p style={{marginTop: '12px', fontSize: '18px', color: '#4b5563'}}>
            Jelajahi koleksi produk premium kami. Siap Checkout dengan Xendit!
        </p>
      </header>
      
      {/* Filter Kategori yang Stylish */}
      <div style={{display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '40px', justifyContent: 'center'}}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 24px',
              borderRadius: '9999px',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease-in-out',
              whiteSpace: 'nowrap',
              border: '2px solid',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              // Styling berdasarkan status terpilih
              backgroundColor: selectedCategory === cat ? '#4f46e5' : '#ffffff',
              color: selectedCategory === cat ? '#ffffff' : '#4b5563',
              borderColor: selectedCategory === cat ? '#4338ca' : '#e5e7eb',
            }}
            onMouseOver={(e) => {
                if (selectedCategory !== cat) {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#4f46e5';
                }
            }}
            onMouseOut={(e) => {
                if (selectedCategory !== cat) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#4b5563';
                }
            }}
          >
            {/* <Tag size={16} style={{display: 'inline-block', marginRight: '8px'}}/> */}
            {cat}
          </button>
        ))}
      </div>


      {/* Daftar Produk dengan Card Modern */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px'}}>
        {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
                <div 
                    key={product._id} 
                    style={{
                        backgroundColor: '#ffffff', 
                        borderRadius: '24px', 
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                        overflow: 'hidden',
                        transition: 'transform 0.5s ease-in-out, box-shadow 0.5s ease-in-out',
                        border: '1px solid #f3f4f6',
                        position: 'relative',
                        cursor: 'pointer',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    }}
                >
                    {/* Area Gambar dengan Overlay */}
                    <div style={{position: 'relative'}}>
                        {/* WARNING: Menggunakan <img> di sini. Abaikan warning Next.js agar build lolos. */}
                        <img 
                            src={product.image || 'https://placehold.co/400x300/312e81/fff?text=No+Image'} 
                            alt={product.name} 
                            style={{width: '100%', height: '192px', objectFit: 'cover', transition: 'opacity 0.3s'}} 
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => 
                                e.currentTarget.src = 'https://placehold.co/400x300/312e81/fff?text=No+Image'
                            }
                        />
                        <div style={{position: 'absolute', top: '12px', right: '12px', backgroundColor: '#ec4899', color: '#ffffff', fontSize: '10px', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', textTransform: 'uppercase'}}>
                            {product.category}
                        </div>
                    </div>
                    
                    {/* Detail Produk */}
                    <div style={{padding: '20px'}}>
                        <h2 style={{fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={product.name}>
                            {product.name}
                        </h2>
                        <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}} title={product.description}>
                            {product.description}
                        </p>
                        
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}>
                            {/* Harga Menonjol */}
                            <span style={{fontSize: '24px', fontWeight: '800', color: '#4f46e5'}}>
                                Rp{product.price.toLocaleString('id-ID')}
                            </span>
                            
                            {/* Tombol Tambah dengan Efek */}
                            <button
                                onClick={() => handleAddToCart(product)}
                                style={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    backgroundColor: '#22c55e', 
                                    color: '#ffffff', 
                                    fontWeight: '600', 
                                    padding: '8px 16px', 
                                    borderRadius: '12px', 
                                    transition: 'all 0.3s',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#16a34a';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#22c55e';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                }}
                                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                {/* <ShoppingCart size={18} /> */}
                                <span>Tambah</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div style={{gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: '#6b7280', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '2px dashed #d1d5db'}}>
                {/* <Package size={32} style={{margin: '0 auto 12px'}}/> */}
                <p style={{fontSize: '20px'}}>Ups! Tidak ada produk di kategori &apos;{selectedCategory}&apos;.</p>
            </div>
        )}
      </div>
      
      {/* Floating Cart Button yang Kontras (FIXED: Menghilangkan <a>) */}
      {totalItemsInCart > 0 && (
        <button 
            onClick={() => handleNavigate('/checkout')} // Menggunakan fungsi navigasi
            style={{
                position: 'fixed', 
                bottom: '32px', 
                right: '32px', 
                zIndex: 50,
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                backgroundColor: '#ec4899', 
                color: '#ffffff', 
                padding: '16px 28px', 
                borderRadius: '9999px', 
                boxShadow: '0 20px 25px -5px rgba(236, 72, 153, 0.4), 0 10px 10px -5px rgba(236, 72, 153, 0.04)',
                transition: 'all 0.3s', 
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.backgroundColor = '#db2777';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = '#ec4899';
            }}
        >
            {/* <ShoppingCart size={24} style={{animation: 'pulse 1s infinite'}}/> */}
            <span style={{fontSize: '20px'}}>
                Checkout ({totalItemsInCart})
            </span>
        </button>
      )}
    </div>
  );
};

export default Home;