const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { Hibernot } = require('../dist/index.js'); // Adjust path or use 'hibernot' for npm package
const port = 3000;
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const fetchRecordsFromDB = async () => {
  // Replace with actual DB logic (e.g., MongoDB, PostgreSQL)
  return [{ id: 1, name: 'Record 1' }, { id: 2, name: 'Record 2' }];
};

app.get('/', (req, res) => {

  const hibernotDB = new Hibernot({
    name: 'PrimaryDB',
    inactivityLimit: 10000, // 5 minutes
    keepAliveFn: async () => {
      try {
        // Ping the API to keep the DB alive (simulates a DB query)
        const stats = hibernotDB.getStats();
        console.log(
          '[PrimaryDB] Hits:',
          stats.getCounter,
          'Last hit:',
          new Date(stats.lastAPIhit).toLocaleString()
        );
      } catch (err) {
        console.error('[PrimaryDB] Keep-alive ping failed:', err.message);
      }
    },
  });
  res.send('Welcome to the Hibernot API!');
});



// // API route to fetch records from DB
// app.get('/db', async (req, res) => {
//   try {
//     const records = await fetchRecordsFromDB();
//     res.json({
//       message: 'Primary DB endpoint',
//       records,
//       stats: hibernotDB.getStats(),
//     });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch records' });
//   }
// });