import mongoose from 'mongoose';
import { CreditPackage } from '@/models';

const packages = [
  { name: 'Starter', credits: 10, price: 9.99, description: 'Perfect for trying out AI headshots', bonus: 0, popular: false },
  { name: 'Popular', credits: 25, price: 19.99, description: 'Most popular choice', bonus: 5, popular: true },
  { name: 'Professional', credits: 50, price: 34.99, description: 'Best value for professionals', bonus: 15, popular: false },
  { name: 'Business', credits: 100, price: 59.99, description: 'Ideal for teams', bonus: 30, popular: false },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/headshotpro');
    
    await CreditPackage.deleteMany({});
    const result = await CreditPackage.insertMany(packages.map(p => ({ ...p, isActive: true })));
    
    console.log(`✅ Seeded ${result.length} credit packages`);
    result.forEach(p => console.log(`  ${p.name}: ${p.credits}${p.bonus ? `+${p.bonus}` : ''} credits - $${p.price}`));
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

seed();
