require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const horariosRoutes = require('./routes/horariosRoutes');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/maestrosdb';
mongoose.connect(MONGO, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('Micro-maestros: Mongo connected'))
  .catch(err=> { console.error(err); process.exit(1); });

app.use('/', horariosRoutes);
app.get('/health', (req,res)=> res.json({ service: 'micro-maestros', status: 'ok' }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, ()=> console.log(`micro-maestros listening on ${PORT}`));
