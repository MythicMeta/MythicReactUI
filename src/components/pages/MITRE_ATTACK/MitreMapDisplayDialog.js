import React from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import Typography from '@material-ui/core/Typography';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import Paper from '@material-ui/core/Paper';
import {useTheme} from '@material-ui/core/styles';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';

export function MitreMapDisplayDialog({entry, showCountGrouping, onClose}){
    const [commands, setCommands] = React.useState([]);
    const [tasks, setTasks] = React.useState([]);
    React.useEffect( () => {
      switch(showCountGrouping){
        case "":
          break;
        case "command":
          const groupedCommands = entry.commands.reduce( (prev, cur) => {
            if(cur.payloadtype.ptype in prev){
              prev[cur.payloadtype.ptype].push(cur.cmd);
            }else{
              prev[cur.payloadtype.ptype] = [cur.cmd];
            }
            return {...prev};
          }, {});
          setCommands(Object.entries(groupedCommands));
          break;
        case "task":
          const groupedTasks = entry.tasks.reduce( ( prev, cur) => {
            if(cur.callback.payload.payloadtype.ptype in prev){
              prev[cur.callback.payload.payloadtype.ptype].push({
                id: cur.id,
                command: cur.command_name + " " + cur.display_params,
                comment: cur.comment,
                callback_id: cur.callback.id
              });
            }else{
              prev[cur.callback.payload.payloadtype.ptype] = [{
                id: cur.id,
                command: cur.command_name + " " + cur.display_params,
                comment: cur.comment,
                callback_id: cur.callback.id
              }];
            }
            return {...prev};
          }, {});
          setTasks(Object.entries(groupedTasks));
          break;
      }
    }, [entry, showCountGrouping]);
    return (
        <React.Fragment>
          <DialogTitle id="form-dialog-title">{entry.name} - <a href={"https://attack.mitre.org/techniques/" + entry.t_num.replace(".", "/")} target="_blank">{entry.t_num}</a></DialogTitle>
          <DialogContent dividers={true}>
            {showCountGrouping === "command" ? 
            (
              <DetailedCommandMappingTables commands={commands} />
            ) : 
            (
              <DetailedTaskMappingTables tasks={tasks} />
            )}
           
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} variant="contained" color="secondary">
              Close
            </Button>
        </DialogActions>
        </React.Fragment>
        )
}

function DetailedCommandMappingTables({commands}){
  const me = useReactiveVar(meState);
    const theme = useTheme();
    return (
      <React.Fragment>
        {commands.map( c => (
          <div key={"agent" + c[0]}>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                {c[0]}
              </Typography>
            </Paper>
            <Table size="small" aria-label="details" style={{ "overflowWrap": "break-word"}}>
              <TableHead>
                <TableRow>
                  <TableCell>Command</TableCell>
                  <TableCell style={{width: "5rem"}}>Documentation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {c[1].map( entry => (
                  <TableRow hover key={"command" + entry}>
                      <TableCell>{entry}</TableCell>
                      <TableCell>
                      <Button variant="contained" color="primary" target="_blank"
                              href={"/docs/agents/" + c[0] + "/commands/" + entry}>Docs</Button>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </React.Fragment>
    )
}

function DetailedTaskMappingTables({tasks}){
  const me = useReactiveVar(meState);
    const theme = useTheme();
    return (
      <React.Fragment>
        {tasks.map( c => (
          <React.Fragment>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                {c[0]}
              </Typography>
            </Paper>
            <Table size="small" aria-label="details" style={{ "overflowWrap": "break-word"}}>
            <TableHead>
                <TableRow>
                  <TableCell style={{width: "5rem"}}>Callback</TableCell>
                  <TableCell style={{width: "5rem"}}>Task</TableCell>
                  <TableCell>Command</TableCell>
                  <TableCell>Comment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {c[1].map( entry => (
                  <TableRow hover>
                      <TableCell><a href={"/new/callbacks/" + entry.callback_id} target="_blank">{entry.callback_id}</a></TableCell>
                      <TableCell><a href={"/new/task/" + entry.id} target="_blank">{entry.id}</a></TableCell>
                      <TableCell>{entry.command}</TableCell>
                      <TableCell>{entry.comment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </React.Fragment>
        ))}
      </React.Fragment>
    )
}