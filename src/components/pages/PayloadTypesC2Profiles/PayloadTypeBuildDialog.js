import React, {useState} from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import {useQuery, gql} from '@apollo/client';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import LinearProgress from '@material-ui/core/LinearProgress';

const GET_Payload_Details = gql`
query GetPayloadDetails($payload_name: String!) {
  payloadtype(where: {ptype: {_eq: $payload_name}}) {
    buildparameters (where: {deleted: {_eq: false} } ){
      description
      name
      id
      parameter
      parameter_type
      required
      verifier_regex
    }
  }
}
`;

export function PayloadTypeBuildDialog(props) {
    const [buildParams, setBuildParams] = useState([]);
    const { loading, error } = useQuery(GET_Payload_Details, {
        variables: {payload_name: props.payload_name},
        onCompleted: data => {
            console.log(data);
            const buildParams = data.payloadtype[0].buildparameters.map((param) => {
              switch(param.parameter_type){
                case "ChooseOne":
                  return {...param, defaultParameter: param.parameter.split("\n")[0], options: param.parameter.split("\n").join(", ")};
                default:
                  return {...param, defaultParameter: param.parameter};
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
                    <TableCell >Parameter</TableCell>
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
                            <b>Verifier Regex: </b><pre style={{display: "inline-block", whiteSpace: "pre-wrap", margin: 0}}>{param.verifier_regex}</pre><br/>
                            </TableCell>
                        </TableRow>
                    ))
                    
                  }
                </TableBody>
              </Table>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={props.handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

