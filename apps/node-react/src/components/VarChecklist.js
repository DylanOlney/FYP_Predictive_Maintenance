import React,  { Component }  from 'react';
import '../App.css';
import './css/VarChecklist.css'
import Button from '@material-ui/core/Button';
import '../App.css';
import './css/DeviceHistory.css';

/* =====================================================================================
This class renders a checklist component and is used by both the DeviceHistory and
LiveMonitoring components. The device in question is passed in as a prop and checkboxes
are created for each device variable. A handler function detects checkbox changes and
creates an object, 'this.checkedVars' which contains the var names as keys and boolean 
values as values. Callback functions in the calling components receive this object upon
every change and take the appropriate action.
======================================================================================== */

class VarChecklist extends Component {

  constructor(props) {
    super(props);

    // Class attributes.
    this.checkedVars  = {}; // This object will contain a boolean value for each var.
    this.varStack = [];
    this.device = this.props.device;

    // Looping through the devices vars and initializing all 'checkedVars' values to false.
    this.device.vars.map((varName, idx)=>{
       this.checkedVars[varName] = false;
    });
  }

  componentDidMount = () => {}

  // Checkbocx change handler. Sets 'checkedVars' values according to the state of the checklist
  // and passes this object back to the calling component.
  handleCheckboxChange = (e) =>{
    this.checkedVars[e.target.id] = e.target.checked;
    this.forceUpdate();
    if (e.target.checked) {
          this.varStack.push(e.target.name);
          this.props.callBack(this.checkedVars, e.target.name);
    }
    else {
      this.varStack.splice( this.varStack.indexOf(e.target.name), 1);
      this.props.callBack(this.checkedVars, this.varStack[this.varStack.length-1]);
    }
  }

  // Handles a button click which enables the toggling of the check state of all the checkboxes at once.
  toggleCheckAll = () =>{
    var flag = false;
    this.device.vars.map((varName, idx)=>{
        if (this.checkedVars[varName]==true) flag = true;
    });
    this.device.vars.map((varName, idx)=>{
      this.checkedVars[varName] = !flag;
    });
    this.forceUpdate();
    this.props.callBack(this.checkedVars);
  }


  // Rendering the component...
  render() {
    // Creating an array of checkbox elements, one for each var.
    var checkBoxes = this.device.vars.map((varName, idx)=>{
       return (
        <label className="container" >{varName}
        <input type="checkbox" id = {varName} name = {varName} onChange={this.handleCheckboxChange} checked={this.checkedVars[varName]}/>
        <span className="checkmark"></span>
        </label>
       );
    })
  
    // Returning the render content..
    return(
          <div>
              <p><b>{this.device.model_id}/{this.device.device_id}</b> device vars:</p>
              <div style = {{marginTop: '15px', marginBottom: '15px'}}>
                      <Button onClick ={this.toggleCheckAll} variant="contained"  size = "small" >Toggle All</Button>
              </div>
              <div className = "left-sidebar-subdiv" >
              {checkBoxes}
              </div>
          </div>
      );
    }
  }
 

  export default VarChecklist;