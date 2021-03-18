import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import '../App.css';
import './css/DeviceHistory.css';
import VarChecklist from './VarChecklist'
import MessageDialog from './dialogs/MessageDialog';
import CircularProgress from '@material-ui/core/CircularProgress';
import LineChart from './LineChart';
import QueryLimiter from './QueryLimiter';
import Button from '@material-ui/core/Button';
import moment from 'moment';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

const Scroll = require('react-scroll');
const Element = Scroll.Element;
const scroller = Scroll.scroller;
const scroll = Scroll.animateScroll

/* ========================================================================================================
This is a BrowserRouter enabled class component for which a temporary link appears in the navigaion bar,
the purpose of which is to enable the user view a graphical history of a device's variables. Users may
select the variables to view from a checklist, and static charts will appear showing the variables' values
over time since publishing began. If the user so wishes, they can limit the number of database queries to 
include only the last x amount of entries by means of a slider.
============================================================================================================ */

class DeviceHistory extends Component {

  constructor(props) {
    super(props);

    // Class attributes.
    this.app = this.props.app;
    this.deviceData = [];
    this.graphData = [];
    this.graphs = [];
    this.historyLimit = 0;
    this.startTime = 0;

    // Creating a device object from data passed in via URL params.
    var user_id = this.app.getUser().userId;
    var params = new URLSearchParams(window.location.search);
    this.device = {
      user_id: user_id,
      model_id: params.get('model_id'),
      device_id: params.get('device_id'),
      vars: [],
      limit: 0
    };

    // Initializing state...
    this.state = {
      dialog: {
        show: false,
        title: "",
        message: "",
        onclose: null
      },
      loading: false,
      loadingMessage: "Fetching data...",
      lastChecked: null
    };
  }

  // A function to redirect back to 'DeviceManager' page.
  backToDevicePage = () => {
    this.props.history.push("/devices");
  }

  // A function used for sorting variable names alphanumerically.
  sortAlphaNum = (a, b) => {
    return a.localeCompare(b, 'en', { numeric: true });
  }

  // Called when the user makes a change to the vars checklist.
  // Selectively creates var graphs according to the state of the checklist and stores 
  // them in 'this.graphs' attribute, the contents of which are displayed upon rendering.
  checkListCallBack = (vars, lastChecked) => {
    this.graphs = this.graphData.map((entry, idx) => {
      var varName = Object.keys(entry)[0];
      if (vars[varName] === true) {
        var data = entry[varName];
        return (<Element name={varName} key={idx}><LineChart data={data} title={varName} /></Element>)
      }
    });
    var temp = [];
    this.graphs.map((g) => {
      if (g != null) temp.push(g);
    });
    this.graphs = temp;

    if (lastChecked === undefined) lastChecked = null;
    this.setState({ lastChecked: lastChecked });
    console.log("last checked: " + lastChecked);
  }

  
  // Once the component updates, scroll to the most recently selected var chart.
  componentDidUpdate = () => {
    if (this.state.lastChecked != null) {
      scroller.scrollTo(this.state.lastChecked, {
        duration: 1500,
        delay: 0,
        smooth: true,
        containerId: 'graphs-container'
      });
    }
  }


  // This asynchronous method gets a device's stored message data 
  // from the database and converts it into a format that is
  // compatable with the Chart (graph) component. Messages are displayed
  // if no data has been published yet or if there was a problem getting the data.
  getDeviceData = async () => {

    // Set loading bar visible while data is loading.
    this.setState({ loading: true });

    // A function in App.js is responsible for making the database query.
    // Code execution will halt here until the query resturns a response.
    var res = await this.app.getDeviceHistory(this.device);
    
    // Show messages if there was no data, or some other propblem..
    if (res.status == 'ok') {
      this.deviceData = res.deviceHistory;
      if (this.deviceData.length == 0) {
        this.setState({
          loading: false,
          dialog: {
            show: true,
            onclose: this.backToDevicePage,
            message: "No data has been published for this device yet!",
            title: "No data yet!"
          }
        });
        return;
      }
    }
    else if (res.status == 'error') {
      this.setState({
        loading: false,
        dialog: {
          show: true,
          message: res.msg,
          title: "Error!",
          onclose: this.backToDevicePage,
        }
      });
      return;
    }

    // If code execution gets to here, the query was successful.

    // Sort the data timewise from last entry to first (descending).
    this.deviceData.sort((a, b) => { return a.time - b.time; }); 


    // Getting the names of the device's vars from the last message, (deviceData[0]). 
    var varNames = Object.keys(this.deviceData[0].values).sort(this.sortAlphaNum);
    this.device.vars = varNames;

    // Looping through the data and converting it into chart compatable format.
    this.graphData = varNames.map((varName, i) => {
      var graphValues = this.deviceData.map((entry, j) => {
        if (j == 0) this.startTime = Math.round(entry.time);
        var varTime = Math.round(entry.time) - this.startTime;
        return { 'time': varTime, 'value': entry.values[varName] }
      });
      var temp = {}
      temp[varName] = graphValues;
      return temp;
    });
    
    // Finally, hide the loading indicator.
    this.setState({ loading: false });
  }


