import React from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {ResponseDisplayTable} from './ResponseDisplayTable';


export function ResponseDisplayTableDialogTable({table, callback_id, title, onClose}) {
      
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">{title}</DialogTitle>
        <DialogContent dividers={true}>
            <ResponseDisplayTable table={table} callback_id={callback_id} />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

