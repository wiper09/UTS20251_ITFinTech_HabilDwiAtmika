import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  checkoutId: mongoose.Types.ObjectId;
  invoiceId: string;
  externalId: string; // <-- Menambahkan externalId yang disimpan di API
  amount: number;
  status: string;
  paymentMethod?: string;
  paidAt?: Date;
}

const PaymentSchema: Schema = new Schema({
  checkoutId: { type: Schema.Types.ObjectId, ref: 'Checkout', required: true },
  invoiceId: { type: String, required: true },
  externalId: { type: String, required: true, unique: true }, // <-- Menambahkan externalId
  amount: { type: Number, required: true },
  status: { type: String, required: true, enum: ['pending', 'paid', 'expired', 'failed'] }, // Memperbarui enum
  paymentMethod: { type: String },
  paidAt: { type: Date },
});

export default (mongoose.models.Payment as mongoose.Model<IPayment>) ||
  mongoose.model<IPayment>('Payment', PaymentSchema);