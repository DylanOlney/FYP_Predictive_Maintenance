# -*- coding: utf-8 -*-
"""
Created on Tue Feb 18 10:37:07 2020

@author: d.olney
"""

import time
import paho.mqtt.client as mqtt
import json
def main():
    client = mqtt.Client("client")
    #client.connect('165.22.112.131', 1883)
    client.connect('127.0.0.1', 1883)
    file = open("f91.txt", 'r')
  
    user_id ="602b1ac86e61b66332040b52"  #"5f4e64e72023721e086f4c95" 
    model_id = "test" #"NasaTurbofan"
    
    for line in file.readlines():
            time.sleep(1)
            line = line.strip()
            data = line.split(',')
            
           
            device_id = "f" + data[0]

            #deviceDict = dict()
            varsDict = dict()

            varsDict["cycle"] = int(data[1])
            varsDict["op1"] = float(data[2])
            varsDict["op2"] = float(data[3])
            varsDict["op3"] = float(data[4])
            varsDict["sensor1"] = float(data[5])
            varsDict["sensor2"] = float(data[6])
            varsDict["sensor3"] = float(data[7])
            varsDict["sensor4"] = float(data[8])
            varsDict["sensor5"] = float(data[9])
            varsDict["sensor6"] = float(data[10])
            varsDict["sensor7"] = float(data[11])
            varsDict["sensor8"] = float(data[12])
            varsDict["sensor9"] = float(data[13])
            varsDict["sensor10"] = float(data[14])
            varsDict["sensor11"] = float(data[15])
            varsDict["sensor12"] = float(data[16])
            varsDict["sensor13"] = float(data[17])
            varsDict["sensor14"] = float(data[18])
            varsDict["sensor15"] = float(data[19])
            varsDict["sensor16"] = float(data[20])
            varsDict["sensor17"] = float(data[21])
            varsDict["sensor18"] = float(data[22])
            varsDict["sensor19"] = float(data[23])
            varsDict["sensor20"] = float(data[24])
            varsDict["sensor21"] = float(data[25])
           

            #deviceDict['values'] = varsDict
            #deviceDict['time'] = round(time.time(),3)

            payload = json.dumps(varsDict, indent = 2)
            client.publish(user_id +  "/" + model_id + "/" + device_id , payload )
            print("Published to topic: " + user_id + '/' + model_id + '/' + device_id)
            print("Payload JSON:-")
            print(payload + '\n')
            
            
    client.disconnect()
        
   
    
main()
