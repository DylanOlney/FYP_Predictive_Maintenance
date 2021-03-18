
import 'react-router-dom';
import './App.css';
import Nav from './components/Nav';
import Home from './components/Home';
import Login from './components/Login';
import Logout from './components/Logout';
import Signup from './components/Signup';
import Admin from './components/Admin';
import DeviceManager from './components/DeviceManager';
import DeviceHistory from './components/DeviceHistory';
import LiveMonitoring from './components/LiveMonitoring'
import React, { Component } from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
const axios = require('axios');
const bcrypt = require('bcryptjs');

class App extends Component {
  
  constructor() {
    super();
    this.userMsg =  null;
    var savedUsername = sessionStorage.getItem('username');
    var savedUserId   = sessionStorage.getItem('userId');

    this.routes = {
      "Home":            {url: "/",                 target: () => <Home            app  = {this}/>},
      "Log In":          {url: "/login",            target: () => <Login           app  = {this}/>},
      "Sign Up":         {url: "/signup",           target: () => <Signup          app  = {this}/>},
      "Log Out":         {url: "/logout",           target: () => <Logout          app  = {this}/>},
      "Devices":         {url: "/devices",          target: () => <DeviceManager   app  = {this}/>},
      "DeviceHistory":   {url: "/device_history",   target: () => <DeviceHistory   app  = {this}/>},
      "LiveMonitoring":  {url: "/live_monitoring",  target: () => <LiveMonitoring  app  = {this}/>}
    }

  
    if (savedUsername == null ){
      this.state = {
        user: null,
        navLinks:  ["Home", "Log In", "Sign Up"]
      }
    }
    else {
      var navlinks = ["Home", "Log Out", "Devices"];
      var savedLink = sessionStorage.getItem('savedLink');
      if (savedLink != null) navlinks.push(savedLink);
      this.state = {
          user: {'username': savedUsername, 'userId': savedUserId},
          navLinks: navlinks
      };
    }
  }

  addTempNavLink = (name) => {
    var temp = JSON.parse(JSON.stringify(this.state.navLinks));
    temp.push(name);
    this.setState({navLinks:temp});
    sessionStorage.setItem('savedLink', name);
  }

  removeTempNavLink = () =>{
    if(this.getUser() != null) {
      this.setState({navLinks: ["Home", "Log Out", "Devices"]});
      sessionStorage.removeItem("savedLink");
    }
  }

  logUserIn(user){
    sessionStorage.setItem('username', user.username);
    sessionStorage.setItem('userId', user.userId);
    var navlinks = ["Home", "Log Out", "Devices"];
    var savedLink = sessionStorage.getItem('savedLink');
    if (savedLink != null) navlinks.push(savedLink);
    this.setState ({
        user: user,
        navLinks: navlinks
    })
  }

  logUserOut = () =>{
    sessionStorage.clear();
    this.setState({
      user: null,
      navLinks: ["Home", "Log In", "Sign Up"]
    })
  }

  getUser=()=>{
    return this.state.user;
  }


  render() {
    const navLinks = this.state.navLinks
    const navRoutes = navLinks.map((name, idx)=>{
      return (<Route exact path = {this.routes[name].url}  component = {this.routes[name].target}  key = {idx}/>);
    })
    
    return (
      <Router >
         <div className = "backGround">
          <Nav id = "Nav" navLinks = {navLinks} appRoutes = {this.routes} user = {this.state.user}/>
          <Switch>
            {navRoutes}
            <Route exact path = "/admin"  component = {Admin}/>
          </Switch>
          </div>
      </Router>
    );
  }


  // ===========================================================================================================
  // User API functions: 
  // These are called by various components of the application.
  // They involve making HTTP requests (via Axios) to the Node/Express server which handles the storage and 
  // manipulation of user information in the database. All request URLs here begin with '/api/users/'.
  //============================================================================================================

  authenticateUser = async (userCredentials) => {
    try{
      var response = await this.timeoutPromise(6000,'Database query timed out!', axios.get('/api/users/' + userCredentials.username));
      if (response.data.userStatus == "not found") return {userStatus: "not found"}
      var hashedPW = response.data.pw;
      const match = await bcrypt.compare(userCredentials.password, hashedPW);
      if (match)  return {userStatus: 'ok', userId: response.data.userId}; 
      else        return {userStatus: "password wrong"};
    }
    catch(err) {
       if (err.response) return err.response.data;
       else return err.message;
    }
  }
 
  insertNewUser = async (userCredentials) => {
    try{
      var hashedPW = await bcrypt.hash(userCredentials.password, 10);
      var username = userCredentials.username;
      const response = await this.timeoutPromise(6000,'Database insertion timed out!', axios.post('/api/users/' + username, {passwd:hashedPW}));
      var status = response.data.userStatus;
      var id = response.data.userId;
      return {userStatus: status, userId: id};
    }
    catch(err) {
      if (err.response) return err.response.data;
      else return err.message;
    }
  }

  getUserDevices = async () => {
    try{
      var user_id = this.state.user.userId; 
      const response = await this.timeoutPromise(6000,'Database query timed out!', axios.get('/api/users/' + user_id + '/devices'));
      return response.data.devices;
    }
    catch(err) {
      return 'error';
    }
  }

  addUserDevice = async (device) => {
    try{
      const response = await this.timeoutPromise(6000,'Database query timed out!', 
                    axios.get(`/api/users/${device.user_id}/devices/${device.model_id}/${device.device_id}/?action=add`));
      return response.data.devices;
    }
    catch(err) {
      return 'error';
    }
  }

  removeUserDevice = async (device) => {
    try{
      const response = await this.timeoutPromise(6000,'Database query timed out!', 
                    axios.get(`/api/users/${device.user_id}/devices/${device.model_id}/${device.device_id}/?action=remove`));
      return response.data.devices;
    }
    catch(err) {
      return 'error';
    }
  }


  getModelNames = async () => {
    try{
      const response = await this.timeoutPromise(6000,'Database query timed out!', 
                    axios.get(`/api/models/getModelNames`));
      return response.data.modelNames;
    }
    catch(err) {
      return 'error';
    }
  }

  getModel = async (model_id) => {
    try{
      const response = await this.timeoutPromise(6000,'Database query timed out!', 
                    axios.get(`/api/models/${model_id}`));
      return response.data.model;
    }
    catch(err) {
      return 'error';
    }
  }
  // =======================================================================================================================================
  // Device API functions:
  // These involve requests to the Flask-MQTT service which handles the storage and manipulation of specific device data in the database.
  // Request URLs here begin with '/flask/'. This route is NOT provided by the Node/Express server, but by the Nginx reverse-proxy server
  // which routes all requests beginning with '/flask/' to the Flask-MQTT service.
  //========================================================================================================================================

  getDeviceHistory = async (device) => {
    try{
      const response = await this.timeoutPromise(6000,'Database query timed out!', axios.post('/flask/getDeviceHistory', device));
      var rtn = {'status': 'ok' }
      rtn['deviceHistory'] = response.data.deviceHistory;
      return rtn;
    }
    catch(err) {
      var rtn = {status: 'error' , msg: err.message}
      return rtn;
    }
  }

  
 subscribe = (device) => {
  try{
    axios.post('/flask/subscribe', device);
  }
  catch(err) {}
  }





 // A time-out promise function used by the the above API functions when making requests.

 timeoutPromise = (ms, timeoutMsg, promise) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {reject(new Error(timeoutMsg))}, ms);
      promise.then((res) => {clearTimeout(timeoutId); resolve(res);},
                   (err) => {clearTimeout(timeoutId);reject(err);}
      );
    })
  }



}

export default App;

