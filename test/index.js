const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Hibernot } = require('../dist/index');

const port = 3000;
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const fetchRecordsFromDB = async () => {
  return [{ id: 1, name: 'Record 1' }, { id: 2, name: 'Record 2' }];
};

const hibernotDB = new Hibernot({
  name: 'PrimaryDB',
  inactivityLimit: 20000,
  maxRetries: 3,
  keepAliveFn: async () => {
    console.log('[PrimaryDB] Executing keep-alive database query...');
    const records = await fetchRecordsFromDB();
    const stats= hibernotDB.getStats();
    console.log("Hibernot hit", stats.activityCount);
  },
});

app.use('/', hibernotDB.middleware());

app.get('/', async (req, res) => {
  try {
    const records = await fetchRecordsFromDB();
    res.json({
      message: 'Welcome to the Hibernot API!',
      records,
      stats: hibernotDB.getStats(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

app.get('/hibernot-stats', (req, res) => {
  res.json({ primaryDB: hibernotDB.getStats() });
});

app.post('/hibernot-reset', (req, res) => {
  hibernotDB.resetCounter();
  res.json({ message: 'Counter reset', stats: hibernotDB.getStats() });
});

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  hibernotDB.stop();
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});