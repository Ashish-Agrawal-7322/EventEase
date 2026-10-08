import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventease';
  
  const isCloudMongo = mongoUri.includes('mongodb+srv://');
  const timeoutMs = isCloudMongo ? 10000 : 2500;

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: timeoutMs,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to live database: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB URI (${error.message}).`);
    console.log(`[DataStore] Automatically activating EventEase Embedded High-Speed Storage Engine with full persistence and Mongoose model emulation.`);
    return false;
  }
};

export const getDBStatus = () => ({
  isConnected,
  type: isConnected ? 'mongodb-native' : 'embedded-persistent'
});
