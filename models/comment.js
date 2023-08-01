const mongoose = require('mongoose');

const {Schema} = mongoose;

const commentSchema = new Schema({
    content: {type: String, required: true},
    task: {type: mongoose.SchemaTypes.ObjectId, ref: 'Task'},
    user: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'}
},
    {timestamps: true}
);

module.exports = mongoose.model('Comment', commentSchema, 'comments');