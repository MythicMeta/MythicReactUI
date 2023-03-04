import React from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import {useQuery, gql, useMutation} from '@apollo/client';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import {useTheme} from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { toLocalTime } from '../../utilities/Time';
import {PayloadsTableRowBuildProcessPerStep} from './PayloadsTableRowBuildProgress';
import {b64DecodeUnicode} from '../Callbacks/ResponseDisplay';
import {AddRemoveCommandsDialog} from './AddRemoveCommandsDialog';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import { snackActions } from '../../utilities/Snackbar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';

const GET_Payload_Details = gql`
query GetPayloadDetails($payload_id: Int!, $operation_id: Int!) {
  payload(where: {id: {_eq: $payload_id}, operation_id: {_eq: $operation_id}}) {
    uuid
    wrapped_payload_id
    payloadtype{
        name
    }
    creation_time
    payloadcommands {
      id
      version
      command {
        cmd
        id
        version
      }
    }
    filemetum {
      filename_text
      agent_file_id
      id
      md5
      sha1
    }
    payload_build_steps(order_by: {step_number: asc}) {
      step_name
      step_number
      step_success
      step_stdout
      step_stderr
      step_description
      start_time
      end_time
      id
    }
    buildparameterinstances {
      value
      id
      enc_key_base64
      dec_key_base64
      buildparameter {
        description
        parameter_type
      }
    }
    os
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
  }
}
`;
const addCommandsMutation = gql`
mutation addCommandsMutation($command_id: Int!, $payload_id: Int!) {
  insert_payloadcommand_one(object: {command_id: $command_id, payload_id: $payload_id}) {
    id
    command {
      cmd
    }
  }
}
`;
const removeCommandsMutation = gql`
mutation removeCommandsMutation($command_id: Int!, $payload_id: Int!) {
  delete_payloadcommand(where: {command_id: {_eq: $command_id}, payload_id: {_eq: $payload_id}}) {
    returning {
      command {
        cmd
      }
    }
  }
}
`;
export function DetailedPayloadTable(props){
    return (
        <React.Fragment>
          <DialogTitle id="form-dialog-title">Payload Configuration</DialogTitle>
          <DialogContent dividers={true}>
           <DetailedPayloadInnerTable {...props} />
          </DialogContent>
          <DialogActions>
            <Button onClick={props.onClose} variant="contained" color="primary">
              Close
            </Button>
        </DialogActions>
        </React.Fragment>
        )
}

