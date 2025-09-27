import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  image: string;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String, required: true },
});

export default (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>('Product', ProductSchema);