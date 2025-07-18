// tests/chaos/chaos-scenarios.js
const chaosMonkey = require('chaos-monkey');

const chaosScenarios = [
  {
    name: 'Database Connection Failure',
    target: 'database',
    action: 'disconnect',
    duration: 30000,
    probability: 0.5
  },
  {
    name: 'High Latency',
    target: 'network',
    action: 'delay',
    delay: 5000,
    duration: 60000,
    probability: 0.3
  },
  {
    name: 'Service Crash',
    target: 'service:trading-service',
    action: 'kill',
    probability: 0.1
  },
  {
    name: 'Memory Pressure',
    target: 'system',
    action: 'memory-pressure',
    percentage: 80,
    duration: 120000,
    probability: 0.2
  }
];

async function runChaosTests() {
  for (const scenario of chaosScenarios) {
    console.log(`Running chaos scenario: ${scenario.name}`);
    
    await chaosMonkey.execute(scenario);
    
    // Monitor system behavior
    const metrics = await collectMetrics();
    
    // Verify system resilience
    expect(metrics.errorRate).toBeLessThan(0.1);
    expect(metrics.avgResponseTime).toBeLessThan(2000);
    expect(metrics.availability).toBeGreaterThan(0.95);
  }
}