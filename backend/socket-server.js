const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
require('dotenv').config();

const sequelize = require('./src/config/database');
const setupSocketHandlers = require('./src/socket/socketHandlers');

const SOCKET_PORT = process.env.SOCKET_PORT || 5001;

// Create HTTP server for Socket.io
const httpServer = http.createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Setup handlers
setupSocketHandlers(io);

// Database connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
    
    httpServer.listen(SOCKET_PORT, () => {
      console.log(`🔌 Socket.io server running on port ${SOCKET_PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

module.exports = io;
