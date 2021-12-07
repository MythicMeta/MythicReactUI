import React, {useState} from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {useQuery, gql} from '@apollo/client';
import LinearProgress from '@material-ui/core/LinearProgress';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-xcode';

const getProfileConfigQuery = gql`
query getProfileConfigOutput($id: Int!, $filename: String!) {
  downloadContainerFile(id: $id, filename: $filename) {
    status
    error
    filename
    data
  }
}
`;

export function C2ProfileConfigDialog(props) {
    const [config, setConfig] = useState("");
    const { loading, error } = useQuery(getProfileConfigQuery, {
        variables: {id: props.profile_id, filename: "config.json"},
        onCompleted: data => {
            if(data.downloadContainerFile.status === "error"){
                setConfig("Errored trying to read file from container\n" + data.downloadContainerFile.error);
            }else{
                console.log(data);
                setConfig(atob(data.downloadContainerFile.data));
            }
        },
        fetchPolicy: "network-only"
    });
    
    if (loading) {
     return <LinearProgress />;
    }
    if (error) {
     console.error(error);
     return <div>Error!</div>;
    }
    const onConfigSubmit = () => {
        props.onConfigSubmit(btoa(config));
        props.onClose();
    }
    const onChange = (value, event) => {
        setConfig(value);
    }
  
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">{props.payload_name}'s Current Configuration</DialogTitle>
        <DialogContent dividers={true}>
            <AceEditor 
              mode="json"
              theme={"monokai"}
              onChange={onChange}
              fontSize={14}
              showGutter={true}
              highlightActiveLine={true}
              value={config}
              focus={true}
              width={"100%"}
              setOptions={{
                showLineNumbers: true,
                tabSize: 4
              }}/>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={props.onClose} color="primary">
            Close
          </Button>
          <Button variant="contained" onClick={onConfigSubmit} color="secondary">
            Submit
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

