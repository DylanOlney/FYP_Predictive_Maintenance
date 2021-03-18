import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import Button from '@material-ui/core/Button';
import '../App.css';
import './css/DeviceHistory.css';



/* ==========================================================================================
The purpose of this class is to display a slider to enable the user to limit the number of 
of MQTT records returned when querying the database for device history. It is used by the
'DeviceHistory' component which is one of the main routed components of the app. The slider value
is passed back to that class which uses it to limit the number of database results returned.
============================================================================================*/


// Slider labels and values.
const marks = [
    {
      value: 0,
      label: 'All',
    },
    {
      value: 50,
      label: '50',
    },
    {
      value: 100,
      label: '100',
    },
    {
      value: 150,
      label: '150',
    },
    {
      value: 200,
      label: '200',
    },
  ];


class QueryLimiter extends React.Component {
 
    constructor(props){
      super(props);
      this.state = {
          value: 0
      }
    }

    // Slider change handler.
    handleChange = (e, val) => {
        this.setState({value: val})
        this.props.callBack(val)  // Call back to DeviceHistory.js with the value.
    }


    // Rendering the component's elements.
    render = () => {

        var temp = ""
        if (this.state.value > 0) temp = `last ${this.state.value} entries.`;
        else temp = "all entries."

        return (

            <div className = "sub-div2" style = {{ width:'400px', marginTop: '50px'}}>
                <h3 style={{marginTop: '20px'}}>Device history query limiter.</h3>
                <Typography id="discrete-slider-custom" align = 'left' gutterBottom>
                    If you wish, you may limit the number of MQTT message records retrieved from the database for this device. 
                    Use the slider to select a quantity and then click 'OK' to make the query.
                </Typography>
                <Typography id="discrete-slider-custom" align = 'left' gutterBottom>
                  
                </Typography>
                <Slider
                    defaultValue={0}
                    min = {0}
                    max = {200}
                    onChange = {this.handleChange}
                    aria-labelledby="discrete-slider-custom"
                    step={10}
                    valueLabelDisplay = 'auto'
                    marks={marks}
                />
                <Typography gutterBottom>
                   Select {temp}
                </Typography>
                <div style = {{marginTop: '25px'}}>
                      <Button onClick= {() => {this.props.doQuery()}} variant="contained"  size = "small" fullWidth = {false}>OK</Button>
                </div>
            </div>
      );
 }

}

export default QueryLimiter
