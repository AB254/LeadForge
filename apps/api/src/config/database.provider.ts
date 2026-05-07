import { Provider } from '@nestjs/common';
import { PrismaClient } from '@leadforge/database';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

const prismaClientSingleton = (() => {
  let client: PrismaClient | null = null;
  return () => {
    if (!client) {
      client = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
      });
    }
    return client;
  };
})();

export const DatabaseProvider: Provider = {
  provide: PRISMA_CLIENT,
  useFactory: () => {
    const client = prismaClientSingleton();
    client.$connect();
    return client;
  },
};
