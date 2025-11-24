require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const reportesRoutes = require('./routes/reportesMaestroRoutes');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/reportesmaestdb';
mongoose.connect(MONGO, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('Micro-reportes-maestros: Mongo connected'))
  .catch(err=> { console.error(err); process.exit(1); });

app.use('/', reportesRoutes);
app.get('/health', (req,res)=> res.json({ service: 'micro-reportes-maestros', status: 'ok' }));

const PORT = process.env.PORT || 5004;
app.listen(PORT, ()=> console.log(`micro-reportes-maestros listening on ${PORT}`));
