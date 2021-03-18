const express = require('express');
const router = express.Router();
const axios = require('axios');
const User =  require('../dbSchema.js').User;   


// Route to GET an existing user by userName.
router.get('/:userName', async (req, res) => {
    const username = req.params.userName;
    try {
        const user = await User.findOne({username: username});
        if (user) res.status(200).send({'userStatus': 'ok', 'pw' : user.password, 'userId': user._id.toString()});
        else      res.status(200).send({'userStatus': 'not found'});
    }
    catch (err){
        res.status(500).send('The database query produced an error!');
    }
});


// Insert new user with posted encrypted pword.
router.post('/:userName', async (req, res) => {
    const username = req.params.userName;
    const passwd = req.body.passwd;
    try {
        const count = await User.countDocuments({username: username}); 
        if (count === 0) {
            const user = new User({
                 username: username,
                 password: passwd,
                 devices: {}
            });
            await user.save()
            return res.status(200).send({userStatus: 'ok', userId: user._id});
        }
        else {
            res.status(200).send({userStatus: 'already exists'});
        }
      } 
      catch (err) {
        res.status(500).send('The database query produced an error!');
      }
});



// Get all user devices by userId.
router.get('/:userId/devices', async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await User.findById(userId);
        if (user) res.status(200).send({'devices': user.devices});
        else      res.status(200).send({'devices': {}});
    } catch (err) {
        res.status(500).send('The database query produced an error!');
    }
}); 


// Add/Remove user device (query param: ?action=<add/remove>)
router.get('/:userId/devices/:modelId/:deviceId', async (req,res) => {
    const userId = req.params.userId;
    const modelId = req.params.modelId;
    const deviceId = req.params.deviceId;
    const action = req.query.action;
    try {
        const user = await User.findById(userId);
        if (user) {
            const userDevices = JSON.parse(JSON.stringify(user.devices));

            if (action==='add'){
                if (!(modelId in userDevices)) userDevices[modelId] = [];
                if (!(userDevices[modelId].includes(deviceId))) userDevices[modelId].push(deviceId);
                await axios.post('http://flask-mqtt:80/subscribe', {user_id: userId, model_id: modelId, device_id: deviceId});
            }

            else if (action==='remove'){
                if (modelId in userDevices){
                    if (userDevices[modelId].includes(deviceId)){
                        userDevices[modelId].splice(userDevices[modelId].indexOf(deviceId), 1);
                    }
                    if (userDevices[modelId].length==0) delete userDevices[modelId];
                    await axios.post('http://flask-mqtt:80/unsubscribe', {user_id: userId, model_id: modelId, device_id: deviceId});
                }  
            }
            else {
                res.status(400).send('Bad request!');
            }
            
            user.devices = userDevices
            await user.save();
            res.status(200).send({'devices': user.devices});
        }
        else {
            res.status(400).send('Bad request!');
        }
    } catch (err){
        res.status(500).send('The database query produced an error!');
    }
});



module.exports = router;