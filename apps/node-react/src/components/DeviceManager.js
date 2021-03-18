import React,  { Component }  from 'react';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';
import { withStyles } from "@material-ui/core/styles";
import { withRouter } from 'react-router-dom';
import MessageDialog from './dialogs/MessageDialog';
import ConfirmDialog from './dialogs/ConfirmDialog';
import FormDialog from './dialogs/FormDialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import '../App.css';
import './css/DeviceManager.css';
import 'react-listbox/dist/react-listbox.css';


// A custom style for 'material-ui' listbox selected item.
const listStyle = {
  active: {
    backgroundColor: "#FFC269 !important",
    borderRadius: '10px',
    width: '95%',
    margin: '7px',
    boxShadow: '5px 10px 18px black',
    fontWeight: 600
  }
};

/* =================================================================================================

This class renders a component which enables registered users to manage their devices. It is
a BrowserRouter enababled component for which a link appears in the navigation bar. 

Users are redirected to this component's route when they log in as it is the main hub of the application. 

Users create and subscribe to new MQTT topics by adding devices. A device topic consists of the 
user's unique ID, a model ID and a device ID, (e.g. <user_id>/<model_id>/<device_id>). To create a 
new topic, users need only specify the model and device IDs as their unique userID has already been 
created for them by the database when they signed up. They payload format of the topic is expected 
to be a simple JSON string specifying the device's variable names and values.

Users may also delete devices, which unscubscribes the MQTT client from that device's topic.

The user's subscribed devices are stored in the same database document (MongoDB) as their credentials.
There is a separate collection of documents which stores all the actual message data for all users devices.

This component also provides an option to view a device's message history and an option to monitor messages
live as they are published to the MQTT broker and received by the client. These latter options have their 
own dedicated components and routes (see 'DeviceHistory.js' and 'LiveMonitoring.js' respectively),
and they also provide functionality to make back end calls to the machine learning functions which
provide the predictive maintenance functionality of the application.


=====================================================================================================*/
class DeviceManager extends Component {
 
  constructor(props) {
    super(props);
    
  
    // Initializing state.
    this.state = {
        
        // User's devices object.
        devices: {},

        // Model and device list box selected indeces.
        // (There are two list boxes: one for models and another for devices of that model type.)
        modelSelection: 0,
        deviceSelection: 0,

        availableModels: [],

        // Used for processing new model and device names.
        newModelName: "",
        newDeviceName: "",

        // Dialog messages.
        showDeviceSaved: false,
        showDeviceNotSaved: false,
        showConfirmRemoveDevice: false,
        showDeviceRemoved: false,
        showDeviceInfo: false,
        showNewDeviceForm: false,
        
        // Loading status.
        loading: true,
        loadingMessage: "Loading...",
        clr: ""
    }

    // Class attributes.
    this.app = this.props.app;
    this.user = this.app.getUser();
    this.models = [];
    //this.modelVars = [];
    this.devices = [];
    this.removedDeviceTopic = "";
    this.addedDeviceTopic = "";
  }


  // When the component mounts, look first to the session storage for user's devices and device list state,
  // and set state acccordingly if found. (This is for when user is returning to page from another route).
  // If no session data is found, it means that the user has just logged in, so get user's devices from the database instead.
  componentDidMount = () => {
      var listState = sessionStorage.getItem('listState');
      if (listState!= null) {
        var temp = JSON.parse(listState);
        this.setState({
          devices: temp.devices,
          modelSelection: temp.modelSelection,
          deviceSelection: temp.deviceSelection,
          loading: false
        });
      }
       // If there is no session storage item regarding list state, call this function to get the devices.
      else this.getUserDevices(); 
      this.getAvailableModels();

     
  }


  // When the component dismounts, save the device list state to session storage.
  componentWillUnmount = () =>{
    sessionStorage.setItem('listState', JSON.stringify({devices: this.state.devices, modelSelection: this.state.modelSelection, deviceSelection: this.state.deviceSelection}));
  }

