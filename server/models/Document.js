const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Untitled Document'
  },
  data: {
    type: Object,
    default: {}
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  collaborators: [{
    userId: String,
    name: String,
    color: String,
    lastSeen: Date
  }]
});

module.exports = mongoose.model('Document', documentSchema);