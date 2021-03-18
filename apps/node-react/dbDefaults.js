
const mongoose = require('mongoose');
const Model = require('./dbSchema.js').Model;
const User =  require('./dbSchema.js').User;



const models = [
    {
        model_id: "NasaTurbofan",
        vars: ["cycle","op1","op2","op3","sensor1","sensor2","sensor3","sensor4",
            "sensor5","sensor6","sensor7","sensor8","sensor9","sensor10","sensor11",
            "sensor12","sensor13","sensor14","sensor15","sensor16","sensor17",
            "sensor18","sensor19","sensor20","sensor21","sensor22","sensor23"]
    }
]

const users = [
    {
        username : 'DylanOlney',
        password : '$2a$10$xULnFRzv/dBZklIrTHdn2OXU8lJO4CgzI8fY8fsJFkdYkF5mco/aa',
        devices  : {
            NasaTurbofan: [
                'f91'
            ]
        }
    }
]



const populate = () => {

    mongoose.connection.db.listCollections({name: 'models'})
    .next( async (err, coll) => {
            if (!coll) {
                var promises = [];  
                models.forEach((model)=>{ promises.push( new Model(model).save());});
                await Promise.all(promises); 
             }
        }
    );

    mongoose.connection.db.listCollections({name: 'users'})
    .next( async (err, coll) => {
            if (!coll) {
                var promises = [];  
                users.forEach((user)=>{ promises.push( new User(user).save());});
                await Promise.all(promises); 
             }
        }
    );

}

module.exports = {
    populate
}
