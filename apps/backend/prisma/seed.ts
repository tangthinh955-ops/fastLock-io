import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const SEED_ADMIN_ID = 'a0000000-0000-4000-8000-000000000001';
export const SEED_SELLER_ID = 'a0000000-0000-4000-8000-000000000002';
export const SEED_BUYER_ID = 'a0000000-0000-4000-8000-000000000003';

async function main() {
  console.log('Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...');
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Tạo ADMIN với UUID v4 cố định
  const admin = await prisma.user.upsert({
    where: { email: 'admin@liveorder.com' },
    update: { id: SEED_ADMIN_ID, password: passwordHash, name: 'System Admin', role: Role.ADMIN },
    create: {
      id: SEED_ADMIN_ID,
      email: 'admin@liveorder.com',
      password: passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  // 2. Tạo SELLER với UUID v4 cố định
  const seller = await prisma.user.upsert({
    where: { email: 'seller@liveorder.com' },
    update: { id: SEED_SELLER_ID, password: passwordHash, name: 'Chủ Shop (Streamer)', role: Role.SELLER },
    create: {
      id: SEED_SELLER_ID,
      email: 'seller@liveorder.com',
      password: passwordHash,
      name: 'Chủ Shop (Streamer)',
      role: Role.SELLER,
    },
  });

  // 3. Tạo BUYER với UUID v4 cố định
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@liveorder.com' },
    update: { id: SEED_BUYER_ID, password: passwordHash, name: 'Khách hàng', role: Role.BUYER },
    create: {
      id: SEED_BUYER_ID,
      email: 'buyer@liveorder.com',
      password: passwordHash,
      name: 'Khách hàng',
      role: Role.BUYER,
    },
  });

  console.log('Seeding thành công! Các tài khoản cố định ID (UUID v4):');
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
