import dns from 'dns';
import mongoose from 'mongoose';
import env from './env.js';

let mongoMemoryServer = null;

const seedDefaultAdmin = async () => {
  try {
    const { default: User } = await import('../models/User.js');
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      await User.create({
        name: 'Sanghini Operations Admin',
        email: 'admin@sanghini.com',
        phone: '9999999999',
        passwordHash: 'Admin@12345',
        role: 'admin',
        gender: 'female',
        isVerified: true,
        isActive: true,
      });
      console.log('🛡️  Default Admin initialized: admin@sanghini.com / Admin@12345');
    }
  } catch (seedErr) {
    console.warn('⚠️ Admin seed notice:', seedErr.message);
  }
};

const connectDatabase = async () => {
  let uri = env.MONGODB_URI;

  if (uri) {
    // If using MongoDB Atlas SRV URI, ensure reliable DNS resolution
    if (uri.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        console.warn('⚠️ DNS server set warning:', dnsErr.message);
      }
    }

    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      await seedDefaultAdmin();
      return conn;
    } catch (error) {
      console.warn(`⚠️  Primary MongoDB connection failed (${error.message}). Attempting in-memory database fallback...`);
    }
  }

  // Development Fallback: In-Memory MongoDB Server
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();

    const conn = await mongoose.connect(memoryUri);
    console.log(`✅ In-Memory MongoDB Server started & connected: ${memoryUri}`);

    await seedDefaultAdmin();

    // Handle process shutdown
    process.on('SIGINT', async () => {
      await mongoose.disconnect();
      if (mongoMemoryServer) await mongoMemoryServer.stop();
      process.exit(0);
    });

    return conn;
  } catch (memErr) {
    console.error('❌ Failed to launch In-Memory MongoDB Server:', memErr.message);
    console.error('   Set a valid MONGODB_URI in backend/.env to connect to MongoDB Atlas or local MongoDB.');
    return null;
  }
};

export default connectDatabase;
