
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
//const populate = require('./dbDefaults.js').populate;

const app = express();


// Middleware, including api routes.
app.use(express.json());
app.use('/api/users', require('./api_routes/users'));
app.use('/api/models', require('./api_routes/models'));
app.use(express.static(path.join(__dirname, 'build')));


// Serve the static React app build.
app.get('*', (req, res)=> {
    // If the React app's workerfile is requested, return that.
    if (req.path==='/live_monitoring/workerFile.js'){
        return res.sendFile(path.join(__dirname, 'build', 'workerFile.js'))
    }
    // ..else return the React app's static index.html file.
    if ((!req.path.includes('/api/users/')) && (!req.path.includes('/flask/'))){
        res.sendFile(path.join(__dirname, 'build', 'index.html'))
    }
});


// Function to set up Mongoose connection with authentication settings, etc.
const dbConnect = async () => {
    const dbName = "pred_maintenance";
    const dbSettings = {
        auth: { authSource: "admin" }, 
        user: 'root', 
        pass:'root',   
        useNewUrlParser: true, 
        useUnifiedTopology: true
    };
    var connection = null;
    while (connection == null) {
        try{
            await mongoose.connect(`mongodb://mongo:27017/${dbName}`, dbSettings);
            console.log(`Mongoose connection established to database: "${dbName}"`);
            connection = mongoose.connection;
        }
        catch(err){
            console.log('Mongoose connection failed! Retrying....');
            connection = null;
        }
    }
    require('./dbDefaults.js').populate();
}


// Start server on port 80.
const PORT = 80;
app.listen(PORT, async() => {
    console.log(`Node/Express server running on port ${PORT}`)
    await dbConnect();
});
