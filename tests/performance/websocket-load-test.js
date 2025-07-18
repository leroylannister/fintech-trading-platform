// tests/performance/websocket-load-test.js
const io = require('socket.io-client');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class WebSocketLoadTest {
  constructor(config) {
    this.config = {
      url: config.url || 'http://localhost:3000',
      numClients: config.numClients || 100,
      rampUpTime: config.rampUpTime || 10000,
      testDuration: config.testDuration || 60000,
      symbols: config.symbols || ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
      protocol: config.protocol || 'socketio' // 'socketio' or 'websocket'
    };
    
    this.clients = [];
    this.metrics = {
      connections: 0,
      disconnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      latencies: [],
      startTime: 0,
      endTime: 0,
      connected: 0,
      disconnected: 0
    };
    
    // FIXED: Bind all methods to ensure proper context
    this.createClient = this.createClient.bind(this);
    this.createWebSocketClient = this.createWebSocketClient.bind(this);
    this.createSocketIOClient = this.createSocketIOClient.bind(this);
    this.getRandomSymbols = this.getRandomSymbols.bind(this);
    this.run = this.run.bind(this);
    this.rampUpClients = this.rampUpClients.bind(this);
    this.runTest = this.runTest.bind(this);
    this.cleanup = this.cleanup.bind(this);
    this.reportResults = this.reportResults.bind(this);
    this.calculatePercentile = this.calculatePercentile.bind(this);
    this.generateClientReport = this.generateClientReport.bind(this);
    
    // FIXED: Validate configuration
    this.validateConfig();
    
    console.log(`WebSocketLoadTest initialized with ${this.config.protocol} protocol`);
  }
  
  // FIXED: Add configuration validation
  validateConfig() {
    if (!this.config.url) {
      throw new Error('URL is required');
    }
    
    if (this.config.numClients <= 0) {
      throw new Error('numClients must be greater than 0');
    }
    
    if (!['socketio', 'websocket'].includes(this.config.protocol)) {
      throw new Error('protocol must be either "socketio" or "websocket"');
    }
    
    // FIXED: Ensure symbols array is not empty
    if (!Array.isArray(this.config.symbols) || this.config.symbols.length === 0) {
      this.config.symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    }
  }

  // ENHANCED: Better error handling and validation
  createClient(clientId) {
    try {
      // FIXED: Validate clientId
      if (typeof clientId !== 'number' || clientId < 0) {
        throw new Error(`Invalid clientId: ${clientId}`);
      }
      
      console.log(`Creating client ${clientId} with ${this.config.protocol} protocol`);
      
      if (this.config.protocol === 'websocket') {
        return this.createWebSocketClient(clientId);
      } else {
        return this.createSocketIOClient(clientId);
      }
    } catch (error) {
      console.error(`Error creating client ${clientId}:`, error);
      this.metrics.errors++;
      throw error;
    }
  }

  // ENHANCED: Better WebSocket URL handling and error recovery
  createWebSocketClient(clientId) {
    try {
      // FIXED: Better URL construction
      let wsUrl = this.config.url;
      if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://');
      } else if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://');
      } else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        wsUrl = `ws://${wsUrl}`;
      }
      
      // FIXED: Add WebSocket path if needed
      if (!wsUrl.includes('/socket.io/')) {
        wsUrl += '/socket.io/?EIO=4&transport=websocket';
      }
      
      console.log(`Connecting WebSocket client ${clientId} to ${wsUrl}`);
      const client = new WebSocket(wsUrl);
      
      const clientMetrics = {
        id: clientId,
        connected: false,
        messages: 0,
        subscriptions: [],
        errors: 0,
        startTime: Date.now()
      };
      
      // ENHANCED: Better event handling
      client.onopen = () => {
        this.metrics.connected++;
        this.metrics.connections++;
        clientMetrics.connected = true;
        console.log(`WebSocket client ${clientId} connected. Total: ${this.metrics.connected}`);
        
        // FIXED: Subscribe to symbols after connection
        const symbols = this.getRandomSymbols(2);
        client.subscribe(symbols);
      };
      
      client.onmessage = (event) => {
        this.metrics.messagesReceived++;
        clientMetrics.messages++;
        
        // Handle different message types
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            // Handle pong for latency measurement
            const pingTime = performance.now() - data.timestamp;
            this.metrics.latencies.push(pingTime);
          }
        } catch (e) {
          // Handle non-JSON messages silently
        }
      };
      
      client.onerror = (error) => {
        this.metrics.errors++;
        clientMetrics.errors++;
        console.error(`WebSocket client ${clientId} error:`, error.message || error);
      };
      
      client.onclose = (event) => {
        this.metrics.disconnected++;
        this.metrics.disconnections++;
        clientMetrics.connected = false;
        console.log(`WebSocket client ${clientId} disconnected. Code: ${event.code}, Reason: ${event.reason}`);
      };
      
      // ENHANCED: Helper methods with better error handling
      client.sendMessage = (message) => {
        try {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
            this.metrics.messagesSent++;
            return true;
          } else {
            console.warn(`Client ${clientId} not ready to send message. State: ${client.readyState}`);
            return false;
          }
        } catch (error) {
          console.error(`Error sending message from client ${clientId}:`, error);
          clientMetrics.errors++;
          return false;
        }
      };
      
      client.subscribe = (symbols) => {
        if (client.sendMessage({ type: 'subscribe', symbols })) {
          clientMetrics.subscriptions = symbols;
        }
      };
      
      client.unsubscribe = (symbols) => {
        if (client.sendMessage({ type: 'unsubscribe', symbols })) {
          clientMetrics.subscriptions = clientMetrics.subscriptions.filter(s => !symbols.includes(s));
        }
      };
      
      client.ping = () => {
        client.sendMessage({ type: 'ping', timestamp: performance.now() });
      };
      
      this.clients.push({ client, metrics: clientMetrics });
      return client;
      
    } catch (error) {
      console.error(`Failed to create WebSocket client ${clientId}:`, error);
      this.metrics.errors++;
      throw error;
    }
  }

  // ENHANCED: Better Socket.IO client creation
  createSocketIOClient(clientId) {
    try {
      console.log(`Connecting Socket.IO client ${clientId} to ${this.config.url}`);
      
      const client = io(this.config.url, {
        transports: ['websocket'],
        upgrade: false,
        timeout: 10000,
        reconnection: false,
        forceNew: true
      });
      
      const clientMetrics = {
        id: clientId,
        connected: false,
        messages: 0,
        subscriptions: this.getRandomSymbols(2),
        errors: 0,
        startTime: Date.now()
      };
      
      client.on('connect', () => {
        this.metrics.connections++;
        this.metrics.connected++;
        clientMetrics.connected = true;
        console.log(`Socket.IO client ${clientId} connected. Total: ${this.metrics.connections}`);
        
        // Subscribe to market data
        client.emit('subscribe-market', clientMetrics.subscriptions);
      });
      
      client.on('market-data', (data) => {
        this.metrics.messagesReceived++;
        clientMetrics.messages++;
      });
      
      client.on('pong', () => {
        if (clientMetrics.lastPing) {
          const pingTime = performance.now() - clientMetrics.lastPing;
          this.metrics.latencies.push(pingTime);
        }
      });
      
      client.on('error', (error) => {
        this.metrics.errors++;
        clientMetrics.errors++;
        console.error(`Socket.IO client ${clientId} error:`, error.message || error);
      });
      
      client.on('disconnect', (reason) => {
        this.metrics.disconnections++;
        this.metrics.disconnected++;
        clientMetrics.connected = false;
        console.log(`Socket.IO client ${clientId} disconnected. Reason: ${reason}`);
      });
      
      // FIXED: Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!clientMetrics.connected) {
          console.warn(`Socket.IO client ${clientId} connection timeout`);
          client.disconnect();
          this.metrics.errors++;
        }
      }, 10000);
      
      client.on('connect', () => {
        clearTimeout(connectionTimeout);
      });
      
      this.clients.push({ client, metrics: clientMetrics });
      return client;
      
    } catch (error) {
      console.error(`Failed to create Socket.IO client ${clientId}:`, error);
      this.metrics.errors++;
      throw error;
    }
  }

  // ENHANCED: Better random symbol selection
  getRandomSymbols(count) {
    try {
      if (!Array.isArray(this.config.symbols) || this.config.symbols.length === 0) {
        return ['AAPL', 'GOOGL']; // Fallback
      }
      
      const availableCount = Math.min(count, this.config.symbols.length);
      const shuffled = [...this.config.symbols].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, availableCount);
    } catch (error) {
      console.error('Error getting random symbols:', error);
      return ['AAPL']; // Safe fallback
    }
  }

  // ENHANCED: Better error handling and progress tracking
  async run() {
    try {
      console.log('Starting WebSocket load test...');
      console.log(`Config: ${JSON.stringify(this.config, null, 2)}`);
      
      this.metrics.startTime = Date.now();
      
      // Ramp up clients
      console.log('Phase 1: Ramping up clients...');
      await this.rampUpClients();
      
      // Run test for specified duration
      console.log('Phase 2: Running load test...');
      await this.runTest();
      
      // Clean up
      console.log('Phase 3: Cleaning up...');
      await this.cleanup();
      
      // Report results
      console.log('Phase 4: Generating report...');
      this.reportResults();
      
      console.log('✅ WebSocket load test completed successfully');
      
    } catch (error) {
      console.error('❌ WebSocket load test failed:', error);
      await this.cleanup(); // Ensure cleanup even on failure
      throw error;
    }
  }

  // ENHANCED: Better error handling and progress tracking
  async rampUpClients() {
    const delayBetweenClients = Math.max(10, this.config.rampUpTime / this.config.numClients);
    
    console.log(`Ramping up ${this.config.numClients} clients over ${this.config.rampUpTime}ms...`);
    console.log(`Delay between clients: ${delayBetweenClients}ms`);

    for (let i = 0; i < this.config.numClients; i++) {
      try {
        // FIXED: Add detailed logging
        if (i > 0 && i % 10 === 0) {
          console.log(`Progress: ${i}/${this.config.numClients} clients created`);
        }
        
        const client = this.createClient(i);
        
        if (!client) {
          console.warn(`Failed to create client ${i}, continuing...`);
          continue;
        }
        
        // FIXED: Add small delay even for fast ramp-up
        await new Promise(resolve => setTimeout(resolve, delayBetweenClients));
        
      } catch (error) {
        console.error(`Error creating client ${i}:`, error);
        this.metrics.errors++;
        // Continue with other clients instead of failing completely
      }
    }

    console.log(`✅ Client creation completed. Created: ${this.clients.length}/${this.config.numClients}`);
    
    // FIXED: Wait for connections to establish
    console.log('Waiting for connections to establish...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`Connected clients: ${this.metrics.connected}/${this.clients.length}`);
  }

  // ENHANCED: Better test execution with error handling
  async runTest() {
    console.log(`Running test for ${this.config.testDuration / 1000} seconds...`);
    
    let actionCount = 0;
    
    // Simulate some client actions during the test
    const actionInterval = setInterval(() => {
      try {
        if (this.clients.length === 0) {
          console.warn('No clients available for actions');
          return;
        }
        
        // Random client actions
        const connectedClients = this.clients.filter(c => c.metrics.connected);
        
        if (connectedClients.length === 0) {
          console.warn('No connected clients available for actions');
          return;
        }
        
        const randomClient = connectedClients[Math.floor(Math.random() * connectedClients.length)];
        const action = Math.random();
        
        if (action < 0.1) {
          // 10% chance to change subscriptions
          const newSymbols = this.getRandomSymbols(2);
          
          if (this.config.protocol === 'websocket') {
            randomClient.client.unsubscribe(randomClient.metrics.subscriptions);
            randomClient.client.subscribe(newSymbols);
          } else {
            randomClient.client.emit('unsubscribe-market', randomClient.metrics.subscriptions);
            randomClient.client.emit('subscribe-market', newSymbols);
          }
          
          randomClient.metrics.subscriptions = newSymbols;
          actionCount++;
        } else if (action < 0.15) {
          // 5% chance to ping
          const pingStart = performance.now();
          
          if (this.config.protocol === 'websocket') {
            randomClient.client.ping();
          } else {
            randomClient.metrics.lastPing = pingStart;
            randomClient.client.emit('ping');
          }
          
          actionCount++;
        }
        
      } catch (error) {
        console.error('Error during test action:', error);
        this.metrics.errors++;
      }
    }, 1000);
    
    // FIXED: Progress reporting during test
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.metrics.startTime;
      const remaining = this.config.testDuration - elapsed + this.config.rampUpTime;
      console.log(`Test progress: ${Math.round((elapsed / (this.config.testDuration + this.config.rampUpTime)) * 100)}%, Connected: ${this.metrics.connected}, Messages: ${this.metrics.messagesReceived}, Actions: ${actionCount}`);
    }, 10000);
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, this.config.testDuration));
    
    clearInterval(actionInterval);
    clearInterval(progressInterval);
    
    console.log(`✅ Test execution completed. Actions performed: ${actionCount}`);
  }

  // ENHANCED: Better cleanup with proper error handling
  async cleanup() {
    console.log(`Cleaning up ${this.clients.length} connections...`);
    
    try {
      // Disconnect all clients
      const disconnectPromises = this.clients.map(({ client }, index) => {
        return new Promise((resolve) => {
          try {
            if (this.config.protocol === 'websocket') {
              if (client.readyState === WebSocket.OPEN) {
                client.close(1000, 'Test completed');
              }
            } else {
              client.disconnect();
            }
            resolve();
          } catch (error) {
            console.error(`Error disconnecting client ${index}:`, error);
            resolve(); // Don't block cleanup
          }
        });
      });
      
      // Wait for all disconnections with timeout
      await Promise.race([
        Promise.all(disconnectPromises),
        new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
      ]);
      
      // Wait for disconnections to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.metrics.endTime = Date.now();
      
      console.log(`✅ Cleanup completed. Final stats - Connected: ${this.metrics.connected}, Disconnected: ${this.metrics.disconnected}`);
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      this.metrics.endTime = Date.now();
    }
  }

  // ENHANCED: Better report generation with error handling
  reportResults() {
    try {
      const duration = (this.metrics.endTime - this.metrics.startTime) / 1000;
      const avgLatency = this.metrics.latencies.length > 0
        ? this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length
        : 0;
      
      const p95Latency = this.calculatePercentile(this.metrics.latencies, 95);
      const p99Latency = this.calculatePercentile(this.metrics.latencies, 99);
      
      const report = {
        timestamp: new Date().toISOString(),
        config: this.config,
        summary: {
          protocol: this.config.protocol,
          duration: `${duration.toFixed(2)} seconds`,
          totalClients: this.config.numClients,
          successfulConnections: this.metrics.connections,
          disconnections: this.metrics.disconnections,
          totalMessages: this.metrics.messagesReceived,
          messagesPerSecond: duration > 0 ? (this.metrics.messagesReceived / duration).toFixed(2) : '0',
          messagesSent: this.metrics.messagesSent,
          errors: this.metrics.errors,
          successRate: this.config.numClients > 0 ? ((this.metrics.connections / this.config.numClients) * 100).toFixed(2) + '%' : '0%'
        },
        latency: {
          average: `${avgLatency.toFixed(2)} ms`,
          p95: `${p95Latency.toFixed(2)} ms`,
          p99: `${p99Latency.toFixed(2)} ms`,
          samples: this.metrics.latencies.length
        },
        clientMetrics: this.generateClientReport()
      };
      
      console.log('\n=== WebSocket Load Test Results ===');
      console.log(JSON.stringify(report, null, 2));
      
      // FIXED: Better file saving with error handling
      try {
        const reportDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const filename = `websocket-load-test-${Date.now()}.json`;
        const filepath = path.join(reportDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`📊 Report saved to: ${filepath}`);
        
      } catch (error) {
        console.error('Error saving report:', error);
      }
      
      return report;
      
    } catch (error) {
      console.error('Error generating report:', error);
      return null;
    }
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  generateClientReport() {
    const report = {
      totalMessagesPerClient: {},
      connectionStatus: {
        connected: 0,
        disconnected: 0
      },
      errorDistribution: {}
    };
    
    this.clients.forEach(({ metrics }) => {
      if (metrics.connected) {
        report.connectionStatus.connected++;
      } else {
        report.connectionStatus.disconnected++;
      }
      
      const messageRange = Math.floor(metrics.messages / 10) * 10;
      const rangeKey = `${messageRange}-${messageRange + 9}`;
      report.totalMessagesPerClient[rangeKey] = 
        (report.totalMessagesPerClient[rangeKey] || 0) + 1;
      
      if (metrics.errors > 0) {
        const errorKey = `${metrics.errors} errors`;
        report.errorDistribution[errorKey] = 
          (report.errorDistribution[errorKey] || 0) + 1;
      }
    });
    
    return report;
  }
}

