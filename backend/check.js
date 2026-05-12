const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.popup.findUnique({ where: { id: 'd070d3b6-1c12-43fd-bae3-a29885c9b162' } });
  console.log(p);
}

main().finally(() => prisma.$disconnect());
