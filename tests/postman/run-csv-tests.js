// tests/postman/run-csv-tests.js
const newman = require('newman');
const fs = require('fs');
const csv = require('csv-parser');

// First, convert CSV to JSON format that Postman can use
async function convertCSVtoPostmanData(csvPath) {
  const data = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        data.push({
          description: row.description,
          symbol: row.symbol,
          orderType: row.orderType,
          quantity: row.quantity,
          price: row.price,
          expectedResult: row.expectedResult,
          expectedError: row.expectedError
        });
      })
      .on('end', () => resolve(data))
      .on('error', reject);
  });
}

// Create a Postman collection that uses data variables
const dataDrivernCollection = {
  info: {
    name: "Data-Driven Order Tests",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [
    {
      name: "Data-Driven Order Test",
      event: [
        {
          listen: "test",
          script: {
            exec: [
              "const expectedResult = pm.iterationData.get('expectedResult');",
              "const expectedError = pm.iterationData.get('expectedError');",
              "",
              "if (expectedResult === 'success') {",
              "    pm.test('Order should be successful', function () {",
              "        pm.response.to.have.status(200);",
              "        const jsonData = pm.response.json();",
              "        pm.expect(jsonData).to.have.property('order');",
              "    });",
              "} else {",
              "    pm.test('Order should fail with error', function () {",
              "        pm.expect(pm.response.code).to.be.oneOf([400, 401, 403, 422]);",
              "        const jsonData = pm.response.json();",
              "        pm.expect(jsonData).to.have.property('error');",
              "        if (expectedError) {",
              "            pm.expect(jsonData.error).to.include(expectedError);",
              "        }",
              "    });",
              "}",
              "",
              "// Log test description",
              "console.log('Test: ' + pm.iterationData.get('description'));"
            ],
            type: "text/javascript"
          }
        }
      ],
      request: {
        method: "POST",
        header: [
          {
            key: "Authorization",
            value: "Bearer {{authToken}}"
          },
          {
            key: "Content-Type",
            value: "application/json"
          }
        ],
        body: {
          mode: "raw",
          raw: JSON.stringify({
            symbol: "{{symbol}}",
            orderType: "{{orderType}}",
            quantity: "{{quantity}}",
            price: "{{price}}"
          })
        },
        url: {
          raw: "{{baseUrl}}/orders/place",
          host: ["{{baseUrl}}"],
          path: ["orders", "place"]
        }
      }
    }
  ]
};

// Run the tests
async function runDataDrivenTests() {
  try {
    // Convert CSV to data array
    const testData = await convertCSVtoPostmanData('tests/data/order-test-scenarios.csv');
    
    // Save collection to file
    fs.writeFileSync(
      'tests/postman/data-driven-collection.json', 
      JSON.stringify(dataDrivernCollection, null, 2)
    );
    
    // Run Newman with data
    newman.run({
      collection: dataDrivernCollection,
      environment: 'tests/postman/local-env.json',
      iterationData: testData,
      reporters: ['cli', 'htmlextra'],
      reporter: {
        htmlextra: {
          export: './reports/data-driven-test-report.html',
          showOnlyFails: false,
          title: 'Order Test Scenarios Report',
          titleSize: 4,
          omitHeaders: true,
          showEnvironmentData: true,
          skipHeaders: false
        }
      }
    }, function (err, summary) {
      if (err) throw err;
      
      console.log('\n=== Test Summary ===');
      console.log(`Total Iterations: ${summary.run.stats.iterations.total}`);
      console.log(`Failed Iterations: ${summary.run.stats.iterations.failed}`);
      console.log(`Total Assertions: ${summary.run.stats.assertions.total}`);
      console.log(`Failed Assertions: ${summary.run.stats.assertions.failed}`);
      
      // Generate summary report
      const report = testData.map((scenario, index) => ({
        scenario: scenario.description,
        expected: scenario.expectedResult,
        passed: summary.run.executions[index]?.assertions?.every(a => !a.error) || false
      }));
      
      fs.writeFileSync(
        'reports/test-summary.json',
        JSON.stringify(report, null, 2)
      );
    });
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Execute
runDataDrivenTests();