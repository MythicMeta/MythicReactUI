import React, { useEffect }  from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import {useQuery, gql} from '@apollo/client';
import LinearProgress from '@material-ui/core/LinearProgress';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-xcode';
import {useTheme} from '@material-ui/core/styles';

const getProfileOutputQuery = gql`
query getProfileOutput($id: Int!) {
  getProfileOutput(id: $id) {
    status
    error
    output
  }
}
`;

export function C2ProfileOutputDialog(props) {
    const theme = useTheme();
    const { loading, error, data } = useQuery(getProfileOutputQuery, {
        variables: {id: props.profile_id},
        onCompleted: data => {
            
        },
        fetchPolicy: "network-only"
    });
    if (loading) {
     return <LinearProgress />;;
    }
    if (error) {
     console.error(error);
     return <div>Error!</div>;
    }
  
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
              value={data.getProfileOutput.output}
              width={"100%"}
              minLines={2}
              maxLines={100}
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