  // A callback for the 'QueryLimiter' component.
  // Sets the number of message entries that will be returned from the database query
  limiterCallBack = (val) => {
    this.device.limit = val;
  }

  // A function to remove the nav link for this route when the component dismounts.
  componentWillUnmount = () => {
    this.props.app.removeTempNavLink();
  }


  // Rendering the elements.
  // The left sidebar contains the var checklist component.
  // The central block displays the charts that are selected.
  render() {

    // Vars to hold render content.
    var centreContent = null;
    var leftContent = null;
    var rightContent = null;

    // Showing the loading bar if data is still loading...
    if (this.state.loading) {
      if (!this.state.showNoDataMsg) {
        centreContent = (
          <div style={{ marginTop: '150px', marginBotton: '100px', textAlign: 'center' }}>
            <h3>{this.state.loadingMessage}</h3>
            <div style={{ marginTop: '30px' }}><CircularProgress size={55} thickness={5.0} /></div>
          </div>);
      }
    }

    else {
      // If no query was made yet, show the query limiter option. This component has a slider and a button to execute the query.
      if (this.deviceData.length == 0)  centreContent = (<QueryLimiter callBack={this.limiterCallBack} doQuery={this.getDeviceData} />);

      // Otherwise, if query was made and data has loaded, show the var checklist and a message stating that the query was successful.
      // Also propmt the user to select vars for which to view charts.
      else {
        leftContent = (
          <VarChecklist device={this.device} callBack={this.checkListCallBack} />
        )

        var st = moment(this.startTime * 1000).toObject();
        var timeInfo = (<p><span>Start time (t = 0) = {st.hours}:{st.minutes}:{st.seconds}</span>
          <span style={{ marginLeft: '20px' }}>on: {st.date}/{st.months}/{st.years}</span></p>)

        // If no vars were selected in the checklist yet, prompt user to select some.
        if (this.graphs.length === 0) {
          centreContent = (
            <div className='sub-div'>
              <div>
                <h3>{this.device.model_id}/{this.device.device_id} history.</h3>
                <CheckCircleIcon style={{ color: 'green', fontSize: '50px' }} />
                <h3>{this.deviceData.length} records returned.</h3>
              </div>
              <p>Select device variables on the left to view charts of their values. </p>
            </div>);
        }
        // Else, display the selected charts.
        else {
          centreContent = (
            <div>
              <h3 style={{ marginTop: '20px' }}>Historical charts for {this.device.model_id}/{this.device.device_id}:</h3>
              {timeInfo}
              <div className='sub-div' id='graphs-container'>
                {this.graphs}
              </div>
            </div>);
        }
      }
    }

    // Returning the render content.
    return (
      <div style={{ textAlign: "center", overflow: 'auto', height: '100vh', width: '100vw' }}>
        <div className="left-sidebar">{leftContent}</div>
        <div className="central-block">{centreContent}</div>
        <div className="right-sidebar">{rightContent}</div>
        <MessageDialog title={this.state.dialog.title}
          textLines={[this.state.dialog.message]}
          onDialogClose={this.state.dialog.onclose}
          open={this.state.dialog.show} />
      </div>
    );
  }
}


export default withRouter(DeviceHistory);