const express = require('express');
const router = express.Router();
const Model = require('../dbSchema.js').Model;   


// Route to GET all model names in DB.
router.get('/getModelNames', async (req, res) => {
   try {
     const models = await Model.find();
     modelNames = [];
     models.forEach( model => {modelNames.push(model.model_id)});
     res.status(200).send({'modelNames': modelNames});
    } catch (err) {
        res.status(500).send('The database query produced an error!');
    }
});


// Get a specific model by it's name/id.
router.get('/:model_id', async (req, res) => {
        const model_id = req.params.model_id; 
        try {
            const model = await Model.findOne({model_id: model_id});   
            if  (model === null)  return res.status(200).send({msg: 'model not found'}); 
            res.status(200).send({msg: 'model found', model: model});
        }
        catch (err) {
            res.status(500).send('The database query produced an error!');
        }
});

// Add a new model (vars & filename are in req.body)
router.post('/:model_id', async (req, res) => {
        const model_id = req.params.model_id;
        const vars = req.body.vars;
        const fileName = req.body.fileName;
        try {
                const count = await Model.countDocuments({model_id: model_id}); 
                if (count === 0) {
                        const model = new Model({
                                model_id: model_id,
                                fileName: fileName,
                                vars: vars
                        });
                        await model.save()
                        return res.status(200).send({msg: 'model saved'});
                }
                else {
                        res.status(200).send({msg: 'already exists'});  
                }
        }
        catch (err) {
             res.status(500).send('The database query produced an error!');
        }
});

// Deletes a model by name/id.
router.delete('/:model_id', async (req, res) => {
        const model_id = req.params.model_id;
        try {
                const count = await Model.countDocuments({model_id: model_id}); 
                if (count === 0) {
                        return res.status(200).send({msg: 'model not found'});
                }
                else {
                        await Model.findOneAndDelete({model_id: model_id});
                        res.status(200).send({msg: 'model deleted'});  
                }
        }
        catch (err) {
             res.status(500).send('The database query produced an error!');
        }
});

module.exports =  router ;