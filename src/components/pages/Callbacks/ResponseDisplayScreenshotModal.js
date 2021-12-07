import React from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';

export function ResponseDisplayScreenshotModal(props) {
    const [zoom, setZoom] = React.useState(false);
    const toggleZoom = () => {
      setZoom(!zoom);
    }
  return (
    <React.Fragment>
        <DialogContent dividers={true}>
            <img onClick={toggleZoom} src={props.href} style={{width: zoom ? "" : "100%", height: zoom ? "" : "100%", cursor: zoom ? "zoom-out" : "zoom-in"}} />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={props.onClose} color="primary">
            Close
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