function DetailedPayloadInnerTable(props){
    const me = props.me
    const theme = useTheme();
    const [commands, setCommands] = React.useState([]);
    const [buildParameters, setBuildParameters] = React.useState([]);
    const [c2Profiles, setC2Profiles] = React.useState([]);
    const [buildSteps, setBuildSteps] = React.useState([]);
    const [openAddRemoveCommandsDialog, setOpenAddRemoveCommandsDialog] = React.useState(false);
    const [openProgressIndicator, setOpenProgressIndicator] = React.useState(false);
    const [addProgress, setAddProgress] = React.useState(0);
    const addTotal = React.useRef(0);
    const [removeProgress, setRemoveProgress] = React.useState(0);
    const removeTotal = React.useRef(0);
    const commandMods = React.useRef({"add": 0, 
                                      "remove": 0,
                                      "commandsToAdd": [],
                                      "commandsToRemove": []})
    const { loading, error, data } = useQuery(GET_Payload_Details, {
        variables: {payload_id: props.payload_id, operation_id: me.user.current_operation_id},
        fetchPolicy: "no-cache",
        onCompleted: data => {
            const commandState = data.payload[0].payloadcommands.map( (c) => 
            { 
                return {cmd: c.command.cmd, mythic: c.command.version, payload: c.version} 
            }).sort((a,b) => (a.cmd > b.cmd) ? 1: ((b.cmd > a.cmd) ? -1 : 0));
            setCommands(commandState);
            const buildParametersState = data.payload[0].buildparameterinstances.map( (b) =>
            {
                return {description: b.buildparameter.description, 
                  value: b.value, 
                  parameter_type: b.buildparameter.parameter_type,
                  enc_key: b.enc_key_base64,
                  dec_key: b.dec_key_base64
                }
            }).sort((a,b) => (a.description > b.description) ? 1: ((b.description > a.description) ? -1 : 0));
            setBuildParameters(buildParametersState);
            const c2Profiles = data.payload[0].c2profileparametersinstances.reduce( (prev, cur) => {
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
            setBuildSteps(data.payload[0].payload_build_steps);
        }
        });
    const [addCommandMutation] = useMutation(addCommandsMutation, {
      onCompleted: (data) => {
        commandMods.current.add += 1;
        setAddProgress(commandMods.current.add);
        issueNextMod();
      },
      onError: (error) => {
        snackActions.error(error.message);
        commandMods.current.add += 1;
        issueNextMod();
      }
    })
    const [removeCommandMutation] = useMutation(removeCommandsMutation, {
      onCompleted: (data) => {
        for(let i = 0; i < data.delete_payloadcommand.returning.length; i++){
          commandMods.current.remove += 1;
        }
        setRemoveProgress(commandMods.current.remove);
        issueNextMod();
        
      },
      onError: (error) => {
        snackActions.error(error.message);
        issueNextMod();
      }
    })
    const issueNextMod = () => {
      if(commandMods.current.add >= addTotal.current){
        if(commandMods.current.remove >= removeTotal.current) {
          snackActions.success("Finished adjusting commands");
        } else {
          removeCommandMutation({variables: {command_id: commandMods.current.commandsToRemove[commandMods.current.remove].command.id, payload_id: props.id}})
        }
      } else {
        addCommandMutation({variables: {command_id: commandMods.current.commandsToAdd[commandMods.current.add].id, payload_id: props.id}})
      }
    }
    const addRemoveCommandsSubmit = ({commandsToAdd, commandsToRemove}) => {
      addTotal.current = commandsToAdd.length;
      removeTotal.current = commandsToRemove.length;
      commandMods.current.commandsToAdd = commandsToAdd
      commandMods.current.commandsToRemove = commandsToRemove
      if(commandsToAdd.length === 0 && commandsToRemove.length === 0){
        snackActions.info("Not adding or removing any commands")
      } else {
        setOpenProgressIndicator(true);
        issueNextMod();
      }
    }
    const normalizeAdd = (value) => ((value - 0) * 100) / (Math.max(addTotal.current - 0, 1));
    const normalizeRemove = (value) => ((value - 0) * 100) / (Math.max(removeTotal.current - 0, 1));
    const onCloseProgress = () => {
      setOpenProgressIndicator(false);
      setAddProgress(0);
      setRemoveProgress(0);
      commandMods.current.add = 0;
      commandMods.current.remove = 0;
      commandMods.current.commandsToAdd = [];
      commandMods.current.commandsToRemove = [];
    }
    if (loading) {
     return <LinearProgress style={{marginTop: "10px"}}/>;
    }
    if (error) {
     console.error(error);
     return <div>Error! {error.message}</div>;
    }
    return (
      <React.Fragment>
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
                        <TableCell>{data.payload[0].payloadtype.name}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Selected OS</TableCell>
                        <TableCell>{data.payload[0].os}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>UUID</TableCell>
                        <TableCell>{data.payload[0].uuid}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Creation Time</TableCell>
                        <TableCell>{toLocalTime(data.payload[0].creation_time, me.user.view_utc_time)}</TableCell>
                    </TableRow>
                    { data.payload[0].filemetum ? (
                        <TableRow key={'filename_text'} hover>
                            <TableCell>Filename</TableCell>
                            <TableCell>{b64DecodeUnicode(data.payload[0].filemetum.filename_text)}</TableCell>
                        </TableRow>
                        
                    ) : null }

                    <TableRow hover>
                        <TableCell>Download URL</TableCell>
                        <TableCell>{window.location.origin + "/direct/download/" + data.payload[0].filemetum.agent_file_id}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>SHA1</TableCell>
                        <TableCell>{data.payload[0].filemetum.sha1}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>MD5</TableCell>
                        <TableCell>{data.payload[0].filemetum.md5}</TableCell>
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
                <TableBody style={{whiteSpace: "pre"}}>
                  {
                    buildParameters.map( (cmd, i) => (
                        <TableRow key={"buildprop" + i + "for" + props.payload_id} hover>
                            <TableCell>{cmd.description}</TableCell>
                            <TableCell>
                              {
                                cmd.parameter_type === "Dictionary" ? (
                                    JSON.stringify(JSON.parse(cmd.value), null, 2)
                                ) : (
                                  cmd.parameter_type === "Array" || cmd.parameter_type === "ChooseMultiple" ? (
                                    JSON.parse(cmd.value).map(c => c + "\n")
                                  ): (cmd.value)
                                )
                              }
                                  {cmd.enc_key === null ? (null) : (<React.Fragment>
                                    <br/><b>Encryption Key: </b> {cmd.enc_key}
                                  </React.Fragment>) }
                                {cmd.dec_key === null ? (null) : (<React.Fragment>
                                    <br/><b>Decryption Key: </b> {cmd.dec_key}
                                </React.Fragment>) }
                            </TableCell>
                        </TableRow>
                    ))
                    
                  }
                </TableBody>
              </Table>
              <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                    Build Steps
                </Typography>
              </Paper>
              <Table size="small" aria-label="details" style={{ "overflowWrap": "break-word"}}>
                <TableHead>
                  <TableRow>
                    <TableCell style={{width: "30%"}}>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    buildSteps.map( (step, i) => (
                        <TableRow key={"buildstep" + i + "for" + props.payload_id}>
                            <TableCell>{step.step_name}</TableCell>
                            <TableCell>{step.step_description}</TableCell>
                            <TableCell>
                              <PayloadsTableRowBuildProcessPerStep key={'buildstepicon' + i + "for" + props.payload_id} payload_build_steps={buildSteps} step_number={step.step_number} />
                            </TableCell>
                        </TableRow>
                    ))
                    
                  }
                </TableBody>
              </Table>
                { c2Profiles.map( (c2) => (
                    <React.Fragment key={"c2frag" + props.payload_id + c2.c2_profile}>
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
                                    <TableRow key={"c2frag" + props.payload_id + c2.c2_profile + j} hover>
                                        <TableCell>{cmd.description}</TableCell>
                                        <TableCell>
                                        {
                                          cmd.parameter_type === "Dictionary" ? (
                                              JSON.stringify(JSON.parse(cmd.value), null, 2)
                                          ) : (
                                            cmd.parameter_type === "Array" || cmd.parameter_type === "ChooseMultiple" ? (
                                              JSON.parse(cmd.value).map(c => c + "\n")
                                            ): (cmd.value)
                                          )
                                        }
                                          {cmd.enc_key === null ? (null) : (<React.Fragment>
                                            <br/><b>Encryption Key: </b> {cmd.enc_key}
                                          </React.Fragment>) }
                                        {cmd.dec_key === null ? (null) : (<React.Fragment>
                                            <br/><b>Decryption Key: </b> {cmd.dec_key}
                                        </React.Fragment>) }
                                        </TableCell>
                                    </TableRow>
                                ))
                                
                              }
                            </TableBody>
                          </Table>
                      </React.Fragment>
                ))}
                
                <React.Fragment>
                    <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                      <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                          Loaded Commands
                      </Typography>
                      <Button style={{float: "right"}} variant="contained" size="small" onClick={()=>{setOpenAddRemoveCommandsDialog(true)}} >Add/Remove Commands</Button>
                    </Paper>
                    {commands.length > 0 &&
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
                              <TableRow key={cmd.cmd + props.payload_id} hover style={{background: cmd.mythic > cmd.payload ? (theme.palette.error.main) : ("")}}>
                                  <TableCell>{cmd.cmd}</TableCell>
                                  <TableCell>{cmd.mythic}</TableCell>
                                  <TableCell>{cmd.payload}</TableCell>
                                  <TableCell>
                                  <Button variant="contained" color="primary" target="_blank"
                                      href={"/docs/agents/" + data.payload[0].payloadtype.name + "/commands/" + cmd.cmd}>Docs</Button>
                                  </TableCell>
                              </TableRow>
                          ))
                          
                        }
                          </TableBody>
                        </Table>
                      }
                </React.Fragment>
                
                {openAddRemoveCommandsDialog &&
                  <MythicDialog fullWidth={true} maxWidth="md" open={openAddRemoveCommandsDialog} 
                      onClose={()=>{setOpenAddRemoveCommandsDialog(false);}} 
                      innerDialog={<AddRemoveCommandsDialog uuid={props.uuid} onClose={()=>{setOpenAddRemoveCommandsDialog(false);}} onSubmit={addRemoveCommandsSubmit} />}
                  />
                }
                {openProgressIndicator &&
                    <Dialog
                      open={openProgressIndicator}
                      onClose={onCloseProgress}
                      scroll="paper"
                      fullWidth={true}
                      aria-labelledby="scroll-dialog-title"
                      aria-describedby="scroll-dialog-description"
                    >
                        <DialogContent>
                          {addProgress === addTotal.current ? (
                            "Adding Commands - Complete!"
                          ) : (
                            "Adding Commands..."
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress variant="determinate" value={normalizeAdd(addProgress)} valueBuffer={addProgress + 1} />
                            </Box>
                              <Typography  style={{width: "5rem"}} variant="body2" color="text.secondary">{addProgress} / {addTotal.current} </Typography>
                            </Box>
                          {removeProgress === removeTotal.current ? (
                            "Removing Commands - Complete!"
                          ) : (
                            "Removing Commands..."
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress variant="determinate" value={normalizeRemove(removeProgress)} valueBuffer={removeProgress + 1} />
                            </Box>
                              <Typography style={{width: "5rem"}} variant="body2" color="text.secondary">{removeProgress} / {removeTotal.current} </Typography>
                          </Box>
                        </DialogContent>
                    </Dialog>
                    
                  }
              {data.payload[0].wrapped_payload_id !== null &&
                <React.Fragment>
                  <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                      <Typography variant="h5" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                          Wrapped Payload Information
                      </Typography>
                    </Paper>
                  <DetailedPayloadInnerTable me={props.me} payload_id={data.payload[0].wrapped_payload_id} />
                </React.Fragment>
              }
          </React.Fragment>
        )
}