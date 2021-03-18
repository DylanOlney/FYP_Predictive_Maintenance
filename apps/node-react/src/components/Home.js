import React,  { Component }  from 'react';
import { withRouter } from 'react-router-dom';
import '../App.css';
import MessageDialog from './dialogs/MessageDialog';


/* =============================================================================================
This class renders the hompage and it is a BrowserRouter enabled component with a link in the 
navigation bar. The route is simply '/' as it is the landing page of the application. There is 
little functionality here apart from rendering the home image and displaying a 'goodbye' message
when the user is redirected here after logging out.
================================================================================================ */

class Home extends Component {
  
  constructor(props) {
    super(props);
  }

  
  getUrlParamVal = (paramName) => {
    return  new URLSearchParams(window.location.search).get(paramName);
  }
  render() {
    //const param = new URLSearchParams(window.location.search).get('goodbye');
    return(
          
          <div className = "App">
              <h3 style = {{ marginTop: '50px'}}>Home</h3>
              <img  src = {require ('../images/home.jpg')} className = "homeImage"/>
              <MessageDialog title = "You have been logged out!" 
                             textLines = {["Thanks for using this service. Come back again soon!"]} 
                             onDialogClose = {() => {this.props.history.push("/");} }
                             open = {this.getUrlParamVal('goodbye')=='1'}/>
              <MessageDialog title = "Admin login attempt failed!" 
                             textLines = {["Incorrect Credentials!"]} 
                             onDialogClose = {() => {this.props.history.push("/");} }
                             open = {this.getUrlParamVal('admin_fail')=='1'}/>
              <MessageDialog title = "Admin logged out." 
                             textLines = {["See you again soon!"]} 
                             onDialogClose = {() => {this.props.history.push("/");} }
                             open = {this.getUrlParamVal('admin_out')=='1'}/>
              
          </div>
          
      );
    }
  }
 

  export default withRouter(Home);

  