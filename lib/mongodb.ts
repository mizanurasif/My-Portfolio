import { MongoClient, type Db } from "mongodb";

const uri =
  process.env.MONGODB_URI ??
  "mongodb://admin:password@localhost:27017/?authSource=admin";

const dbName = process.env.MONGODB_DB ?? "user-account";

// Reuse the client across hot reloads in development so we don't open a new
// connection pool on every change.
const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalForMongo._mongoClientPromise ?? new MongoClient(uri).connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
