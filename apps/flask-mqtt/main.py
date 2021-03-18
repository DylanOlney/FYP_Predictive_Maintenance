
# -*- coding: utf-8 -*-
"""
Created on Tue Jun 25 10:37:07 2020

@author: D.Olney

This script runs a 'Flask' API server which also acts as an MQTT client.
Incoming, MQTT topic payloads are stored to a MongoBD database collection. 
The most recent payload for a device is also stored in memeory in a gloabal
dictionary for efficiency for when this client is being polled for data in real-time.
The API routes enable clients to do the following: 
    1. Subscribe/unsubscribe to a device topic.
    2. Get all published payloads for a device topic.
    3. Get only the most recent payload for a device topic.
    4. To do: Perform predictive mainteneance machine learning inferences on a dvice.
  
    
    
"""



from flask import Flask, send_from_directory, request, abort, Response, render_template, g, jsonify
from flask.json import JSONEncoder
from flask_mqtt import Mqtt
from flask_cors import CORS
from benedict import benedict
import traceback
import threading
import json
import pymongo
from bson import json_util
import time
import pandas as pd
import pickle
import os

# define a custom encoder point to the json_util provided by pymongo (or its dependency bson)
class CustomJSONEncoder(JSONEncoder):
    def default(self, obj): return json_util.default(obj)

# A global 'benedict' dictionary for storing the latest messages
# in memory. This saves having to go to the database when clients are polling.
globalDict = benedict()
globalDict.keypath_separator = '/'
globalDict['initTime'] = time.time()
waitFlag = False

global modelIDs 
modelIDs = ['NasaTurbofan']
global models 
models = {}

#mongo = pymongo.MongoClient("mongodb://mongo:27017/", username='root', password='root')
#deviceCollection = None

app = Flask(__name__)
app.json_encoder = CustomJSONEncoder
CORS(app)
app.config['MQTT_BROKER_URL'] = 'mqtt-broker'
app.config['MQTT_BROKER_PORT'] = 1883
app.config['MQTT_USERNAME'] = ''
app.config['MQTT_PASSWORD'] = ''
app.config['MQTT_KEEPALIVE'] = 5
app.config['MQTT_TLS_ENABLED'] = False
app.config['MQTT_REFRESH_TIME'] = 0.5  # refresh time in seconds
mqtt = Mqtt(app)

mongo = None


@app.route('/models/<filename>')
def showFile(filename):
   try:
        return send_from_directory('models', filename)
   except:
        return send_from_directory('models', 'default.txt')



# A function to open MongoDB connection and return a ref to the 'device_data' collection.
def get_device_collection():
    global mongo
    mongo = pymongo.MongoClient("mongodb://mongo:27017/", username='root', password='root')
    col = mongo['pred_maintenance']['device_data']
    col.create_index([('time', pymongo.DESCENDING)], unique=True)
    return col
   
 
# A function to close MongoDB connection.
def mongo_close():
    global mongo
    if mongo is not None:
        mongo.close()
        mongo = None
    
# A function to get the 'device_data' collection once MongoDB is open.
#def getDeviceCollection():
#    global mongo
#    deviceCollection = mongo["pred_maintenance"]["device_data"]
#    deviceCollection.create_index([('time', pymongo.DESCENDING)], unique=True)
#    return deviceCollection


# Celled when this client connects to the MQTT broker.
@mqtt.on_connect()
def handle_connect(client, userdata, flags, rc):
    print  ("\n********************************* Tickedy Boo! Connected to broker! Ready to receive subscriptions...")
    #mqtt.subscribe('#')
    
    
# A route for clients to subscribe to a device topic.
@app.route("/subscribe", methods= ["POST"])
def subscribe():
    try:
        t = dict(request.get_json(force = True))
        topic = "" + t['user_id'] + "/" + t['model_id'] +"/" + t["device_id"] 
        mqtt.subscribe(topic)
        print("Subscribed to topic: " + topic)
        return {}, 200
    except Exception as e:
        print("There was an error subscribing!")
        print(e)
        return {}, 500


# A route for clients to un-subscribe from a device topic.
@app.route("/unsubscribe", methods= ["POST"])
def unsubscribe():
    try:
        t = dict(request.get_json(force = True))
        topic = "" + t['user_id'] + "/" + t['model_id'] +"/" + t["device_id"] 
        mqtt.unsubscribe(topic)
        print("Unsubscribed from topic: " + topic)
        return {}, 200
    except Exception as e:
        print("There was an error unsubscribing!")
        print(e)
        return {}, 500


  

   
# MQTT message handler. It gets called when a message is published for
# a subscribed device topic. The message payload is expected to be a JSON string
# containing the device's variable names as keys and it's variable values as values.
# The message's payload gets stored in the database and also temporarily in memory
# in a global dictionary.
@mqtt.on_message()
def handle_mqtt_message(client, userdata, message):
    #lock.acquire() 
    global globalDict
    global waitFlag
   
    waitFlag = True
    try:
            topic = message.topic 
            payload = message.payload.decode()
            nodes = topic.split("/")
            
            # Store the latest message as a dictionary in memory so that we
            # don't need to go to the database to get it when the client is polling.
            payloadDict = dict()
            payloadDict["time"] = round(time.time(),3)
            payloadDict['values'] = json.loads(payload)#["values"]
            msgDict = benedict()
            msgDict.keypath_separator = '/'
            msgDict[topic] = payloadDict
            globalDict.merge(msgDict)
            
            # Also create a record of the message in the database.
            user_id = nodes[0]
            model_id = nodes[1]
            device_id = nodes[2]
            storeMessage(user_id, model_id ,device_id, payloadDict)
            
    except Exception as e:
            print(type(e),e)
    finally:
        waitFlag = False
        mongo_close()
           


          
