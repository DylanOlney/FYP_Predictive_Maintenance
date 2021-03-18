import React,  { Component }  from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

class ConfirmDialog extends Component {
  
    constructor(props) {
        super(props)
    } 

   
    render () {
        var shown = this.props.open;
        var title = this.props.title;
        var text = this.props.textLines.map(
            (line, idx)=>{
                return(<div style = {{marginBottom: '10px'}} id = {"" + idx}>{line}</div>);
        });
    
        return (
            <div>
                <Dialog fullWidth={true} maxWidth={"xs"}
                        open={shown}
                        TransitionComponent={Transition}
                        keepMounted
                        aria-labelledby="alert-dialog-slide-title"
                        aria-describedby="alert-dialog-slide-description">
                    <DialogTitle id="alert-dialog-slide-title">{title}</DialogTitle>
                    <DialogContent>{text}</DialogContent>
                    <DialogActions>
                        <Button variant="contained" size = "small" onClick={this.props.ok} color="primary">OK</Button>
                        <Button variant="contained" size = "small" onClick={this.props.cancel} color="primary">Cancel</Button>
                    </DialogActions>
                </Dialog>
        </div>
      );
  }
  
}

export default ConfirmDialog;