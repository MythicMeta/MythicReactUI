import React from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import {useQuery, gql} from '@apollo/client';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import {useTheme} from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import {ExpandedCallbackSideDetailsTable} from '../ExpandedCallback/ExpandedCallbackSideDetails';

const GET_Payload_Details = gql`
query GetCallbackDetails($callback_id: Int!) {
  callback_by_pk(id: $callback_id){
    payload {
      uuid
      payloadtype{
          ptype
          id
      }
      filemetum {
        filename_text
        agent_file_id
        id
        md5
        sha1
      }
      buildparameterinstances {
        parameter
        id
        buildparameter {
          description
        }
      }
      os
    }
    c2profileparametersinstances(order_by: {c2profile: {name: asc}}) {
      value
      c2profileparameter {
        description
        parameter_type
      }
      c2profile {
        name
      }
      enc_key_base64
      dec_key_base64
    }
    loadedcommands{
      id
      version
      command {
        cmd
        id
        version
      }
    }
    architecture
    description
    domain
    external_ip
    host
    id
    integrity_level
    last_checkin
    ip
    locked
    locked_operator {
      username
    }
    extra_info
    sleep_info
    pid
    os
    user
    agent_callback_id
    operation_id
    process_name
  }
  
}
`;
export function DetailedCallbackTable(props){
    const theme = useTheme();
    const [commands, setCommands] = React.useState([]);
    const [buildParameters, setBuildParameters] = React.useState([]);
    const [c2Profiles, setC2Profiles] = React.useState([]);
    const { loading, error, data } = useQuery(GET_Payload_Details, {
        variables: {callback_id: props.callback_id},
        onCompleted: data => {
            const commandState = data.callback_by_pk.loadedcommands.map( (c) => 
            { 
                return {cmd: c.command.cmd, mythic: c.command.version, payload: c.version} 
            }).sort((a,b) => (a.cmd > b.cmd) ? 1: ((b.cmd > a.cmd) ? -1 : 0));
            setCommands(commandState);
            const buildParametersState = data.callback_by_pk.payload.buildparameterinstances.map( (b) =>
            {
                return {description: b.buildparameter.description, value: b.parameter}
            }).sort((a,b) => (a.description > b.description) ? 1: ((b.description > a.description) ? -1 : 0));
            setBuildParameters(buildParametersState);
            const c2Profiles = data.callback_by_pk.c2profileparametersinstances.reduce( (prev, cur) => {
                if( !(cur.c2profile.name in prev) ){
                    return {...prev, [cur.c2profile.name]: [{description: cur.c2profileparameter.description, 
                      value: cur.value, 
                      enc_key: cur.enc_key_base64, 
                      dec_key: cur.dec_key_base64,
                      parameter_type: cur.c2profileparameter.parameter_type,
                    }]}
                }
                return {...prev, [cur.c2profile.name]: [...prev[cur.c2profile.name], {description: cur.c2profileparameter.description, 
                  value: cur.value, 
                  enc_key: cur.enc_key_base64, 
                  dec_key: cur.dec_key_base64,
                  parameter_type: cur.c2profileparameter.parameter_type,
                }]}
            }, {});
            const c2ProfilesState = Object.keys(c2Profiles).reduce( (prev, cur) => {
                return [...prev, {
                    c2_profile: cur,
                    parameters: c2Profiles[cur].sort((a,b) => (a.description > b.description) ? 1: ((b.description > a.description) ? -1 : 0))
                }];
            }, []);
            setC2Profiles(c2ProfilesState);
        }
        });
    if (loading) {
     return <LinearProgress style={{marginTop: "10px"}}/>;
    }
    if (error) {
     console.error(error);
     return <div>Error!</div>;
    }
    return (
        <React.Fragment>
          <DialogTitle id="form-dialog-title">Callback Configuration</DialogTitle>
          <DialogContent dividers={true}>
          <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                  Callback Information
              </Typography>
            </Paper>
            <ExpandedCallbackSideDetailsTable {...data.callback_by_pk} />
                
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                  Payload Information
              </Typography>
            </Paper>
            <Table size="small" aria-label="details" style={{ "overflowWrap": "break-word"}}>
                <TableHead>
                  <TableRow hover>
                    <TableCell >Payload Info</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow hover>
                        <TableCell>Payload Type</TableCell>
                        <TableCell>{data.callback_by_pk.payload.payloadtype.ptype}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Selected OS</TableCell>
                        <TableCell>{data.callback_by_pk.payload.os}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>UUID</TableCell>
                        <TableCell>{data.callback_by_pk.payload.uuid}</TableCell>
                    </TableRow>
                    { data.callback_by_pk.payload.filemetum ? (
                        <TableRow key={'filename_text'} hover>
                            <TableCell>Filename</TableCell>
                            <TableCell>{data.callback_by_pk.payload.filemetum.filename_text}</TableCell>
                        </TableRow>
                    ) : null }
                    <TableRow hover>
                        <TableCell>Download URL</TableCell>
                        <TableCell>{window.location.origin + "/direct/download/" + data.callback_by_pk.payload.filemetum.agent_file_id}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>SHA1</TableCell>
                        <TableCell>{data.callback_by_pk.payload.filemetum.sha1}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>MD5</TableCell>
                        <TableCell>{data.callback_by_pk.payload.filemetum.md5}</TableCell>
                    </TableRow>
                </TableBody>
              </Table>
              <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                    Build Parameters
                </Typography>
              </Paper>
            <Table size="small" aria-label="details" style={{ "overflowWrap": "break-word"}}>
                <TableHead>
                  <TableRow>
                    <TableCell style={{width: "30%"}}>Parameter</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    buildParameters.map( (cmd, i) => (
                        <TableRow key={"buildprop" + i + "for" + data.callback_by_pk.payload.id} hover>
                            <TableCell>{cmd.description}</TableCell>
                            <TableCell>{cmd.value}</TableCell>
                        </TableRow>
                    ))
                    
                  }
                </TableBody>
              </Table>
                { c2Profiles.map( (c2) => (
                    <React.Fragment key={"c2frag" + data.callback_by_pk.payload.id + c2.c2_profile}>
                          <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                            <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                                {c2.c2_profile}
                            </Typography>
                          </Paper>
                        <Table size="small" aria-label="details" style={{"overflowWrap": "break-word"}}>
                            <TableHead>
                              <TableRow>
                                <TableCell style={{width: "30%"}}>Parameter</TableCell>
                                <TableCell>Value</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody style={{whiteSpace: "pre"}}>
                              {
                                c2.parameters.map( (cmd, j) => (
                                    <TableRow key={"c2frag" + data.callback_by_pk.payload.id + c2.c2_profile + j} hover>
                                        <TableCell>{cmd.description}</TableCell>
                                        <TableCell>
                                          {cmd.parameter_type === "Dictionary" || cmd.parameter_type === "Array" ? (
                                            JSON.stringify(JSON.parse(cmd.value), null, 2)
                                            ) : (cmd.value)}
                                        </TableCell>
                                    </TableRow>
                                ))
                              }
                            </TableBody>
                          </Table>
                      </React.Fragment>
                ))}
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                  Loaded Commands
              </Typography>
            </Paper>
            <Table size="small" aria-label="details" style={{"overflowWrap": "break-word"}}>
            <TableHead>
              <TableRow>
                <TableCell>Command Name</TableCell>
                <TableCell>Mythic Version</TableCell>
                <TableCell>Loaded Version</TableCell>
                <TableCell style={{width: "5rem"}}>Documentation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {
                commands.map( (cmd) => (
                    <TableRow key={cmd.cmd + data.callback_by_pk.payload.id} hover>
                        <TableCell>{cmd.cmd}</TableCell>
                        <TableCell>{cmd.mythic}</TableCell>
                        <TableCell>{cmd.payload}</TableCell>
                        <TableCell>
                          <Button variant="contained" color="primary" target="_blank"
                             href={"/docs/agents/" + data.callback_by_pk.payload.payloadtype.ptype + "/commands/" + cmd.cmd}>Docs</Button> 
                        </TableCell>
                    </TableRow>
                ))
                
              }
            </TableBody>
          </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={props.onClose} variant="contained" color="primary">
              Close
            </Button>
        </DialogActions>
        </React.Fragment>
        )
}

