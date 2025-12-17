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
  // --- CHANGED SECTION START ---
  location: {
    type: {
      type: String, 
      enum: ['Point'], // 'location.type' must be 'Point'
      default: 'Point'
    },
    coordinates: {
      type: [Number], // Format: [longitude, latitude]
      required: [true, "Coordinates are required"]
    }
  },
  // --- CHANGED SECTION END ---
  dateTime: {
    type: Date,
    default: Date.now
  },
  condition: {
    type: String,
    enum: ["injured", "aggressive", "neutral", "healthy", "unknown"],
    default: "unknown"
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

// Create a geospatial index to enable proximity searches (e.g., "Find dogs near me")
dogSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Dog', dogSchema);