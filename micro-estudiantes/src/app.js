require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const reservasRoutes = require('./routes/reservasRoutes');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/estudiantesdb';
mongoose.connect(MONGO, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('Micro-estudiantes: Mongo connected'))
  .catch(err=> { console.error(err); process.exit(1); });

app.use('/', reservasRoutes);
app.get('/health', (req,res)=> res.json({ service: 'micro-estudiantes', status: 'ok' }));

const PORT = process.env.PORT || 5002;
app.listen(PORT, ()=> console.log(`micro-estudiantes listening on ${PORT}`));
