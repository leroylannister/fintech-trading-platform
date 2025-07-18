// frontend/js/websocket.js
class WebSocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.subscribers = new Map();
  }

  connect(token) {
    // Use the same origin as the page or specify the backend URL
    const wsUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000'
      : `http://${window.location.hostname}:3000`;
    
    console.log('Connecting to WebSocket at:', wsUrl);
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.connected = true;
      
      // Authenticate if token provided
      if (token) {
        this.socket.emit('authenticate', token);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      console.error('Error type:', error.type);
    });

    this.socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
      this.subscribeToMarketData(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']);
    });

    this.socket.on('market-update', (data) => {
      this.handleMarketUpdate(data);
    });

    this.socket.on('order-update', (data) => {
      this.handleOrderUpdate(data);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      this.connected = false;
    });
  }

  subscribeToMarketData(symbols) {
    if (this.socket && this.connected) {
      this.socket.emit('subscribe-market', symbols);
    }
  }

  handleMarketUpdate(data) {
    // Update UI with real-time price
    const priceElement = document.querySelector(`[data-symbol="${data.symbol}"] .stock-price`);
    if (priceElement) {
      priceElement.textContent = `$${data.price.toFixed(2)}`;
      
      // Add flash effect
      priceElement.classList.add('price-flash');
      setTimeout(() => priceElement.classList.remove('price-flash'), 500);
    }
  }

  handleOrderUpdate(data) {
    // Show notification
    showNotification(`Order ${data.status}: ${data.symbol} x${data.quantity}`);
    
    // Refresh portfolio
    loadPortfolio();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Make sure to initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize WebSocket client globally
  window.wsClient = new WebSocketClient();
  
  // Connect if we have a token
  if (typeof authToken !== 'undefined' && authToken) {
    window.wsClient.connect(authToken);
  }
});