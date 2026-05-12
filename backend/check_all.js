const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const popups = await prisma.popup.findMany({ select: { id: true, name: true, status: true, config: true } });
  popups.forEach(p => {
    console.log(`ID: ${p.id} | Status: ${p.status}`);
    console.log(`Config Layout: ${JSON.parse(p.config).layout}`);
    console.log('---');
  });
}

main().finally(() => prisma.$disconnect());
