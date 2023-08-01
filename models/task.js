const { string } = require('joi');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskSchema = new Schema({
    applicant_name: { type: String, required: true },
    fathername: { type: String },
    cnic: { type: String },
    cell: { type: String },
    email: { type: String },
    complaint: { type: String, required: true },
    letter: { type: String },
    file: { type: String, required: true },
    due: { type: Date, required: true },
    assigneduser: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    refile: { type: String },
    phase: { type: String, required: true }
},
    { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema, 'tasks');