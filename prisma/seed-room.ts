import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rooms = [
    {
      name: 'Room 1',
      color: '#00ff00',
      capacity: 10,
    },
    {
      name: 'Room 2',
      color: '#FFA500',
      capacity: 4,
    },
    {
      name: 'Room 3',
      color: '#0000FF',
      capacity: 4,
    },
  ];

  Promise.all(
    rooms.map(async (r) => {
      const roomSeed = await prisma.room.upsert({
        where: { name: r.name },
        update: {},
        create: {
          name: r.name,
          color: r.color,
          capacity: r.capacity,
        },
      });

      console.log('new room', roomSeed);
    }),
  ).catch((error) => {
    console.log(error);
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
