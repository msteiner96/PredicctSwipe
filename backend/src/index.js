import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import http from 'http';
import marketAutomation from './services/marketAutomation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api/markets', async (req, res) => {
  try {
    // TODO: Fetch from blockchain
    res.json({
      success: true,
      markets: [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/markets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Fetch specific market
    res.json({
      success: true,
      market: null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/markets', async (req, res) => {
  try {
    const { question, category, duration, metadata } = req.body;
    // TODO: Create market on blockchain
    res.json({
      success: true,
      marketId: Date.now(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    // TODO: Fetch leaderboard from database
    res.json({
      success: true,
      leaderboard: [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Automation stats endpoint
app.get('/api/automation/stats', (req, res) => {
  try {
    const stats = marketAutomation.getStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manually trigger automation run
app.post('/api/automation/run', async (req, res) => {
  try {
    // Run in background
    marketAutomation.run();
    res.json({
      success: true,
      message: 'Automation run triggered',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  // Send initial connection message
  ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
});

// Broadcast function for real-time updates
export const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
};

server.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 http://localhost:${PORT}`);

  // Start market automation service
  if (process.env.ENABLE_AUTOMATION !== 'false') {
    marketAutomation.start();
  } else {
    console.log('⏸️  Market automation disabled (ENABLE_AUTOMATION=false)');
  }
});
