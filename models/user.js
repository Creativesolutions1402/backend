const { string } = require('joi');
const mongoose = require('mongoose');

const {Schema} = mongoose;

const userSchema = new Schema({
    name: {type: String},
    username: {type: String},
    email: {type: String},
    password: {type: String},
    role:{
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
      }
},
    {timestamps: true}
);

module.exports = mongoose.model('User', userSchema, 'users');