import React, { Component } from 'react';
import Paper from "@material-ui/core/Paper";
import { EventTracker} from '@devexpress/dx-react-chart';
import {Chart, ArgumentAxis,ValueAxis,SplineSeries, LineSeries, Title,Tooltip} from "@devexpress/dx-react-chart-material-ui";
import { withStyles } from '@material-ui/core/styles';

/* =============================================================================================
This component is used by the 'DeviceHistory.js' component and renders a static chart for
showing a device variable's complete history. The data is passed in as a props.
================================================================================================ */

// A custom theme for the Material-UI 'Paper' component. This is the background for the chart.
const styles = theme => ({
  root: {
    textAlign: 'center',
    backgroundColor: '#FFF2E5',
    padding: theme.spacing.unit * 5,
  }
});

class LineChart extends Component {
  render() {
    var d  = this.props.data;
    
    var classes = this.props.classes;
    return (
      <div style={{marginBottom:'20px'}}>
      <Paper elevation={5} className={classes.root} >
        <Chart  data={d}  width = {850}>
          <Title text = {this.props.title} />  
          <ArgumentAxis showGrid />
          <ValueAxis  showGrid />
          <LineSeries valueField="value" argumentField="time" />
          <EventTracker />
          <Tooltip />
        </Chart>
        <div style = {{textAlign:'center'}}><p>t (seconds)</p></div>
      </Paper>
      </div>
    );
  }
}

export default withStyles(styles)(LineChart);
