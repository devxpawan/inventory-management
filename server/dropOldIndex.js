// Script to drop old SKU index
const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndex() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log('Database name:', dbName);
    
    const collection = db.collection('inventoryitems');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the sku_1 index if it exists
    try {
      await collection.dropIndex('sku_1');
      console.log('Successfully dropped sku_1 index from', dbName);
    } catch (error) {
      console.log('sku_1 index not found in', dbName);
    }

    // Verify indexes after drop
    const indexesAfter = await collection.indexes();
    console.log('Indexes after drop:', JSON.stringify(indexesAfter, null, 2));

    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropOldIndex();
