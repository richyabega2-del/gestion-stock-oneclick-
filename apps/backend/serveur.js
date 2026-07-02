const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const routes = require('./oneclick_routes');
app.use('/api', routes);

app.listen(5000, () => {
  console.log('Serveur ONECLICK démarré sur le port 5000');
});