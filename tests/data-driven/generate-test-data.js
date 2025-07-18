// tests/data-driven/generate-test-data.js
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

// Generate comprehensive test scenarios
function generateTestScenarios() {
  const scenarios = [];
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
  const orderTypes = ['BUY', 'SELL'];
  
  // Valid scenarios
  symbols.forEach(symbol => {
    orderTypes.forEach(orderType => {
      // Normal cases
      scenarios.push({
        description: `Valid ${orderType} order for ${symbol}`,
        userId: 1,
        symbol,
        orderType,
        quantity: Math.floor(Math.random() * 20) + 1,
        price: Math.floor(Math.random() * 100) + 100,
        expectedResult: 'success',
        expectedError: ''
      });
    });
  });
  
  // Edge cases
  const edgeCases = [
    { 
      description: 'Maximum allowed quantity', 
      quantity: 9999, 
      expectedResult: 'success' 
    },
    { 
      description: 'Minimum allowed quantity', 
      quantity: 1, 
      expectedResult: 'success' 
    },
    { 
      description: 'Just below minimum price', 
      price: 0.99, 
      expectedResult: 'error',
      expectedError: 'Price below minimum' 
    },
    { 
      description: 'Maximum price boundary', 
      price: 10000, 
      expectedResult: 'success' 
    },
    { 
      description: 'Special characters in symbol', 
      symbol: 'AAPL$', 
      expectedResult: 'error',
      expectedError: 'Invalid symbol' 
    },
    { 
      description: 'SQL injection attempt', 
      symbol: "'; DROP TABLE orders; --", 
      expectedResult: 'error',
      expectedError: 'Invalid symbol' 
    },
    { 
      description: 'XSS attempt', 
      symbol: '<script>alert("xss")</script>', 
      expectedResult: 'error',
      expectedError: 'Invalid symbol' 
    }
  ];
  
  edgeCases.forEach(edgeCase => {
    scenarios.push({
      description: edgeCase.description,
      userId: 1,
      symbol: edgeCase.symbol || 'AAPL',
      orderType: 'BUY',
      quantity: edgeCase.quantity || 10,
      price: edgeCase.price || 150,
      expectedResult: edgeCase.expectedResult,
      expectedError: edgeCase.expectedError || ''
    });
  });
  
  return scenarios;
}

// Write to CSV
const csvWriter = createObjectCsvWriter({
  path: 'tests/data/generated-test-scenarios.csv',
  header: [
    { id: 'description', title: 'description' },
    { id: 'userId', title: 'userId' },
    { id: 'symbol', title: 'symbol' },
    { id: 'orderType', title: 'orderType' },
    { id: 'quantity', title: 'quantity' },
    { id: 'price', title: 'price' },
    { id: 'expectedResult', title: 'expectedResult' },
    { id: 'expectedError', title: 'expectedError' }
  ]
});

const scenarios = generateTestScenarios();
csvWriter.writeRecords(scenarios)
  .then(() => console.log(`Generated ${scenarios.length} test scenarios`))
  .catch(err => console.error('Error writing CSV:', err));