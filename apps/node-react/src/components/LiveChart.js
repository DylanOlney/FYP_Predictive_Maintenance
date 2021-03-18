import React,  { Component }  from 'react';
import RTChart from 'react-rt-chart';
import './css/c3.css';

/* ============================================================================================
This component is used by the 'LiveMonitoring.js' component and renders a real-time chart for
a device variable. The data and fields are passed in as props.
================================================================================================ */
class LiveChart extends Component {
  
    constructor(props) {
      super(props);
    }
  
    render() {
        var data = this.props.data;
        var field = this.props.field;
        data['date'] =  new Date();
        return (<div style = {{textAlign: 'center', backgroundColor:'#FFF2E5', borderRadius: '10px', padding: '25px', marginBottom: '25px'}}>
            <h3>{field[0]}</h3>
            <RTChart  chart = {{point: {show: false}}} className = 'c3' style = {{height:'55vh'}} fields={field} data={data} /> 
        </div>)
    }
}
export default LiveChart;
  
    