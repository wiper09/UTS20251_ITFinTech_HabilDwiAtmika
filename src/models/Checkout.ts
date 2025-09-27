import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface untuk item produk di keranjang belanja
export interface ICheckoutItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

// Interface utama untuk dokumen Checkout
export interface ICheckout extends Document {
  items: ICheckoutItem[];
  itemsSubtotal: number; // <-- FIELD BARU DITAMBAHKAN
  totalAmount: number;
  status: 'pending' | 'paid' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// Skema Mongoose untuk Checkout
const CheckoutSchema: Schema = new Schema({
  items: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  itemsSubtotal: { // <-- FIELD BARU DITAMBAHKAN
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'expired'], // Tambahkan 'expired'
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Periksa apakah model sudah ada sebelum mengompilasinya
const Checkout = mongoose.models.Checkout || mongoose.model<ICheckout>('Checkout', CheckoutSchema);

export default Checkout;