# Helper method for above. Creates a record of the latest message in the database.           
def storeMessage(user_id, model_id ,device_id, payload):
        doc = {"user_id": user_id, "model_id": model_id,"device_id": device_id}
        doc["values"] = payload["values"]
        doc["time"] =   payload["time"]
        col = get_device_collection()
        col.update(doc, doc, upsert = True)
       
    
 
#=============================================================================
@app.route('/getDeviceHistory', methods = ["POST"])
def getDeviceHistory():
    #mongo_open()
    try:        
        # Creating a dictionary from the JSON object sent.
        device = dict(request.get_json(force = True))
      
        # Extracting the device description data from the dictionary above.
        user_id   = device['user_id'] 
        model_id  = device['model_id']
        device_id = device['device_id']
        qty       = int(device['limit'])
        
        # Fetching 'qty' no of entries in the db matching the query and returning them 
        # as a list in order of most recent. (If qty == 0, all entries are returned).
        query = {"user_id": user_id, "model_id": model_id , "device_id": device_id}
        #res = getDeviceCollection().find(query, sort=[('time', pymongo.DESCENDING)], limit=qty)
        pipeline = [{"$match": query}, {"$sort": {"time": pymongo.DESCENDING}}]
        if (qty > 0):
            pipeline.append( {"$limit" : qty})
        res = list(get_device_collection().aggregate(pipeline))
        for device in res:
            del device['_id']
        return {'deviceHistory':list(res)}, 200    

    except Exception as e:
        print (type(e),e)
        return {}, 500
    finally:
        mongo_close()
#=============================================================================



# Clients call this route at regular intervals when polling for a device's
# most recent message payload. The most recent payload is stored in memory 
# (in a global dictionary) for efficiency. This saves a lot of uneccessary 
# fetches from the database when many clients may be polling at the same time.
# If no data has been published since this MQTT client instance started up, 
# then the database is checked, and the latest payload is returned from there
# if it exists. 
@app.route('/getMostRecent', methods = ["POST"])
def getMostRecent():
   
    global globalDict
    PdM = False
    result = {}

    # If the message handler function is in the middle of updating the global dictionary, 
    # wait until it has done so before trying to access it.
    while waitFlag == True:
        pass

   
    try: 
        # Creating a dictionary from the JSON object sent.
        postDict = dict(request.get_json(force = True))
        
        # Extracting the device description data from the dictionary above.
        user_id  = postDict['user_id'] 
        model_id = postDict['model_id']
        device_id  = postDict['device_id']
        if postDict['PdM']:
            if postDict['PdM'] =='ON':
                PdM = True
        
        # Getting the latest message for the topic from memory.
        keyPath = user_id + "/" + model_id + "/" + device_id
        if keyPath in globalDict.keypaths():
            result = {'result':globalDict[keyPath]}
        else:
            print ("keypath not found!")
            # If no data has been published since this MQTT client instance started up, then check the 
            # database for the latest message, and return that (also merging it to the global dict) if it exists.
            #mongo_open()
            query = {"user_id": user_id, "model_id": model_id , "device_id": device_id}
            res = get_device_collection().find(query, sort=[('time', pymongo.DESCENDING)]).limit(1)
            rtn = list(res)
            if len(rtn) > 0:
                rtn = rtn[0]
                values = rtn['values']
                time =   rtn['time']
                rtn = {'values': values, 'time': time}
                msgDict = benedict()
                msgDict.keypath_separator = '/'
                msgDict[keyPath] = rtn
                globalDict.merge(msgDict)
                result =  {'result': rtn} 
            else:
                result = {'result':'no data'}
        
        if PdM == True and result['result'] != 'no data':
                inference = getInference(model_id, result['result'])
                result['inference'] = inference
        else:
            result['inference'] = -99
        
        return result, 200

       
    except Exception as e:
        print (type(e),e)
        return {'result':'error'} , 500
    finally:
        mongo_close()


def getInference(model_id, data):
    # Because each type of model will require a different trained ML model and different set of data pre-processing steps, 
    # there will be an if-statement for each type to perform the model-specific tasks in getting the inference. 
    # Here, only the 'NasaTurbofan' type has been implemented.
    #print(json.dumps(data['values'], indent = 1))
    global models
    inference = -1
    
    if model_id == 'NasaTurbofan':
        data = pd.Series(data['values'])    # Convert dict to pd series
       
        # drop unneccessary columns and  convert to numpy array:
        data.drop(["cycle","op3","sensor1","sensor5","sensor6","sensor10","sensor16","sensor18","sensor19"],  inplace = True)
        data = data.to_numpy(dtype=float)    
        data = data.reshape(1, -1) 
        
        # load trained model for NasaTurbofan
        if model_id not in models:
            modelFile = 'models/' + model_id + '.sav'
            models[model_id] = pickle.load(open(modelFile,'rb'))

        # do prediction / get inference.
        inference = models[model_id].predict(data)[0]    

    return int(inference)


            
            

@app.route("/testroute", methods = ["GET"])
def test():
    rtn = "------------------------>>>> Test route called!"
    print(rtn)
    return rtn


    
    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
    
