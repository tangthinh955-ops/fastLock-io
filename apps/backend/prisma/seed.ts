import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...');
  
  // Mật khẩu chung cho dễ test
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Tạo ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@liveorder.com' },
    update: {},
    create: {
      email: 'admin@liveorder.com',
      password: passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  // 2. Tạo SELLER
  const seller = await prisma.user.upsert({
    where: { email: 'seller@liveorder.com' },
    update: {},
    create: {
      email: 'seller@liveorder.com',
      password: passwordHash,
      name: 'Chủ Shop (Streamer)',
      role: Role.SELLER,
    },
  });

  // 3. Tạo BUYER
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@liveorder.com' },
    update: {},
    create: {
      email: 'buyer@liveorder.com',
      password: passwordHash,
      name: 'Khách hàng',
      role: Role.BUYER,
    },
  });

  console.log('Seeding thành công! Các tài khoản:');
  console.log('- Admin:', admin.email);
  console.log('- Seller:', seller.email);
  console.log('- Buyer:', buyer.email);
  console.log('=> Mật khẩu chung: 123456');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
