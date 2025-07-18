// backend/src/services/websocketMetrics.js
class WebSocketMetrics {
  constructor() {
    this.metrics = {
      connections: 0,
      messages_sent: 0,
      messages_received: 0,
      errors: 0
    };
  }

  incrementConnections() {
    this.metrics.connections++;
  }

  decrementConnections() {
    this.metrics.connections--;
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }
}