// tests/security/zap-scan.js
const ZAPClient = require('zaproxy');

const zapOptions = {
  proxy: 'http://localhost:8080',
  targetUrl: 'http://localhost:3000'
};

const zap = new ZAPClient(zapOptions.proxy);

async function runSecurityScan() {
  try {
    // Start ZAP spider
    await zap.spider.scan(zapOptions.targetUrl);
    
    // Wait for spider to complete
    let spiderStatus;
    do {
      await new Promise(resolve => setTimeout(resolve, 5000));
      spiderStatus = await zap.spider.status();
    } while (spiderStatus < 100);
    
    // Run active scan
    await zap.ascan.scan(zapOptions.targetUrl);
    
    // Wait for active scan
    let scanStatus;
    do {
      await new Promise(resolve => setTimeout(resolve, 5000));
      scanStatus = await zap.ascan.status();
    } while (scanStatus < 100);
    
    // Get alerts
    const alerts = await zap.core.alerts();
    
    // Generate report
    const htmlReport = await zap.core.htmlreport();
    require('fs').writeFileSync('security-report.html', htmlReport);
    
    // Check for high-risk vulnerabilities
    const highRiskAlerts = alerts.filter(alert => alert.risk === 'High');
    
    if (highRiskAlerts.length > 0) {
      console.error('High-risk vulnerabilities found:', highRiskAlerts);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Security scan failed:', error);
    process.exit(1);
  }
}

runSecurityScan();