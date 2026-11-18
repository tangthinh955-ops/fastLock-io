import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const SEED_ADMIN_ID = 'a0000000-0000-4000-8000-000000000001';
export const SEED_SELLER_ID = 'a0000000-0000-4000-8000-000000000002';
export const SEED_BUYER_ID = 'a0000000-0000-4000-8000-000000000003';

async function main() {
  console.log('Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...');
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Tạo ADMIN với UUID v4 cố định (không ghi đè id khi update để giữ FK hiện hữu)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@liveorder.com' },
    update: { password: passwordHash, name: 'System Admin', role: Role.ADMIN },
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
    update: { password: passwordHash, name: 'Chủ Shop (Streamer)', role: Role.SELLER },
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
    update: { password: passwordHash, name: 'Khách hàng', role: Role.BUYER },
    create: {
      id: SEED_BUYER_ID,
      email: 'buyer@liveorder.com',
      password: passwordHash,
      name: 'Khách hàng',
      role: Role.BUYER,
    },
  });

  // 4. Tạo 30 tài khoản BUYER demo (buyer01..buyer30) cho buổi live 20–30 người xem
  const demoBuyers: Array<{ id: string; email: string }> = [];
  for (let i = 1; i <= 30; i += 1) {
    const suffix = String(i).padStart(2, '0');
    const id = `a0000000-0000-4000-8000-0000000001${suffix}`;
    const email = `buyer${suffix}@liveorder.com`;
    const name = `Khách Demo ${suffix}`;

    const demoBuyer = await prisma.user.upsert({
      where: { email },
      update: { password: passwordHash, name, role: Role.BUYER },
      create: {
        id,
        email,
        password: passwordHash,
        name,
        role: Role.BUYER,
      },
    });
    demoBuyers.push(demoBuyer);
  }

  // 5. Upsert 3 sản phẩm demo cho seller.id (giữ nguyên dữ liệu/tồn kho nếu đã tồn tại)
  const demoProducts = [
    { sku: 'SP01', name: 'Áo polo', price: 200000, stock: 20 },
    { sku: 'SP02', name: 'Quần jean', price: 500000, stock: 15 },
    { sku: 'SP03', name: 'Áo thun basic', price: 150000, stock: 20 },
  ];

  for (const item of demoProducts) {
    await prisma.product.upsert({
      where: { sku: item.sku },
      update: {},
      create: {
        sku: item.sku,
        name: item.name,
        price: item.price,
        stock: item.stock,
        sellerId: seller.id,
      },
    });
  }

  // 6. Tạo 3 mục Knowledge Base mặc định nếu shop chưa có KB nào
  const existingKbCount = await prisma.kbEntry.count({
    where: { sellerId: seller.id },
  });

  if (existingKbCount === 0) {
    await prisma.kbEntry.createMany({
      data: [
        {
          sellerId: seller.id,
          keyword: 'Bảng size áo',
          answer:
            'Bảng size tham khảo: Size M (45-55kg, cao 1m55-1m65), Size L (56-68kg, cao 1m65-1m74), Size XL (69-80kg, cao 1m74-1m82). Nếu thích mặc form rộng thoải mái, khách chọn tăng 1 size nhé!',
        },
        {
          sellerId: seller.id,
          keyword: 'Chính sách phí ship & thời gian giao hàng',
          answer:
            'Phí ship đồng giá toàn quốc 25.000đ, miễn phí ship (freeship) cho đơn từ 300.000đ. Thời gian giao hàng dự kiến 1-2 ngày ở nội thành và 3-4 ngày ở tỉnh thành khác.',
        },
        {
          sellerId: seller.id,
          keyword: 'Chính sách đổi trả & thanh toán VietQR',
          answer:
            'Shop hỗ trợ đổi size trong 7 ngày nếu sản phẩm còn nguyên tem mác, chưa qua sử dụng. Sau khi chốt đơn trên live, hệ thống sẽ gửi mã VietQR vào Inbox riêng để khách chuyển khoản nhanh chóng.',
        },
      ],
    });
  }

  console.log('Seeding thành công! Các tài khoản cố định ID (UUID v4):');
  console.log('- Admin:', admin.email, `(ID: ${admin.id})`);
  console.log('- Seller:', seller.email, `(ID: ${seller.id})`);
  console.log('- Buyer:', buyer.email, `(ID: ${buyer.id})`);
  console.log(`- Demo Buyers: ${demoBuyers.length} tài khoản (buyer01@liveorder.com .. buyer30@liveorder.com)`);
  console.log(`- KB entries hiện có của Seller: ${existingKbCount === 0 ? 3 : existingKbCount}`);
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
