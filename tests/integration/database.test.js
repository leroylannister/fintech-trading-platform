// tests/integration/database.test.js
const { Pool } = require('pg');
const migrate = require('node-pg-migrate');

describe('Database Integration', () => {
  let pool;

  beforeAll(async () => {
    // Use test database
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL
    });

    // Run migrations
    await migrate.default({
      databaseUrl: process.env.TEST_DATABASE_URL,
      dir: 'migrations',
      direction: 'up',
      migrationsTable: 'pgmigrations'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clean tables before each test
    await pool.query('TRUNCATE TABLE users, orders, trades CASCADE');
  });

  test('should handle concurrent order placement', async () => {
    // Create test user
    await pool.query(
      'INSERT INTO users (email, password_hash, balance) VALUES ($1, $2, $3)',
      ['test@example.com', 'hash', 10000]
    );

    // Place multiple orders concurrently
    const orderPromises = Array(10).fill().map((_, i) => 
      pool.query(
        'INSERT INTO orders (user_id, symbol, order_type, quantity, price) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [1, 'AAPL', 'BUY', 10, 150 + i]
      )
    );

    const results = await Promise.all(orderPromises);
    
    expect(results).toHaveLength(10);
    expect(results.every(r => r.rows[0].id)).toBeTruthy();
  });
});