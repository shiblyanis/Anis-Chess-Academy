const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure the data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Already exists — that's fine
  }
}

/**
 * Read a JSON data file. Returns an empty array if it doesn't exist yet.
 * @param {string} filename — e.g. 'bookings.json'
 */
async function readData(filename) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return []; // File doesn't exist yet — start fresh
    }
    throw err;
  }
}

/**
 * Write data array to a JSON file (pretty-printed).
 * @param {string} filename — e.g. 'bookings.json'
 * @param {Array}  data     — array to persist
 */
async function writeData(filename, data) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readData, writeData };
