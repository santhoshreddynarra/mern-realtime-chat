import mongoose from 'mongoose';
import dns from 'dns';

// Node.js v24 has a regression where its built-in DNS resolver returns
// ECONNREFUSED for SRV record lookups. MongoDB Atlas SRV URIs (mongodb+srv://)
// rely on SRV DNS. Override with reliable public DNS servers as a workaround.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Fail fast: 10s instead of default 30s
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
