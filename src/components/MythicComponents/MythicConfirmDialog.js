import React from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import {MythicDialog} from './MythicDialog';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogContent from '@material-ui/core/DialogContent';
import {useTheme} from '@material-ui/core/styles';

export function MythicConfirmDialog(props) {
    const theme = useTheme();
    const handleSubmit = () => {
        props.onSubmit();
        props.onClose();
    }

  return (
    <MythicDialog fullWidth={false} maxWidth="sm" open={props.open} onClose={()=>{props.onClose()}} innerDialog={
        <React.Fragment>
            <DialogTitle >{props.title ? (props.title) : ("Are you sure?")}</DialogTitle>
            {props.dialogText === undefined ? (null) : (
              <DialogContent dividers={true} style={{maxHeight: "calc(70vh)"}}>
                <DialogContentText>
                  {props.dialogText}
                </DialogContentText>
              </DialogContent>
            )}
            <DialogActions>
              <Button onClick={props.onClose} variant="contained" color="primary">
                {props.cancelText ? (props.cancelText) : ("Close")}
              </Button>
              <Button onClick={handleSubmit} autoFocus variant="contained" style={{backgroundColor: theme.palette.warning.main}}>
                {props.acceptText ? (props.acceptText) : ("Remove")}
              </Button>
            </DialogActions>
        </React.Fragment>
  } />
  );
}
