#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Reserva = require('../src/models/Reserva');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/estudiantesdb';
  const apply = process.argv.includes('--apply');

  console.log(`Connecting to ${uri}... (apply=${apply})`);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Group duplicate active reservas by estudiante+maestro+dia+inicio
    const pipeline = [
      { $match: { estado: 'Activa' } },
      { $group: {
        _id: { estudianteId: '$estudianteId', maestroId: '$maestroId', dia: '$dia', inicio: '$inicio' },
        ids: { $push: '$_id' },
        count: { $sum: 1 },
        createds: { $push: '$createdAt' }
      }},
      { $match: { count: { $gt: 1 } } }
    ];

    const duplicates = await Reserva.aggregate(pipeline);
    if (!duplicates || duplicates.length === 0) {
      console.log('No duplicate active reservas found.');
      return process.exit(0);
    }

    console.log(`Found ${duplicates.length} duplicate groups.`);

    let totalToDelete = 0;
    for (const group of duplicates) {
      const { _id, ids } = group;
      // Fetch full docs to keep the earliest (by createdAt)
      const docs = await Reserva.find({ _id: { $in: ids } }).sort({ createdAt: 1 }).exec();
      const keep = docs[0];
      const toDelete = docs.slice(1).map(d => d._id);

      console.log(`Group: estudiante=${_id.estudianteId} maestro=${_id.maestroId} dia=${_id.dia} inicio=${_id.inicio}`);
      console.log(`  Keep: ${keep._id} createdAt=${keep.createdAt}`);
      console.log(`  Delete ${toDelete.length} IDs: ${toDelete.join(', ')}`);

      totalToDelete += toDelete.length;

      if (apply && toDelete.length) {
        const r = await Reserva.deleteMany({ _id: { $in: toDelete } });
        console.log(`  Deleted ${r.deletedCount} documents.`);
      }
    }

    console.log(`Summary: groups=${duplicates.length}, totalToDelete=${totalToDelete}, applied=${apply}`);
    if (!apply) console.log('Dry-run complete. Re-run with --apply to delete duplicates.');
  } catch (err) {
    console.error('Error during cleanup:', err && err.stack ? err.stack : err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