  getAvailableModels = async () => {
    var res  = await this.app.getModelNames(); 
    if (res=='error') {
      alert('Error reading models!');
      return;
    }
    const models =  res.map((model)=>{
        return ( <MenuItem value={model}>{model}</MenuItem>)
    });
    this.setState({availableModels:models});
  }

  
  // This function makes an async call to a fuction in App.js which queries the database
  // for all the user's devices, and assign's the returned object to the state's 'devices' entry.
  // It is called whenever the component mounts (i.e. the componentDidMount() function).
  getUserDevices = async () =>{
    this.setState({loading: true, loadingMessage: "Getting data..."});
    var devices = await this.app.getUserDevices();

    if (devices=='error') {
      alert('Error getting user devices!');
      return;
    }
    // Upon resonse, subscribe to all user's device topics, if any.
    
    Object.keys(devices).map((modelId)=>{
        devices[modelId].map(async (deviceId)=>{
           var topic = {'user_id':  this.user.userId, 'model_id': modelId , 'device_id': deviceId};
           this.app.subscribe(topic);
        });
    });
    this.setState({devices: devices, loading: false});  // Set devices state to 'devices' and loading state to false.
  }


  // There are two list boxes in this view, one for user's models and another for device's of that model.
  // The following list item click handlers store the selected list indeces in state.

  // Handler for 'modelList' item click.
  modelListItemClick = (event, idx) => {
    this.setState({
      modelSelection : idx,
      deviceSelection : 0
    });
  }

  // Handler for 'deviceList' item click.
  deviceListItemClick = (event, idx) => {
    this.setState({
      deviceSelection : idx
    });
  }


  // This function returns some info about the selected device in the list. 
  // It is used to get the content for a message dialog which is displayed when a button is clicked.
  getDeviceInfo = (model , device) => {
    var info = ["The MQTT topic for this device is as follows: ",  
                (<b>{this.user.userId}/{model}/{device}</b>),
                "i.e. (<user id>/<model name>/<device name>)",
                "Message payloads for topics should be in JSON format. " + 
                "For this particular topic, payloads should contain the variables " + 
                "exactly as listed in the link below:",
                (<a href = {`/flask/models/${model}.txt`} style = {{color:'blue'}}>{model}.json</a>),
                "Your device gateway needs to be configured to regularly publish such payloads on this topic to our MQTT broker (on port 1883)."];
    return info;
  }

  

  // This function is used to validate input from the 'add new device' form dialog 
  // and it is called when the user submits the form. White space is removed from input 
  // texts (modelName & deviceName) and if the resulting strings are not empty,
  // a function is called to add the new device to the database. 
  validateDevice = () =>{
      var modelName = this.state.newModelName;
      modelName = modelName.replace(/\W/g, '');
      var deviceName = this.state.newDeviceName;
      deviceName = deviceName.replace(/\W/g, '');

      if (modelName == "" || deviceName == ""){
        this.setState({showDeviceNotSaved: true, newModelName:"", newDeviceName: "", clr: ""});
        return;
      }
      // If code execution reaches here, the model and device names are valid.
      this.addUserDevice(modelName, deviceName);  // Call the function below to add the new device to the database.
  }
 

  // This function makes an asyc call to a query function in App.js which updates the user's
  // device list in the database with a new device. The state is then updated to show the new device in the list.
  addUserDevice = async (modelName, deviceName) => {
    this.setState({loading: true, loadingMessage: "Updating database...", newModelName:"", newDeviceName: "", clr: ""});
    var res  = await this.app.addUserDevice({user_id: this.user.userId, model_id: modelName, device_id: deviceName }); //password: this.user.password,
    
    if (res=='error') {
      alert('Error adding device!');
      return;
    }

    this.setState({
      devices: res,
      newModelName: modelName,
      newDeviceName: deviceName,
      showNewDeviceSavedMsg: true,
      loading: false
    });
    if (this.models.length > 0 && this.devices.length > 0) this.selectDevice(modelName, deviceName);
  }


