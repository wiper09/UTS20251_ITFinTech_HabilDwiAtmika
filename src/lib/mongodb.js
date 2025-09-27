import { MongoClient } from 'mongodb';

// Pastikan MONGODB_URI didefinisikan di .env.local dan di Vercel Environment Variables.
const uri = process.env.MONGODB_URI;
const options = {};

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local or Vercel settings');
}

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // Dalam mode pengembangan (Development), gunakan variabel global untuk mempertahankan nilai
  // klien di antara hot reloads. Jika tidak, itu akan membuat koneksi baru di setiap reload.
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, options);
    global._mongoClientPromise = global._mongoClient.connect();
  }
  client = global._mongoClient;
  clientPromise = global._mongoClientPromise;
} else {
  // Dalam mode produksi (Production), gunakan variabel biasa untuk koneksi.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// clientPromise adalah MongoClient yang terhubung.
// Export ini agar dapat digunakan di API Routes Anda.
export default clientPromise;
