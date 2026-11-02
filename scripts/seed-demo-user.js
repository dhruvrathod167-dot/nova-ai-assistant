const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'user@novaai.com';
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Demo User',
        passwordHash: 'user123',
        settings: {
          create: {
            aiProvider: 'openrouter',
            aiModel: 'openai/gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 1000,
          },
        },
      },
    });
    console.log('created', user.id);
  } else {
    console.log('exists', user.id);
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    if (!settings) {
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          aiProvider: 'openrouter',
          aiModel: 'openai/gpt-4o-mini',
        },
      });
      console.log('settings created');
    } else if (settings.aiModel !== 'openai/gpt-4o-mini') {
      await prisma.userSettings.update({
        where: { id: settings.id },
        data: { aiModel: 'openai/gpt-4o-mini', aiProvider: 'openrouter' },
      });
      console.log('settings updated to openai/gpt-4o-mini');
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