  // This function makes an asyc call to a query function in App.js which updates the user's
  // device list in the database, removing the seleted device. The state is then updated to reflect the updated list.
  // It is called by a button click in the UI.
  removeUserDevice = async () => {
    var deviceSelection = this.state.deviceSelection;
    var modelSelection = this.state.modelSelection;

    if (this.devices.length > 1) {
      if (deviceSelection > 0) deviceSelection -= 1;
    } 
    else {
      if (this.models.length > 1){
        if (modelSelection > 0) modelSelection -= 1;
        deviceSelection = 0;
      }
    }
    var modelName = this.models[this.state.modelSelection];
    var deviceName = this.devices[this.state.deviceSelection];
    this.setState({loading: true, loadingMessage: "Updating database..."});
    var res  = await this.app.removeUserDevice({user_id: this.user.userId,  model_id: modelName, device_id: deviceName }); //password: this.user.password,
    
    if (res=='error') {
      alert('Error removing device!');
      return;
    }

    this.setState({
      devices: res,
      modelSelection: modelSelection,
      deviceSelection: deviceSelection,
      showDeviceRemoved: true,
      loading: false
    });
  }


  // This is a helper function which is used for auto-selecting new devices in the list as they are added.
  selectDevice = (model, device) => {
    var modelIndex = this.models.indexOf(model);
    this.devices =  this.state.devices[this.models[modelIndex]];
    var deviceIndex = this.devices.indexOf(device);
      this.setState({
        modelSelection: modelIndex ,
        deviceSelection: deviceIndex 
      });
  }


  // The following two functions redirect the user away from this route and are called by UI button clicks for 
  // viewing '/device_history' and '/live_monitoring' routes respectively (see DeviceHisrory.js and LiveMonitoring.js).
  // A new temporaray navigation bar link is displayed for the specific route and the user is then directed to that route.
  // The selected device & model ids are passed on via URL params.

  showHistory = () =>{
    this.app.addTempNavLink("DeviceHistory");   // Adding a navigation bar link.
    var modelName = this.models[this.state.modelSelection];
    var deviceName = this.devices[this.state.deviceSelection];
    var url = "/device_history/?model_id=" + modelName  + "&device_id=" + deviceName;  // Add 'model_id' and 'device_id' params to the route's URL.
    this.props.history.push(url);   // Redirect to the route's URL, leaving this page.
  }


  showLiveMonitoring = () => {
    this.app.addTempNavLink("LiveMonitoring");
    var modelName = this.models[this.state.modelSelection];
    var deviceName = this.devices[this.state.deviceSelection];
    var url = "/live_monitoring/?model_id=" + modelName  + "&device_id=" + deviceName;
    this.props.history.push(url);
  }



  // A helper function for getting any URL parameter values on this route.
  getUrlParamVal = (paramName) => {
    return  new URLSearchParams(window.location.search).get(paramName);
  }



