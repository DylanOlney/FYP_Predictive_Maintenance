import React,  { Component }  from 'react';
import { withRouter} from 'react-router-dom';
import Button from '@material-ui/core/Button';
import MessageDialog from './dialogs/MessageDialog';
import CircularProgress from '@material-ui/core/CircularProgress';
import '../App.css';
import './css/Login.css';

/* ==============================================================================================================
This class renders the sign-up component for unregistered users. It is a BrowserRouter enabled
component for which a link appears in the navigation bar. There is a function for validation
which displays messages if the input doesn't meet certain criteria, a function to check database
to see if username already exists and update it with new user details if not, and a form submission
handler which calls the above functions. If the credentials pass validation, the new user's details
are stored to the database, the user is logged in and redirected to the '/devices' route, ('DeviceManager.js').
================================================================================================================ */
class Signup extends Component {

    constructor(props) {
        super(props);

        // Initializing state.
        this.state = {
            username : "",
            password1 : "",
            password2 : "",
            showMsgDialog: false
            //signupSuccess: false
        }

        // Class attributes.
        this.progressMsg = null;
        this.dialogMsg = null;
        this.dialogMsgTitle = null;
        this.valid = false;      // Validation flag.
        this.app = this.props.app;
      }

    // Username text field change handler.
    updateUsername = (evt) => {
        this.setState({
            username: evt.target.value
        });
        this.progressMsg = null;
    }

    // Password text field change handler.
    updatePassword1 = (evt) => {
        this.setState({
            password1: evt.target.value
        });
        this.progressMsg = null;
    }

    // Re-type password text field change handler.
    updatePassword2 = (evt) => {
        this.setState({
            password2: evt.target.value
        });
        this.progressMsg = null;
    }


    // Validation function. This is called by the form sumission handler function.
    // It checks the input for validity and if certain criteria are not met, messages will be
    // displayed informing the user.
    validate = () => {
        var uname = this.state.username.trim();
        var pword1 = this.state.password1.trim();
        var pword2 = this.state.password2.trim();

        // Criteria....
        if (uname.indexOf(' ') > -1){
            this.dialogMsgTitle = "Invalid Username!"
            this.dialogMsg = (<p style = {{color:'red'}}>Username must not contain any spaces.</p>)
            this.setState({showMsgDialog: true});
            this.valid = false;
            return;
        }
        if (pword1.indexOf(' ') > -1){
            this.dialogMsgTitle = "Invalid Password!"
            this.dialogMsg = (<p style = {{color:'red'}}>Password must not contain any spaces.</p>)
            this.setState({showMsgDialog: true});
            this.valid = false;
            return;
        }
        if (uname.length < 8){
            this.dialogMsgTitle = "Invalid Username!"
            this.dialogMsg = (<p style = {{color:'red'}}>Username must be at least 8 characters.</p>)
            this.setState({showMsgDialog: true});
            this.valid = false;
            return;
        }
        if (pword1.length < 8){
            this.dialogMsgTitle = "Invalid Password!"
            this.dialogMsg = (<p style = {{color:'red'}}>Password must be at least 8 characters.</p>)
            this.setState({showMsgDialog: true});
            this.valid = false;
            return;
        }

        if (pword1 != pword2){
            this.dialogMsgTitle = "Invalid Password!"
            this.dialogMsg = (<p style = {{color:'red'}}>The passwords dont match!.</p>)
            this.setState({showMsgDialog: true});
            this.valid = false;
            return;
        }

        // If code execution reaches here the input has passed all the criteria and is valid.
        this.valid = true;

        // Prepare a loading indicator in case there is any visible delay caused by the database query.
        this.progressMsg = (
            <div style = {{marginTop:'30px'}}>
                     <h3 style = {{color:'green'}}>Updating database, please wait a moment...</h3>
                    <CircularProgress size = {55} thickness = {5.0}/>
            </div>
        );

        // Update component state with the valid credentials.
        this.setState({
            username : uname,
            password1 : pword1,
            password2 : pword2,
            userId: ""
        });
    }


    // This functon handles the form submission. First, the validation function is called which
    // sets the 'this.valid' attribute of the component to true or false. Then if valid, the 
    // updateDatabase() function is called, which first checks to see if username already exists
    // and if not creates a new record for the user. If the latter function returns true
    // a function in App.js is called to log the user in. 
    // The user is then redirected to the '/devices' route, ('DeviceManager.js').
    submit = async (evt) =>{
        evt.preventDefault();  // Prevent the default form action (i.e. don't submit 'GET' url params to this page.)
        this.validate();
        this.forceUpdate();
        if (this.valid){
            if (await this.updateDatabase()){
                this.progressMsg = null;
                 // Logh the user in and redirect to '/devices' route.
                var user = {"username": this.state.username, userId: this.state.userId} 
                this.app.logUserIn(user);

                // A specific message for new users will be displayed in this route if the 'welcome' URL param = 2.
                this.props.history.push("/devices/?welcome=2");  
            }
        }
    }



    // This functions calls functions in App.js which query and update the database.
    // Firstly the database is checked to see if the username already exists. If so, a 
    // message is displayed and the function returns false. If not the database is updated 
    // with the new credentials and it returns true.
    updateDatabase = async () => {

        var res =  await this.props.app.insertNewUser({"username": this.state.username, "password": this.state.password1 });

        if (res.userStatus) {
            
            if (res.userStatus == 'ok') {
                this.setState({userId: res.userId});
                return true;
            } 
            
            if (res.userStatus == 'already exists'){
                this.dialogMsg = (<p style = {{color:'red'}}>A user with this username already exists! Try another one.</p>) 
                this.dialogMsgTitle = "Username in use!"
            }
        }
       
        else {
            this.dialogMsg = (<p style = {{color:'red'}}>{res}</p>)
            this.dialogMsgTitle = "Server error!!"
        }
        this.progressMsg = null;
        this.setState({showMsgDialog: true});
        return false;
    }

    // Rendering the component elements...
    render() {
    
     return(
        <div className = "App">
            <h3 style = {{marginTop: "100px"}}>Sign-up Form:</h3>
            <form onSubmit={this.submit} className="login-box" style = {{height:'250px'}}>
                <input className = "login-field" placeholder="Username" type="text" value={this.state.username} onChange={this.updateUsername} required/>
                <input className = "login-field" placeholder="Password" type="password" value={this.state.password1} onChange={this.updatePassword1} required/>
                <input className = "login-field" placeholder="Re-type password" type="password" value={this.state.password2} onChange={this.updatePassword2} required/>
                <div style = {{marginTop: '20px'}}><Button variant="contained" type="submit" size = "small">Register</Button></div>
            </form>
            {this.progressMsg}
            <MessageDialog  title = {this.dialogMsgTitle}
                            textLines = {[this.dialogMsg]} 
                            onDialogClose = {() =>{
                                this.progressMsg = null;
                                this.setState({showMsgDialog: false});
                            }}
                            open = {this.state.showMsgDialog}/>
        </div>
      );
    }
  }
 
export default withRouter(Signup);