// Script to find/remove duplicate Horario documents (keeps first occurrence)
// Usage: node scripts/cleanup-duplicate-horarios.js

const mongoose = require('mongoose');
const Horario = require('../src/models/Horario');

const MONGO = process.env.MONGO_URL || 'mongodb://localhost:27017/micromaestros';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO);

  const horarios = await Horario.find({}).lean();
  const map = new Map();
  const duplicates = [];

  for (const h of horarios) {
    const key = `${h.maestroId}|${h.materia}|${h.paralelo}|${h.dia}|${h.inicio}|${h.fin}`;
    if (!map.has(key)) {
      map.set(key, h._id);
    } else {
      duplicates.push({ key, id: h._id, keepId: map.get(key) });
    }
  }

  if (duplicates.length === 0) {
    console.log('No duplicates found');
    process.exit(0);
  }

  console.log(`Found ${duplicates.length} duplicates. Removing duplicates (keeping first occurrence)...`);
  for (const d of duplicates) {
    console.log('Removing duplicate', d);
    await Horario.findByIdAndDelete(d.id);
  }

  console.log('Cleanup complete');
  mongoose.disconnect();
}

run().catch(err => {
  console.error('Error in cleanup script:', err);
  process.exit(1);
});