  // The render() function. Preparing UI elements, populating lists boxes, setting up message dialogs, etc.  and rendering content.
  render() {
    this.models = Object.keys(this.state.devices)
    console.log(JSON.stringify(this.state.devices));
    var modelItems =  this.models.map((model, idx) => {
      return (<ListItem button
                       selected={this.state.modelSelection === idx}
                       onClick={(event) => this.modelListItemClick(event, idx)}
                       classes={{ selected: this.props.classes.active } } 
                       autoFocus={this.state.deviceSelection === idx}>
                <ListItemText primary={model} />
             </ListItem>)});

   
    var deviceItems = null;
    if (Object.keys(this.state.devices).length > 0){
      this.devices =  this.state.devices[this.models[this.state.modelSelection]];
      //if (!this.devices) this.devices= [];
        deviceItems = this.devices.map((device, idx)=>{
          return (<ListItem button
                            selected={this.state.deviceSelection === idx}
                            onClick={(event) => this.deviceListItemClick(event, idx)}
                            classes={{ selected: this.props.classes.active }} 
                            autoFocus={this.state.deviceSelection === idx}>
                    <ListItemText primary={device} />
                  </ListItem>)});
    }
  
    var modelList = null;
    var deviceList = null;
    var deviceOptions = (<p style = {{textAlign:'left', color: 'white'}}>You havn't registered any devices yet. Click above to add...</p>);
   
    if (this.models.length > 0){

      modelList = (
          <div style = {{display: 'inline-block', width: '300px', verticalAlign:'top'}}> 
          <p style = {{textAlign:'left', color: 'white'}}><b>Models ({this.models.length})</b></p>
                <List className = "listBox">{modelItems}</List>
          </div>
      );
      deviceList = (
          <div style = {{display: 'inline-block', width: '300px', verticalAlign:'top'}}> 
          <p style = {{textAlign:'left', color: 'white'}}><b>{this.devices.length} Device(s)</b></p>
          <List className = "listBox">{deviceItems}</List>
          </div>
      );

     
      deviceOptions = (
        <span>
        <div style = {{marginTop: '15px'}}>
            <Button onClick = {()=>{
                var modelName = this.models[this.state.modelSelection]
                var deviceName = this.devices[this.state.deviceSelection]
                this.removedDeviceTopic = this.user.userId + "/"+ modelName + "/" + deviceName;
                this.setState({showConfirmRemoveDevice: true})}} 
                variant="contained"  size = "small" fullWidth = {true}>
                Remove Device
            </Button>
        </div>
        
        <p   style = {{textAlign: 'left', color: 'white', marginTop: '50px'}}><b>Selected device options:</b></p> 
        <div style = {{marginTop: '15px'}}><Button onClick = {() => {this.showLiveMonitoring()}} variant="contained"  size = "small" fullWidth = {true}>Live Monitoring {"&"} PdM</Button></div>
        <div style = {{marginTop: '15px'}}><Button onClick = {() => {this.showHistory()}}        variant="contained"  size = "small" fullWidth = {true}>Device History </Button></div>
        <div style = {{marginTop: '15px'}}><Button onClick = {()=>  {this.setState({showDeviceInfo:true})}} variant="contained"  size = "small" fullWidth = {true}>MQTT Info</Button></div>
       
        </span>
      );
    }
    
    this.addedDeviceTopic = this.user.userId + "/"+ this.state.newModelName + "/" + this.state.newDeviceName
    
    if (this.state.loading) {
          return (
              <div style = {{marginTop:'250px',marginBotton: '30px', textAlign:'center'}}>
              <h3>{this.state.loadingMessage}</h3>
              <div style = {{marginTop:'30px'}}><CircularProgress size = {55} thickness = {5.0}/></div>
              </div>);
    }
    else {
      //const welcomeMsg = new URLSearchParams(window.location.search).get('welcome');
      //const noData = new URLSearchParams(window.location.search).get('noData');
      return (
         <div>
            <h3 style = {{marginTop: '50px'}}>Device Manager</h3>
            <div className = "container-div">
              {modelList}
              {deviceList}
              <div style = {{display: 'inline-block', width: '200px', verticalAlign:'top'}}> 
                <p style = {{textAlign:'left', color: 'white'}}><b>Manage Devices:</b></p>
                <div style = {{marginTop: '15px'}}>
                    <Button onClick = {()=>{this.setState({showNewDeviceForm:true});}} 
                            variant="contained"  
                            size = "small" fullWidth = {true}>
                            Add New Device
                    </Button>
                </div>
                {deviceOptions}
              </div>
            </div>
            <MessageDialog    title = "Device saved!" 
                              onDialogClose = {() => {this.setState({showDeviceSaved: false})}}
                              textLines = {["The device topic: '" + this.addedDeviceTopic + "' has been added to the database and our MQTT client has subscribed to it. " + 
                                            "You can perform live monitoring on this device or view it's history (Device Operations)."]} 
                              open = {this.state.showDeviceSaved}/>

            <MessageDialog    title = "Device Removed!" 
                              onDialogClose = {() => {this.setState({showDeviceRemoved: false})}}
                              textLines ={[]}//{["Device  '" + this.removedDeviceTopic + "' has been removed!"]} 
                              open = {this.state.showDeviceRemoved}/>

            <MessageDialog    title = "Model/device name invalid!" 
                              onDialogClose = {() => {this.setState({showDeviceNotSaved: false})}}
                              textLines = {["The device name didn't contain any valid characters!"]} 
                              open = {this.state.showDeviceNotSaved}/>

            <MessageDialog    title = {`MQTT Info: ${this.models[this.state.modelSelection]} device, ${this.devices[this.state.deviceSelection] }`}
                              textLines = {this.getDeviceInfo(this.models[this.state.modelSelection], this.devices[this.state.deviceSelection] )} 
                              onDialogClose = {() => {this.setState({showDeviceInfo: false})}} 
                              open = {this.state.showDeviceInfo}/>
            
            <MessageDialog    title = {"Welcome back, " + this.user.username + "!"}
                              textLines = {["You are now logged in!"]} 
                              onDialogClose = {() => {this.props.history.push("/devices");}}
                              open = {this.getUrlParamVal('welcome')=='1'}/>

            <MessageDialog    title = "Welcome!" 
                              textLines = {["Welcome to the site " + this.user.username + ".", "You are now a registered user!"]} 
                              onDialogClose = {() => {this.props.history.push("/devices");}} 
                              open = {this.getUrlParamVal('welcome')=='2'}/>

            <MessageDialog    title = "No data yet!" 
                              textLines = {["No data has been published for this device yet!"]} 
                              onDialogClose = {() => {this.props.history.push("/devices");}} 
                              open = {this.getUrlParamVal('noData')=='1'}/>

          

            <FormDialog       title = "Add New Device (model instance):" 
                              content = {this.getFormContent()} 
                              onSubmit = {() => {
                                    this.setState({showNewDeviceForm: false});
                                    this.validateDevice();}} 
                              onCancel = {()=>{ this.setState({showNewDeviceForm: false});}}
                              open = {this.state.showNewDeviceForm}/>  


            <ConfirmDialog    title = "Confirm Remove!" 
                              ok = {() => {this.setState({showConfirmRemoveDevice: false}); this.removeUserDevice();}}
                              cancel = {() => {this.setState({showConfirmRemoveDevice: false})}}
                              textLines = {["Are you sure you want to remove the topic: " , (<b>{this.removedDeviceTopic}</b>) , "from your device list?" ,
                                            "If you proceed, our MQTT client will un-subscribe from it. However, any of the devices's already saved " + 
                                            "message data will remain in the database should you want to access it again in the future. " + 
                                            "If so, you may want to take note of the model and device name before going ahead."]} 
                              open = {this.state.showConfirmRemoveDevice}/>          
        </div>);
    }
  }

  getFormContent = () => {
    
    
      return (
      <DialogContent>

        <FormControl >
        {/* <div>Either choose a model type from the dropdown list or else specify an arbitrary model name (Only models in the dropdown list have PdM functionality). Then add a name for the device and click OK.</div> */}
        <div style = {{ marginTop:'20px'}}>Either choose a model type with PdM functionality:</div>
        <Select onChange={(e) => {
                this.setState({newModelName : e.target.value, clr: ""})
                }}
                label="Model" 
                value={this.state.newModelName} fullWidth required>
                {this.state.availableModels}
        </Select>
        <p>OR...</p>
        <div>specify an arbitrary model name (no PdM functionality):</div>
        <TextField  onChange = {(e) => {this.setState({newModelName : e.target.value, clr:  e.target.value})}} 
                      id="deviceName" 
                      type="text" 
                      value = {this.state.clr}
                      fullWidth/>

        <div style = {{ marginTop:'40px'}}>Enter a name for the device:</div>
        <TextField  onChange = {(e) => {this.setState({newDeviceName : e.target.value})}} 
                      id="deviceName" 
                      type="text" fullWidth required/>
        
         
          <div  style = {{marginTop:'20px'}}>
              Please don't use spaces or non-word characters in model or device names. 
              They will be removed if found! (Underscores and number characters are accepted).
          </div>
      </FormControl>
      </DialogContent>)
  }



}
export default withRouter(withStyles(listStyle)(DeviceManager));
//export default withRouter(DeviceManager);