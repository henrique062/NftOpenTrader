const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'nft_data'; // Nome do banco de dados

let client;
let db;

async function connect() {
  if (!client) {
    client = new MongoClient(uri); 
    await client.connect();
  }
  if (!db) {
    db = client.db(dbName);
  }
  return db;
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { connect, close };