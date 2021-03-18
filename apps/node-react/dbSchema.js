const mongoose = require('mongoose');

// Defining a schema / db model for models.
const modelSchema = mongoose.Schema({
    model_id:         {type: String, default: null},
    fileName:         {type: String, default: null},
    vars:             [{type: String, default: null}]
},{minimize: false});


// Defining a schema / db model for user.
const userSchema = mongoose.Schema({
    username: String,
    password: String,
    devices: {}
},{minimize: false});

const User = mongoose.model('User', userSchema);
const Model = mongoose.model('Model', modelSchema);

module.exports = {
    User, Model
}