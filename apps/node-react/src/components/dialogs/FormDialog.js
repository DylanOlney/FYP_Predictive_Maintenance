
import React,  { Component }  from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

class FormDialog extends Component {
    constructor(props) {
        super(props)
    } 


  onSubmit = (evt) => {
    evt.preventDefault();
    this.props.onSubmit();
  };

 
  render () {
   
    var shown = this.props.open;
    var title = this.props.title;
    var content = this.props.content;
      
    return (
        <div>
          <Dialog fullWidth={true} maxWidth={"xs"}
            open={shown}
            TransitionComponent={Transition}
            keepMounted
            // onClose={this.handleClose}
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description">
            <form onSubmit={this.onSubmit}>
                <DialogTitle id="alert-dialog-slide-title">{title}</DialogTitle>
                {content}
                <DialogActions>
                <Button type = "submit" variant="contained" size = "small" color="primary">OK</Button>
                <Button onClick = {this.props.onCancel} variant="contained" size = "small" color="primary">Cancel</Button>
                </DialogActions>
            </form>
          </Dialog>
        </div>
      );
  }
  
}

export default FormDialog;