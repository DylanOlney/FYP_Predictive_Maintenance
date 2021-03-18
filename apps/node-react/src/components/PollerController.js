

import React, { Component } from 'react';
//import PilzToggleSwitch from '@pilz/react-common-components/PilzToggleSwitch';
import Toggle from 'react-toggle'
import { post } from 'axios';
import App from '../App';
//import ApiFactory from "../../../../api/ApiFactory";






// ==================================================================================
// This component controls the live monitoring of the currently loaded asset and warns
// the user if inferences on the live data coming in, suggest asset failure in the near 
// future. Live monitoring is acheived by means of a worker thread which polls the server.
// (see below)
// ==================================================================================


class PollerController extends Component {
   
  
  
  constructor(props){
    super(props)
    this.worker = null;
    this.state = {ON: false}
  }

  componentDidMount = () => {this.initWorker();}

  // ==================================================================================
  // Initializes the worker thread & it's listener. The worker gets the latest message 
  // posted to the broker by means of regular polling. The listener then converts the 
  // message data to a single-line CSV-type file and posts it back to the server to get 
  // an inference. 
  // ==================================================================================
  initWorker = () => {
    this.worker = new Worker("workerFile.js");
    this.worker.addEventListener('message', (e) => {
      
        var [file, text] = this.convertMessage(JSON.parse(e.data));

        console.log("Text:" + text);
       
        this.postFile(file, "/api_post/getInference") // /api_post/getInference

        // Callback function of post.....
        .then((response) => {
            // If error
           
            if (response.data==='error'){ throw new Error("Error"); }  // Jump to the catch block below...

           
            var resp = JSON.parse(JSON.stringify(response.data))
            var classifier = resp.classes[0];
            this.props.callBack(text + "," +  classifier, this.stop);
        }).catch((e) => {alert("error!")});

    }, false)
  }


  //============================================================================================
  // This function converts latest message data (in JSON) to a coma separated row of data.
  // It also returns a text file object containing this row so it can be posted to the server
  // to get an inference.
  // ===========================================================================================
  convertMessage = (data) => {
    var textLines = [];
    var snapshot = data;
    var key = Object.keys(snapshot)[0];
    var model = Object.values(snapshot[key])[0];
    
     var id = Object.keys(model)[0]
    
     var dataRow = model[id]
     var textLine = "";
     textLine += id ;
     for (var prop in dataRow){
         textLine += (',' + dataRow[prop]) ;
     }
     console.log(textLine);
     textLines.push(textLine.trim());

    
    return [new File(textLines, "data.txt", { type: "text/plain" }), textLines[0].trim()];
  }
  //===========================================================================================



  //==========================================================================================
  // Helper function. Posts a file to given url.
  // =========================================================================================
  postFile(file, url) {
    const formData = new FormData();
    formData.append('file', file)
    const config = { headers: { 'content-type': 'multipart/form-data' } }
    return post(url, formData, config)
  }
  
  //========================================================================================



  // ============================================================================================================
  // Starts/resumes the worker thread polling the server.
  // An XML description of the current MQTT asset model 
  // is posted so that the server knows which message to return.
  // ============================================================================================================
  start = () => {

    // Creating an structure from the currently loaded asset model.
    var assetModel = this.props.app.state.assetModel;
    //var contents =  o2x(obj);

    console.log("------------>===" + JSON.stringify(assetModel));
    this.worker.postMessage(assetModel);
    this.props.app.setState({
      isPolling: true
    });
    this.setState({ON: true})
  }
  //================================================================================================================
  
  
  //==========================================================
  // Halts the polling...
  //==========================================================
  stop = () => {
    this.worker.postMessage('stopPolling');
    this.props.app.setState({
      tree: {"topicData": {}},
      isPolling: false
    });
    this.setState({ON: false});
  }


  //============================================
  // Toggles ON/OFF state of the switch.
  //============================================
  handleToggle =  () => {
    if (this.state.ON) {
      this.stop(); 
      this.props.show(false);
    }
    else {
      this.start();
      this.props.show(true);
    } 
  };

  
  // Rendering the ON/OFF switch.
  render() {
      return (
        <div>
            <br/><br/>
                <span>OFF - <Toggle          
                 defaultChecked={this.state.ON} 
                 icons={false}
                 onChange={this.handleToggle} 
                 /> - ON</span>
         </div>
     )
    }
  }

  

  export default PollerController;