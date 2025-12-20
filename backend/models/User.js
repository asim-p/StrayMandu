const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true
},
  password: { 
    type: String, 
    required: true,
    minlength: 6,
},
  name: { 
    type: String ,
    required: true
},
  phone: { 
    type: String
},
  user_type: { 
    type: String, 
    enum: ['volunteer', 'organization'], 
    default: 'volunteer' 
},
  profile_photo: { 
    type: String 
},
  created_date: { 
    type: Date, 
    default: Date.now 
}
});


module.exports = mongoose.model('User', userSchema);