// Artillery-style test configuration
const testScenarios = {
  smoke: {
    numClients: 10,
    rampUpTime: 5000,
    testDuration: 30000
  },
  load: {
    numClients: 100,
    rampUpTime: 30000,
    testDuration: 300000 // 5 minutes
  },
  stress: {
    numClients: 500,
    rampUpTime: 60000,
    testDuration: 600000 // 10 minutes
  },
  spike: {
    numClients: 200,
    rampUpTime: 5000, // Rapid ramp-up
    testDuration: 120000
  }
};

// ENHANCED: Better test runner with comprehensive error handling
async function runTest() {
  const scenario = process.argv[2] || 'smoke';
  const protocol = process.argv[3] || 'socketio'; // 'socketio' or 'websocket'
  const config = testScenarios[scenario];
  
  if (!config) {
    console.error(`❌ Unknown scenario: ${scenario}`);
    console.log(`Available scenarios: ${Object.keys(testScenarios).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`🚀 Running ${scenario} test with ${protocol} protocol...`);
  
  try {
    const testConfig = {
      url: process.env.WS_URL || 'http://localhost:3000',
      protocol: protocol,
      symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
      ...config
    };
    
    console.log('📋 Test configuration:', JSON.stringify(testConfig, null, 2));
    
    const test = new WebSocketLoadTest(testConfig);
    
    // FIXED: Verify instance creation
    console.log('✅ WebSocketLoadTest instance created successfully');
    
    const result = await test.run();
    
    console.log('🎉 Test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Export for use in other tests
module.exports = { WebSocketLoadTest, runTest, testScenarios };

// Run if called directly
if (require.main === module) {
  runTest();
}
