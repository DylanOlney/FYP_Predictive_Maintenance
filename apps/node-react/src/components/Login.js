import React,  { Component }  from 'react';
import { withRouter} from 'react-router-dom';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import MessageDialog from './dialogs/MessageDialog';
import '../App.css';
import './css/Login.css';


/* ======================================================================================================================
This class is the log-in component of the application. It is assigned a route in the app's BrowserRouter and has a link
in the main navigation bar. It renders a log-in dialog for registered users and has code to validate the input. It then 
calls functions in the main parent component, 'App.js' passing on the credentials. These functions make backend calls to 
the database to check for the existence of the user and pass back the results. If the user is found another call to 'App.js' 
is made to log the user in. If not, a message is displayed urging the user to check their credentials.
=========================================================================================================================*/

class Login extends Component {

    // Setting state vars and class properties.
    constructor(props) {
      super(props);
      this.state = {
          username : "",
          password : "",
          userId: "",
          showMsgDialog: false
      }
      this.statusMsg = null;
      this.dialogMsg = null;
      this.dialogMsgTitle = null;
      this.valid = false;
      this.app = this.props.app;
    }
  
    // Textfield change listener for user name.
    updateUsername = (evt) => {
        this.setState({
            username: evt.target.value
        });
       this.statusMsg = null;
    }

    // Textfield change listener for password.
    updatePassword = (evt) => {
        this.setState({
            password: evt.target.value
        });
       this.statusMsg = null;
    }

    // Form submission handler. Calls the validate() and checkDatabase() functions below.
    // If input is not valid or user the user is not found, these functions display messages to convey this.
    // If the user is found, the userLogin() function is called which in turn calls a function in 'App.js' to
    // log the user in.
    submit = async (evt) =>{
        evt.preventDefault();   // Prevent the default form action (i.e. don't submit 'GET' url params to this page.)
        this.validate();
        this.forceUpdate();
        if (this.valid){
            if (await this.checkDatabase()){
                this.userLogin();
            }
        }
    }

    // Logs the user in after validation & authentication and then takes them back to the home page.
    userLogin = () => {
       this.statusMsg = null;
       // Calling the log in function in App.js (uses browser session storage).
       this.app.logUserIn({username: this.state.username,  userId: this.state.userId });
       this.props.history.push("/devices/?welcome=1");  // The home page will display a message if 'welcome' URL param = 1.
    }

    // Calls 'authenticateUser()' function in App.js which checks the database and returns the result.
    // Displays messages and returns false if authentication fails. Otherwise returns true.
    checkDatabase = async () => {

        var res =  await this.props.app.authenticateUser({"username": this.state.username, "password": this.state.password });
    
        if (res.userStatus) {

            if (res.userStatus == 'ok') {
                this.setState({userId: res.userId});
                return true;
            }

            if (res.userStatus == 'not found'){
                this.dialogMsg  = (<p style = {{color:'red'}}>No record of user found with this user name.</p>) 
                this.dialogMsgTitle = "User not found!";
            }

            if (res.userStatus == 'password wrong'){
                this.dialogMsg  = (<p style = {{color:'red'}}>Please check your password.</p>) 
                this.dialogMsgTitle = "Password incorrect!";
            }
        }

        else {
            this.dialogMsg = (<p style = {{color:'red'}}>{res}</p>)
            this.dialogMsgTitle = "Server error!"
        }

        this.statusMsg = null;
        this.setState({showMsgDialog: true});
        return false;
    }


    // This function validates the user's input and displays messages if it is unacceptable.
    // If the input passes the criteria, this class's 'valid' property is set to true and it's state
    // is set with the username and password.
    validate = () => {
        var uname = this.state.username.trim();
        var pword = this.state.password.trim();

        // The Critera checks...
        if (uname.indexOf(' ') > -1){
            this.dialogMsg = (<p style = {{color:'red'}}>Username must not contain any spaces.</p>)
            this.dialogMsgTitle = "Invalid Username!"
            this.setState({showMsgDialog: true});
            this.valid = false;
            return;
        }
        if (pword.indexOf(' ') > -1){
            this.dialogMsg = (<p style = {{color:'red'}}>Password must not contain any spaces.</p>)
            this.dialogMsgTitle = "Invalid Password!"
            this.setState({showMsgDialog: true});
            this.valid = false;
            return;
        }
        if (uname.length < 8){
            this.dialogMsg = (<p style = {{color:'red'}}>Username must be at least 8 characters.</p>)
            this.dialogMsgTitle = "Invalid Username!"
            this.setState({showMsgDialog: true});
            this.valid = false;
            return;
        }
        if (pword.length < 8){
            this.dialogMsg = (<p style = {{color:'red'}}>Password must be at least 8 characters.</p>)
            this.dialogMsgTitle = "Invalid Password!"
            this.setState({showMsgDialog: true});
            this.valid = false;
            return;
        }

       // If the code exection reaches here, the input is valid.
       this.valid = true;

       // Prepare a loading indicator in case there is any visible delay caused by the database query.
       this.statusMsg = (
                <div style = {{marginTop:'30px'}}>
                         <h3 style = {{color:'green'}}>Checking database, please wait a moment...</h3>
                        <CircularProgress size = {55} thickness = {5.0}/>
                </div>
        );
       
        // Update state with valid credentials.
        this.setState({
            username : uname,
            password : pword
        });
    }


    // Rendering the page content...
    render() {
      return(
      
        <div className = "App">
            <h3 style = {{marginTop: "100px"}}>User Login:</h3>
            <form onSubmit={this.submit} className="login-box">
                <input className = "login-field" placeholder="Username" type="text" value={this.state.username} onChange={this.updateUsername} required/>
                <input className = "login-field" placeholder="Password" type="password" value={this.state.password} onChange={this.updatePassword} required/>
                <div style = {{marginTop: '20px'}}><Button variant="contained" type="submit" size = "small">Login</Button></div>
            </form>
            {this.statusMsg}
            <MessageDialog  title = {this.dialogMsgTitle}
                            textLines = {[this.dialogMsg]} 
                            onDialogClose = {() =>{
                               this.statusMsg = null;
                                this.setState({showMsgDialog: false});
                            }}
                            open = {this.state.showMsgDialog}/>
        </div>
        

      );
      }
    }
   
  
    export default withRouter(Login);