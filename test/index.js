const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { Hibernot } = require('../dist/index');
const port = 3000;
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const hibernot = new Hibernot({
  interval: 10000, // 10 seconds
  inactivityLimit: 15000, // 15 seconds
  keepAliveFn: async () => {
    const stats = hibernot.getStats();
    console.log('Keep-alive function called');
    console.log('GET request received', stats.getCounter, 'times at', new Date(stats.lastAPIhit).toLocaleString());
    // Optionally, you can make a self-hit here if needed
    // await axios.get(`http://localhost:${port}/`);
  }
});

app.get('/', (req, res) => {
  hibernot.apiHit();
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});