// tests/reporters/trading-test-reporter.js
class TradingTestReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.results = {
      startTime: Date.now(),
      suites: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      coverage: {}
    };
  }

  onTestResult(test, testResult) {
    this.results.totalTests += testResult.numTotalTests;
    this.results.passedTests += testResult.numPassingTests;
    this.results.failedTests += testResult.numFailingTests;
    this.results.skippedTests += testResult.numPendingTests;

    // Store detailed results
    this.results.suites.push({
      name: testResult.testFilePath,
      duration: testResult.perfStats.runtime,
      tests: testResult.testResults.map(t => ({
        title: t.title,
        status: t.status,
        duration: t.duration,
        failureMessages: t.failureMessages
      }))
    });
  }

  onRunComplete(contexts, results) {
    this.results.endTime = Date.now();
    this.results.totalDuration = this.results.endTime - this.results.startTime;
    
    // Generate HTML report
    const html = this.generateHTMLReport();
    require('fs').writeFileSync('test-report.html', html);
    
    // Send to dashboard
    this.sendToDashboard(this.results);
  }

  generateHTMLReport() {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trading Platform Test Report</title>
          <style>
            /* Styles for the report */
          </style>
        </head>
        <body>
          <h1>Test Results</h1>
          <div class="summary">
            <p>Total Tests: ${this.results.totalTests}</p>
            <p>Passed: ${this.results.passedTests}</p>
            <p>Failed: ${this.results.failedTests}</p>
            <p>Duration: ${this.results.totalDuration}ms</p>
          </div>
          <!-- Detailed results -->
        </body>
      </html>
    `;
  }

  async sendToDashboard(results) {
    // Send results to monitoring dashboard
    await fetch('http://monitoring-dashboard/api/test-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    });
  }
}

module.exports = TradingTestReporter;