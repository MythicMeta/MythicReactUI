import React from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-xcode';
import {useTheme} from '@material-ui/core/styles';


export function C2ProfileStartStopOutputDialog(props) {
  const theme = useTheme();
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">{props.payload_name}'s Current Stdout/Stderr</DialogTitle>
        <DialogContent dividers={true}>
          <DialogContentText>
            This is the current Stdout/Stderr for the profile. This goes away once you close this dialog.
          </DialogContentText>
          <AceEditor 
              mode="json"
              theme={theme.palette.type === "dark" ? "monokai" : "xcode"}
              fontSize={14}
              showGutter={true}
              height={"100px"}
              highlightActiveLine={true}
              value={props.output}
              width={"100%"}
              minLines={2}
              maxLines={50}
              setOptions={{
                showLineNumbers: true,
                tabSize: 4,
                useWorker: false
              }}/>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={props.onClose} color="primary">
            Close
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

