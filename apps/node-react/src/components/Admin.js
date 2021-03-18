import React,  { Component }  from 'react';
import { withRouter } from 'react-router-dom';
import '../App.css';
import FormDialog from './dialogs/FormDialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import TextField from '@material-ui/core/TextField';
import './css/DeviceManager.css';
import Button from '@material-ui/core/Button';

const axios = require('axios');

class Admin extends Component {
  
  constructor(props) {
    super(props);
    this.dburl = "";
    this.state = {
        showLoginForm: true,
        iframeVisibility: 'none',
        containerVisibility: 'none'
    }
  }

 

  processInput = async() => {
    var req = new XMLHttpRequest();
    req.addEventListener('load', () => {
      if (req.status==403) {
        this.props.history.push("/?admin_fail=1"); 
        return;
      }
      var iframe = document.getElementById('iframe');
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(req.responseText);
      iframe.contentWindow.document.close();
      this.setState({containerVisibility: 'block', iframeVisibility: 'none'});
    }); 
    req.open("GET", '/mongo-admin');
    req.setRequestHeader("Authorization", "Basic " + btoa(this.state.adminName + ":" + this.state.adminPass));
    req.send();
  }

  
  render () {
   
    var options = "";
    if (this.state.iframeVisibility == 'block') {
      options = (<div style = {{marginBottom: '20px'}}>
                           <Button 
                                onClick = {() => {this.setState({iframeVisibility: 'none'});}}  
                                variant="contained"  size = "small" 
                                fullWidth = {false}>Back to Menu
                           </Button>
                  </div>);
    }
    else {
      options  = (<div style = {{marginBottom: '20px'}}>
                          <p>Admin Options:</p>
                          <div><Button 
                               onClick = {() => {this.setState({iframeVisibility: 'block'});}}  
                               variant="contained"  size = "small" 
                               fullWidth = {true}>View Database Portal
                          </Button></div>
                          <div style = {{marginTop: '10px'}}><Button 
                               onClick = {() => {}}  
                               variant="contained"  size = "small" 
                               fullWidth = {true}>Define new device model
                          </Button></div>
                          <div style = {{marginTop: '10px'}}><Button 
                               onClick = {() => {this.props.history.push("/?admin_out=1");}}
                               variant="contained"  size = "small" 
                               fullWidth = {true}>Log Out
                          </Button></div>
                  </div>);
    }


    return(
        <div>
          <input type="file" id="file" ref="fileUploader" style={{display: "none"}}/>
          <div id = 'container-div' className = "container-div" style = {{textAlign: 'center', display : this.state.containerVisibility}}>
             {options}
             <iframe  id = 'iframe' title="Database" style = {{width: '80vw', height: '70vh', display : this.state.iframeVisibility}} sandbox></iframe>
          </div>
          <FormDialog       title = "Admin Login:" 
                            content = {this.getFormContent()} 
                            onSubmit = {() => {
                                    this.setState({showLoginForm: false});
                                    this.processInput();}} 
                            onCancel = {()=>{ 
                                    this.setState({showLoginForm: false});
                                    this.props.history.push("/")
                            }}
                            open = {this.state.showLoginForm}/>   
          </div>
      );
    }


    getFormContent = () => {
        return (
        <DialogContent>
             <DialogContentText style = {{ marginBottom:'30px'}}>
                Enter your admin credentials...
            </DialogContentText>
            <TextField  onChange = {(e) => {this.setState({adminName : e.target.value})}} 
                        id="modelName" label="admin name" 
                        type="text" fullWidth required/>
            <TextField  onChange = {(e) => {this.setState({adminPass : e.target.value})}} 
                        id="deviceName" label="admin pass" 
                        type="password" fullWidth required/>
           
            
        </DialogContent>)
    }
  }
 
  

  export default withRouter(Admin);