
import React,  { Component }  from 'react';
import Switch from '@material-ui/core/Switch';
import { Alert, AlertTitle } from '@material-ui/lab';
import './css/DeviceHistory.css'

class PdMComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            checked: false
        } 
    }

    handleChange = (event) => {
        this.setState({ checked: event.target.checked });
        this.props.handlePdMState(event.target.checked);
    };

    render() {
        var alertMsg = null;
        var severity;
        var title;
        var message;
        if (this.props.showMessage == true){
            if (this.props.PdMStatus === null) {
                severity = 'info';
                title =  'Waiting...';
                message = 'Waiting for server response...';
            }
            else {
                severity = this.props.PdMStatus.severity;
                title =    this.props.PdMStatus.title;
                message =  this.props.PdMStatus.message;
            }
           
            alertMsg = (<div>
                <p>Device status:</p>
                <Alert severity={severity}>
                <AlertTitle>{title}</AlertTitle>
                {message}
                </Alert>
                </div>
            );
        }

        return(<div>
             
             <div className = "left-sidebar-subdiv" >
             <p><b>Predictive Mainteneance</b></p>
             <p>PdM monitoring:</p>
             <span>
             <b>OFF</b>
             <Switch checked={this.state.checked}
                     onChange={this.handleChange}
                     name="PdMToggle"
                     color="primary"
                     inputProps={{ 'aria-label': 'secondary checkbox' }}/>
             <b>ON</b>
             </span>
             <div style = {{marginTop: '20px'}}>
                {alertMsg}
             </div>
             </div>
        </div>);    
    }
}

export default PdMComponent;


