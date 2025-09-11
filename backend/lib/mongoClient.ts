import mongoose from 'mongoose';

export const connectToDB = async () => {
  try {
    const uri = process.env.MONGO_URI!;
    await mongoose.connect(uri, {
      dbName: 'Finpay',
    });
    console.log('✅ Connected to MongoDB with Mongoose');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};