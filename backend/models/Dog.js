const mongoose = require('mongoose');

const dogSchema = new mongoose.Schema({
  name: { 
    type: String, 
    trim: true,
    default: "Unknown"
},
  color: { 
    type: String, 
    required: [true, "Color is required"]
},
  breed: {
    type: String,
    default: "Unknown"
  },
  location: {
    type: String,
    required: [true, "Location is required"]
  },
  dateTime: {
    type: Date,
    default: Date.now
  },
  condition: {
    type: String,
    enum: ["injured", "aggressive", "neutral", "healthy", "unknown"],
    default: "neutral"
  },
  characteristics: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    maxlength: 500
  },
  image: {
    type: String,
    default: "https://placehold.co/600x400?text=No+Image"
  }
}, { timestamps: true });

module.exports = mongoose.model('Dog', dogSchema);

