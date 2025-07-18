// backend/src/services/websocketService.js
const socketIO = require('socket.io');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connections = new Map();
  }

  initialize(server) {
    const { Server } = require('socket.io');
    this.io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:8080",
                "http://localhost:3001", 
                "http://192.168.64.1:8080",  // Add your IP address
                "http://127.0.0.1:8080",      // Add loopback
                "*"  // Or temporarily allow all origins for testing
            ],
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"]
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling'] // Explicitly set transports
    });
    this.setupEventHandlers();
    console.log('WebSocket service initialized with CORS for:', this.io.opts.cors.origin);
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Handle authentication
      socket.on('authenticate', async (token) => {
        try {
          const userId = await this.verifyToken(token);
          this.connections.set(userId, socket.id);
          socket.userId = userId;
          socket.join(`user-${userId}`);
          socket.emit('authenticated', { userId });
        } catch (error) {
          socket.emit('auth-error', { message: 'Invalid token' });
        }
      });

      // Subscribe to market data
      socket.on('subscribe-market', (symbols) => {
        symbols.forEach(symbol => {
          socket.join(`market-${symbol}`);
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connections.delete(socket.userId);
        }
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Broadcast market updates
  broadcastMarketUpdate(symbol, data) {
    this.io.to(`market-${symbol}`).emit('market-update', {
      symbol,
      price: data.price,
      timestamp: new Date().toISOString()
    });
  }

  // Send order updates to specific user
  sendOrderUpdate(userId, orderData) {
    this.io.to(`user-${userId}`).emit('order-update', orderData);
  }

  // Broadcast to all connected clients
  broadcastSystemMessage(message) {
    this.io.emit('system-message', message);
  }
}

module.exports = new WebSocketService();