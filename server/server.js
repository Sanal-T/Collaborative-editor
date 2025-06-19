const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Document = require('./models/Document');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative-editor')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Store active users per document
const documentUsers = new Map();

// Helper function to generate user colors
const generateUserColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join document room
  socket.on('join-document', async (documentId, userData) => {
    socket.join(documentId);
    
    try {
      // Find or create document
      let document = await Document.findById(documentId);
      if (!document) {
        document = await Document.create({
          _id: documentId,
          data: { ops: [] }
        });
      }

      // Add user to document users
      if (!documentUsers.has(documentId)) {
        documentUsers.set(documentId, new Map());
      }
      
      const userColor = generateUserColor();
      const user = {
        id: socket.id,
        name: userData.name || 'Anonymous',
        color: userColor,
        cursor: null
      };
      
      documentUsers.get(documentId).set(socket.id, user);

      // Send document data to user
      socket.emit('load-document', document.data);
      
      // Broadcast user joined to others in the room
      socket.to(documentId).emit('user-joined', user);
      
      // Send current users list to the new user
      const currentUsers = Array.from(documentUsers.get(documentId).values());
      socket.emit('users-list', currentUsers);

    } catch (error) {
      console.error('Error joining document:', error);
      socket.emit('error', 'Failed to join document');
    }
  });

  // Handle document changes
  socket.on('send-changes', (documentId, delta) => {
    socket.to(documentId).emit('receive-changes', delta, socket.id);
  });

  // Save document
  socket.on('save-document', async (documentId, data) => {
    try {
      await Document.findByIdAndUpdate(documentId, {
        data: data,
        lastModified: new Date()
      });
    } catch (error) {
      console.error('Error saving document:', error);
    }
  });

  // Handle cursor position updates
  socket.on('cursor-position', (documentId, position) => {
    const users = documentUsers.get(documentId);
    if (users && users.has(socket.id)) {
      const user = users.get(socket.id);
      user.cursor = position;
      socket.to(documentId).emit('cursor-update', socket.id, position);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all documents
    for (const [documentId, users] of documentUsers.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(documentId).emit('user-left', socket.id);
        
        // Clean up empty document user maps
        if (users.size === 0) {
          documentUsers.delete(documentId);
        }
      }
    }
  });
});

// REST API endpoints
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await Document.find({}, 'title lastModified').sort({ lastModified: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const { title } = req.body;
    const document = await Document.create({
      _id: require('uuid').v4(),
      title: title || 'Untitled Document',
      data: { ops: [] }
    });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});