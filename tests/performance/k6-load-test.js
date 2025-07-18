// tests/performance/k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.1'],             // Error rate under 10%
  },
};

export default function () {
  // Login
  const loginRes = http.post(`${__ENV.BASE_URL}/api/auth/login`, 
    JSON.stringify({
      email: `user${__VU}@test.com`,
      password: 'password123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('token') !== undefined,
  });
  
  errorRate.add(loginRes.status !== 200);
  
  if (loginRes.status !== 200) return;
  
  const token = loginRes.json('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // Simulate user behavior
  sleep(1);
  
  // Get market prices
  const pricesRes = http.get(`${__ENV.BASE_URL}/api/market/prices`);
  check(pricesRes, {
    'prices loaded': (r) => r.status === 200,
  });
  
  sleep(2);
  
  // Place order
  const orderRes = http.post(`${__ENV.BASE_URL}/api/orders/place`,
    JSON.stringify({
      symbol: ['AAPL', 'GOOGL', 'MSFT'][Math.floor(Math.random() * 3)],
      orderType: Math.random() > 0.5 ? 'BUY' : 'SELL',
      orderSubtype: Math.random() > 0.7 ? 'LIMIT' : 'MARKET',
      quantity: Math.floor(Math.random() * 20) + 1,
      price: 150 + Math.random() * 10
    }),
    { headers }
  );
  
  check(orderRes, {
    'order placed': (r) => r.status === 200,
  });
  
  errorRate.add(orderRes.status !== 200);
  
  sleep(3);
}