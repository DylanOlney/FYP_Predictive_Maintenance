import React,  { Component }  from 'react';
import { withRouter } from 'react-router-dom';
import '../App.css';
import MessageDialog from './dialogs/MessageDialog';
import { post } from 'axios';
import LiveChart from './LiveChart';
import './css/DeviceHistory.css';
import VarChecklist from './VarChecklist';
import PdMComponent from './PdMComponent';
import CircularProgress from '@material-ui/core/CircularProgress';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Scroll from 'react-scroll';
const Element  = Scroll.Element;
const scroller = Scroll.scroller;



/* ============================================================================================================
This class component diplays the latest message data for a given device by means of live polling.
It is assigned a route in the app's BrowserRouter and has a temporary link in the main navigation bar.
It initializes a worker thread which polls the MQTT client at regular intervals and passes the latest data for 
the device back via an event listener in this class. The data for each of the device's variables may then displayed 
in a real-time chart which updates with every poll. A checklist on the left sidebar enables usersto select which 
of the charts to view at any given time.
==============================================================================================================*/ 

class LiveMonitoring extends Component {
  
  constructor(props) {
    super(props);

    this.app = this.props.app;

    // Create 'device' object from the URL parameters sent from the calling page.
    var user_id = this.app.getUser().userId;
    var params = new URLSearchParams(window.location.search);
    this.device = {
          user_id:   user_id, 
          model_id:  params.get('model_id'), 
          device_id: params.get('device_id'), 
          vars:[],
          PdM: 'OFF'
    };

    // More class attributes.
    this.worker = null;
    this.charts = [];
    this.messageData = {};
    this.PdMDetails = "";
    // Initializing state.
    this.state = {
      showNoDataMsg : false,
      lastChecked: null,
      checkedVars: {},    // Used to store which of the device's variables are checked for displaying as charts.
      checkChanged: false,
      PdM: false
    }
  }

  // When the component mounts, start the worker theread (see below).
  componentDidMount = () => this.startPollingThread();
  

  handlePdMState = (PdM_on) => {
     if (PdM_on == true) this.device['PdM'] = 'ON';
     else this.device['PdM'] = 'OFF';
     this.stopPollingThread();
     this.startPollingThread();
     this.setState({PdM: PdM_on});
  }
  
  // Starts a worker thread which regularly polls the MQTT client for the latest MQTT message from the device.
  // It passes in the data as JSON via the event listener below.
  startPollingThread = () => {
    this.worker = new Worker("workerFile.js");
    this.worker.addEventListener('message', this.onWorkerEvent); 
    this.worker.postMessage(this.device);
  }

  stopPollingThread = () => {
     this.worker.postMessage('stopPolling');
     this.worker.removeEventListener("message", this.onWorkerEvent); 
  }

  // Stop the worker thread when the component unmounts (user leaves page).
  componentWillUnmount = () =>{
    this.stopPollingThread();
    this.app.removeTempNavLink(); 
  }


  // This is the event handler for the worker thread which receives the latest message from the device.
  onWorkerEvent = (response) => {
    
    // The 'response' here is a worker message object whose 'data' property 
    // contains the XMLHttpRequest response text sent back from flask-mqtt server.

    var responseObj = JSON.parse(response.data);
    var result = responseObj.result;
    var inference = -99;
    inference = responseObj.inference;
    console.log(JSON.stringify(responseObj));
    if (result == 'error') {
      alert('Server error!');
      return;
    }

    if (result == 'no data' ) {
      console.log(result);
      this.setState({showNoDataMsg: true});
      return;
    }
    console.log(inference)
    if (inference == 0)       this.PdMDetails = {severity: 'success', title: 'OK!', message: 'This device is in good health. No maintenance is required at present.'};
    else if (inference == 1)  this.PdMDetails = {severity: 'warning', title: 'Warning!', message: 'This device is beginning to show critical signs of wear. Halt operation immediatlely and perform corrective maintenance before failure occurs.'};
    else if (inference == -1) this.PdMDetails = {severity: 'info', title: 'No model!', message: 'There is no trained ML model associated with this type of device yet.'};
    else this.PdMDetails = null;


    // Otherwise, get the device var names from the result (for the checklist, etc.)...
    this.messageData =  result.values;
    this.device.vars = Object.keys(this.messageData).sort(this.sortAlphaNum);

    //.. and update the chart display according to which device vars were selected in the ckecklist.
    this.updateCharts(this.state.checkedVars); // See function below.
    this.forceUpdate();
  }
   

