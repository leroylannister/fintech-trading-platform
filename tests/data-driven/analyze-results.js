// tests/data-driven/analyze-results.js
const fs = require('fs');
const csv = require('csv-parser');

class TestResultAnalyzer {
  constructor() {
    this.results = [];
    this.summary = {
      total: 0,
      passed: 0,
      failed: 0,
      byCategory: {},
      failurePatterns: {}
    };
  }

  async loadResults(csvPath) {
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => this.results.push(row))
        .on('end', () => {
          this.analyze();
          resolve(this.summary);
        })
        .on('error', reject);
    });
  }

  analyze() {
    this.results.forEach(result => {
      this.summary.total++;
      
      // Count pass/fail
      if (result.actualResult === result.expectedResult) {
        this.summary.passed++;
      } else {
        this.summary.failed++;
        this.categorizeFailure(result);
      }
      
      // Categorize by test type
      const category = this.categorizeTest(result.description);
      if (!this.summary.byCategory[category]) {
        this.summary.byCategory[category] = { passed: 0, failed: 0 };
      }
      
      if (result.actualResult === result.expectedResult) {
        this.summary.byCategory[category].passed++;
      } else {
        this.summary.byCategory[category].failed++;
      }
    });
    
    // Calculate pass rate
    this.summary.passRate = (this.summary.passed / this.summary.total * 100).toFixed(2) + '%';
  }

  categorizeTest(description) {
    if (description.includes('Valid')) return 'Valid Orders';
    if (description.includes('Insufficient')) return 'Insufficient Resources';
    if (description.includes('Invalid')) return 'Validation Errors';
    if (description.includes('Edge case')) return 'Edge Cases';
    if (description.includes('injection') || description.includes('XSS')) return 'Security Tests';
    return 'Other';
  }

  categorizeFailure(result) {
    const pattern = result.actualError || 'Unknown error';
    if (!this.summary.failurePatterns[pattern]) {
      this.summary.failurePatterns[pattern] = [];
    }
    this.summary.failurePatterns[pattern].push(result.description);
  }

  generateReport() {
    const report = `
# Test Results Analysis Report
Generated: ${new Date().toISOString()}

## Summary
- Total Tests: ${this.summary.total}
- Passed: ${this.summary.passed}
- Failed: ${this.summary.failed}
- Pass Rate: ${this.summary.passRate}

## Results by Category
${Object.entries(this.summary.byCategory).map(([category, stats]) => 
  `- ${category}: ${stats.passed}/${stats.passed + stats.failed} passed`
).join('\n')}

## Failure Patterns
${Object.entries(this.summary.failurePatterns).map(([pattern, tests]) => 
  `### ${pattern}\n${tests.map(t => `  - ${t}`).join('\n')}`
).join('\n\n')}

## Recommendations
${this.generateRecommendations()}
`;
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.summary.failurePatterns['Insufficient balance']) {
      recommendations.push('- Review balance checking logic');
    }
    
    if (this.summary.failurePatterns['Invalid symbol']) {
      recommendations.push('- Improve symbol validation');
    }
    
    if (this.summary.byCategory['Security Tests']?.failed > 0) {
      recommendations.push('- **CRITICAL**: Security tests failing - review input sanitization');
    }
    
    return recommendations.join('\n') || '- All tests passing as expected';
  }
}

// Usage
const analyzer = new TestResultAnalyzer();
analyzer.loadResults('tests/results/test-results.csv')
  .then(() => {
    const report = analyzer.generateReport();
    fs.writeFileSync('tests/reports/analysis-report.md', report);
    console.log('Analysis complete. Report saved to tests/reports/analysis-report.md');
    console.log(analyzer.summary);
  })
  .catch(err => console.error('Error analyzing results:', err));