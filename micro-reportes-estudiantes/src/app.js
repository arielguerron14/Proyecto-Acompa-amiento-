require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const reportesRoutes = require('./routes/reportesEstRoutes');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/reportesestdb';
mongoose.connect(MONGO, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('Micro-reportes-estudiantes: Mongo connected'))
  .catch(err=> { console.error(err); process.exit(1); });

app.use('/', reportesRoutes);
app.get('/health', (req,res)=> res.json({ service: 'micro-reportes-estudiantes', status: 'ok' }));

const PORT = process.env.PORT || 5003;
app.listen(PORT, ()=> console.log(`micro-reportes-estudiantes listening on ${PORT}`));
