  import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync('Matkhau123', 10);
  const AvatarDefault =
    'https://res.cloudinary.com/dwhzah4l6/image/upload/v1688355839/avatars/t6chz8de5txu7qjtx6su.png';

  const user1 = await prisma.user.upsert({
    where: { email: 'dien.huynh@mail.com.au' },
    update: {},
    create: {
      email: 'dien.huynh@mail.com.au',
      password: hash,
      fullName: 'Dien Huynh',
      phone: '0396485245',
      isActive: true,
      avatarUrl: AvatarDefault,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'chau.nguyen@mail.com.au' },
    update: {},
    create: {
      email: 'chau.nguyen@mail.com.au',
      password: hash,
      fullName: 'Chau Nguyen',
      phone: '0396485245',
      isActive: true,
      avatarUrl: AvatarDefault,
    },
  });

  console.log({
    user1,
    user2,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
