import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...');
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Tạo ADMIN với ID cố định 'admin-uuid-001'
  const admin = await prisma.user.upsert({
    where: { email: 'admin@liveorder.com' },
    update: { id: 'admin-uuid-001' },
    create: {
      id: 'admin-uuid-001',
      email: 'admin@liveorder.com',
      password: passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  // 2. Tạo SELLER với ID cố định 'seller-uuid-001'
  const seller = await prisma.user.upsert({
    where: { email: 'seller@liveorder.com' },
    update: { id: 'seller-uuid-001' },
    create: {
      id: 'seller-uuid-001',
      email: 'seller@liveorder.com',
      password: passwordHash,
      name: 'Chủ Shop (Streamer)',
      role: Role.SELLER,
    },
  });

  // 3. Tạo BUYER với ID cố định 'buyer-uuid-001'
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@liveorder.com' },
    update: { id: 'buyer-uuid-001' },
    create: {
      id: 'buyer-uuid-001',
      email: 'buyer@liveorder.com',
      password: passwordHash,
      name: 'Khách hàng',
      role: Role.BUYER,
    },
  });

  console.log('Seeding thành công! Các tài khoản cố định ID:');
  console.log('- Admin:', admin.email, `(ID: ${admin.id})`);
  console.log('- Seller:', seller.email, `(ID: ${seller.id})`);
  console.log('- Buyer:', buyer.email, `(ID: ${buyer.id})`);
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
