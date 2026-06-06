import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: 'venda-consignada',
  },
});

console.log(`MongoDB de desenvolvimento rodando em ${mongo.getUri()}`);

const shutdown = async () => {
  await mongo.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

setInterval(() => {}, 1000);
