import React, {useState} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useQuery, gql} from '@apollo/client';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import LinearProgress from '@mui/material/LinearProgress';

const GET_C2_Details = gql`
query GetPC2Details($payload_name: String!) {
  c2profile(where: {name: {_eq: $payload_name}}) {
    c2profileparameters(where: {deleted: {_eq: false}}) {
      default_value
      description
      format_string
      name
      parameter_type
      id
      randomize
      required
      verifier_regex
    }
  }
}
`;

export function C2ProfileBuildDialog(props) {
    const [buildParams, setBuildParams] = useState([]);
    const { loading, error } = useQuery(GET_C2_Details, {
        variables: {payload_name: props.payload_name},
        onCompleted: data => {
            const buildParams = data.c2profile[0].c2profileparameters.map((param) => {
              switch(param.parameter_type){
                case "ChooseOne":
                  return {...param, defaultParameter: param.default_value.split("\n")[0], options: param.default_value.split("\n").join(", ")};
                case "Date":
                  return {...param, defaultParameter: "Today with an offset of " + param.default_value + " days"}
                case "Dictionary":
                  return {...param, defaultParameter: JSON.stringify(JSON.parse(param.default_value), null, 2)};
                default:
                  return {...param, defaultParameter: param.default_value};
              }
            });
            setBuildParams(buildParams);
        }
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
        <DialogTitle id="form-dialog-title">{props.payload_name}'s Build Parameters</DialogTitle>
        <DialogContent dividers={true}>
          <DialogContentText>
            These are the build parameters associated with this payload
          </DialogContentText>
            <Table size="small" aria-label="details" style={{"tableLayout": "fixed", "overflowWrap": "break-word"}}>
                <TableHead>
                  <TableRow>
                    <TableCell style={{width: "20%"}}>Parameter</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    buildParams.map( (param) => (
                        <TableRow key={"buildprop" + param.id} hover>
                            <TableCell>{param.description}</TableCell>
                            <TableCell>
                              <b>Scripting/Building Name: </b><pre style={{display: "inline-block", whiteSpace: "pre-wrap", margin: 0}}>{param.name}</pre><br/>
                              <b>Parameter Type: </b><pre style={{display: "inline-block", whiteSpace: "pre-wrap", margin: 0}}>{param.parameter_type}</pre><br/>
                              <b>Default Parameter: </b><pre style={{display: "inline-block", whiteSpace: "pre-wrap", margin: 0}}>{param.defaultParameter}</pre><br/>
                              {param.parameter_type === "ChooseOne" ? (
                              <React.Fragment>
                                <b>Parameter Options: </b><pre style={{display: "inline-block", whiteSpace: "pre-wrap", margin: 0}}>{param.options}</pre><br/>
                              </React.Fragment>
                            ) : (null)}
                              <b>Required? </b><pre style={{display: "inline-block", whiteSpace: "pre-wrap", margin: 0}}>{param.required ? "Yes": "No"}</pre><br/>
                              {param.verifier_regex === "" ? (null) : (<React.Fragment>
                                <b>Verifier Regex: </b><pre style={{display: "inline-block", whiteSpace: "pre-wrap", margin: 0}}>{param.verifier_regex}</pre><br/>
                              </React.Fragment>)}
                              <b>Randomize value?: </b><pre style={{display: "inline-block", whiteSpace: "pre-wrap", margin: 0}}>{param.randomize ? "Yes" : "No" }</pre><br/>
                              {param.format_string === "" ? (null) : (<React.Fragment>
                                <b>Random Format String: </b><pre style={{display: "inline-block", whiteSpace: "pre-wrap", margin: 0}}>{param.format_string}</pre><br/>
                              </React.Fragment>)}
                              
                            </TableCell>
                        </TableRow>
                    ))
                    
                  }
                </TableBody>
              </Table>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={props.onClose} color="primary">
            Close
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

