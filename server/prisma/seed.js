// import 'dotenv/config';
// import bcrypt from 'bcrypt';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// async function main() {
//   const email = process.env.SUPER_ADMIN_EMAIL, password = process.env.SUPER_ADMIN_PASSWORD;
//   if (!email || !password) throw new Error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env');
//   await prisma.user.upsert({
//     where: { email: email.toLowerCase() }, update: {},
//     create: { fullName: 'Super Admin', email: email.toLowerCase(), mobileNumber: '9000000000', dateOfBirth: new Date('1990-01-01'),
//       doorNumber: '1', streetName: 'Head Office Road', address: 'Unique Designs HQ', district: 'Chennai', state: 'Tamil Nadu', pincode: '600001',
//       passwordHash: await bcrypt.hash(password, 12), role: 'SUPER_ADMIN' }
//   });
//   for (const name of ['Sarees', 'Kurtis', 'Western Wear', 'Ethnic Wear', 'Kids Frocks']) {
//     const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
//     await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
//   }
//   console.log('Seed complete: super admin + starter categories (add products from the admin panel).');
// }
// main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
import 'dotenv/config';

import bcrypt from 'bcrypt';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env'
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: {
      email: email.toLowerCase(),
    },

    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
    },

    create: {
      fullName: 'Super Admin',
      email: email.toLowerCase(),
      mobileNumber: '9000000000',
      dateOfBirth: new Date('1990-01-01'),

      doorNumber: '1',
      streetName: 'Head Office Road',
      address: 'Unique Designs HQ',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',

      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  // Starter Categories
  for (const name of [
    'Sarees',
    'Kurtis',
    'Western Wear',
    'Ethnic Wear',
    'Kids Frocks',
  ]) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    await prisma.category.upsert({
      where: {
        slug,
      },

      update: {},

      create: {
        name,
        slug,
      },
    });
  }

  console.log(
    'Seed complete: super admin + starter categories (add products from the admin panel).'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