  // Called by the VarChecklist component when a checkbox in the checklist has changed state.
  checkListCallBack=(vars, lastChecked)=>{
    if (lastChecked === undefined) lastChecked = null;   // A record of the last checked box.
    this.updateCharts(vars)  // see funtion below.
    // Set the state according to the checklist state.
    this.setState({
      lastChecked: lastChecked,
      checkedVars: vars,
      checkChanged: true
    });
  } 


  // This function creates a chart from the message data for each variable that has 
  // been selected from the sidebar. The charts are kept in the array, 'this.charts'.
  // It is called on every valid response from the polling worker thread, and also
  // when the checklist state has changed.
  updateCharts = (checkedVars) => {
    this.charts = [];
    if (Object.keys(this.messageData).length > 0) {
      var charts = Object.keys(checkedVars).map((key, idx)=>{
          if (checkedVars[key] === true)  {
             var data = {};
             data[key] = this.messageData[key];
             var chart = (<Element name={key} key = {idx}><LiveChart  field = {[key]} data = {data}/></Element>);
             return chart;
          }
         });
         charts.map((chart)=>{
           if (chart!==null) this.charts.push(chart);
         });
      }
  }


  // This block takes care of scrolling to the selected chart.
  componentDidUpdate = () => {
    if (this.state.lastChecked != null && this.state.checkChanged == true){
      console.log("last checked: " + this.state.lastChecked);
      console.log(JSON.stringify(this.state.checkedVars));
      scroller.scrollTo(this.state.lastChecked, {
        duration: 1500,
        delay: 0,
        smooth: true,
        containerId: 'charts-container'
      });
      this.setState({checkChanged: false})
    }
  }


  /* postFile(file, url) {
    const formData = new FormData();
    formData.append('file', file)
    const config = { headers: { 'content-type': 'multipart/form-data' } }
    return post(url, formData, config)
  } */


  // A function for sorting variable names alphnumerically.
  sortAlphaNum = (a, b) => {
    return a.localeCompare(b, 'en', { numeric: true });
  }


  // Rendering the page content.
  render() {

    // Vars to hold render content.
    var centreContent = null;
    var leftContent = null;
    var rightContent = null;
    

    // A loading indicator will show when the both the 'if' conditions underneath are false.
    centreContent = (<div className = 'sub-div'>
      <p>Waiting for server response...</p>
      <div style = {{marginTop:'20px'}}><CircularProgress size = {35} thickness = {3.0}/></div>
      </div>);

    if (this.device.vars.length > 0) {
      leftContent = (
          <VarChecklist device = {this.device} callBack = {this.checkListCallBack} />);
      rightContent = (
          <PdMComponent PdMStatus = {this.PdMDetails} handlePdMState = {this.handlePdMState} showMessage = {this.state.PdM}/>
      );
    }
    

    // Show charts if available.
    if (this.charts.length > 0) {
      centreContent = (
        <div>
          <h3>Live Charts for {this.device.model_id}/{this.device.device_id}</h3>
          <div  className = 'sub-div' id = 'charts-container'>{this.charts}</div>
        </div>);

        
    }

    // Put a variable checklist on left sidebar if device variable names were retrieved from the polling thread.
    else if (this.device.vars.length > 0){
      centreContent = (
                      <div className = 'sub-div'>
                          <h3>{this.device.model_id}/{this.device.device_id} live monitoring {'&'} PdM.</h3>
                          <CheckCircleIcon style={{ color: 'green', fontSize: '50px' }} />
                          <p>You have been, or are currenly publishing device data on this topic!</p>
                          <br/>
                          <p>To get up to date machine learning inferences about the health of this device, switch on live PdM monitoring on the right.</p>
                          <p>You may also select device variables on the left to view real-time charts of their values as they are published,</p>
                          <p>(or the most recent values if not actively publishing).</p>
                          <br/><br/><br/>
                      </div>);
    }
    
    // If true, there was no data available for the device.
    if (this.state.showNoDataMsg==true) centreContent = "";
    

    // Rendering content divs and any message dialogs.
    return(
      <div style = {{textAlign:"center", overflow:'auto', height:'100vh', width:'100vw'}}>
          <div className = "left-sidebar">{leftContent}</div>
          <div className = "central-block">{centreContent}</div>
          <div className = "right-sidebar">{rightContent}</div>
          <MessageDialog  title = {"No data yet!"}
                              textLines = {["No data has been published for this device yet! Live monitoring will become available as soon as it publishes at least one message."]} 
                              onDialogClose = {() => {this.props.history.push("/devices");}}
                              open = {this.state.showNoDataMsg}/>
      </div>
      );
    }

  }
  export default withRouter(LiveMonitoring);




   /* var row = "" + this.device_id;
    Object.keys(result.values).map((key, idx)=>{row += ',' + result.values[key];});
    var file = new File([row], "data.txt", { type: "text/plain" }); */
    
    