import React,  { Component }  from 'react';
import { withRouter } from 'react-router-dom';
import '../App.css';

/* ================================================================================================================== 
This class exists merely to provide a log-out route and a link in the navigation bar to enable the user to log out.
Nothing is rendered as this page immediately redirects to the home page after calling a log out function in App.js.
=====================================================================================================================*/
class Logout extends Component {

  constructor(props) {
    super(props);
  }

  // Calling the log out function in App.js and redirecting to the home page as soon as component mounts.
  componentDidMount = () => {
    this.props.app.logUserOut();
    this.props.history.push("/?goodbye=1");  // The home page route. It will display a message if the 'goodbye' URL param = 1.
  }

  render() {
      return(<div></div>)
  }

}
export default withRouter(Logout);
