import React from 'react';
import {Button} from '@mui/material';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import { APITokenRow } from './SettingsOperatorAPIToken';
import { SettingsOperatorDialog } from './SettingsOperatorDialog';
import { SettingsOperatorDeleteDialog } from './SettingsOperatorDeleteDialog';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import { toLocalTime } from '../../utilities/Time';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';

export function SettingsOperatorRow(props){
    const [open, setOpen] = React.useState(false);
    const [openUpdate, setOpenUpdateDialog] = React.useState(false);
    const [openDelete, setOpenDeleteDialog] = React.useState(false);
    const me = useReactiveVar(meState);
    const isMe = ( me?.user?.user_id || 0 ) === props.id;
    const localStorageInitialHideUsernameValue = localStorage.getItem(`${me?.user?.user_id || 0}-hideUsernames`);
    const initialHideUsernameValue = localStorageInitialHideUsernameValue === null ? false : (localStorageInitialHideUsernameValue.toLowerCase() === "false" ? false : true);
    const [hideUsernames, setHideUsernames] = React.useState(initialHideUsernameValue);
    const onViewUTCChanged = (evt) => {
        const {id} = props;
        props.onViewUTCChanged(id, !props[evt.target.name]);
    }
    const onAdminChanged = (evt) => {
        const {id} = props;
        props.onAdminChanged(id, !props[evt.target.name]);
    }
    const onActiveChanged = (evt) => {
        const {id} = props;
        props.onActiveChanged(id, !props[evt.target.name]);
    }
    const onAccept = (id, username, passwordOld, passwordNew) => {
        if(username !== props.username){
          props.onUsernameChanged(id, username);
        }
        if(passwordNew.length > 0){
          props.onPasswordChanged({user_id: id, old_password: passwordOld, new_password: passwordNew})
        }
        setOpenUpdateDialog(false);
    }
    const onAcceptDelete = (id) => {
        props.onDeleteOperator(id);
        setOpenDeleteDialog(false);
    }
    const onHideUsernamesChanged = (evt) => {
      localStorage.setItem(`${me?.user?.user_id || 0}-hideUsernames`, !hideUsernames);
      console.log("old hideUsernames", hideUsernames, "new value", !hideUsernames);
      setHideUsernames(!hideUsernames);
    }
    return (
        <React.Fragment>
            <TableRow key={props.id}>
                <TableCell><Button size="small" onClick={()=>{setOpenDeleteDialog(true);}} startIcon={<DeleteIcon/>} color="error" variant="contained">Delete</Button>
                    <MythicDialog open={openDelete} 
                        onClose={()=>{setOpenDeleteDialog(false);}} 
                        innerDialog={<SettingsOperatorDeleteDialog onClose={()=>{setOpenDeleteDialog(false);}}  onAccept={onAcceptDelete} {...props} />}
                     />
                </TableCell>
                <TableCell>{props.username}</TableCell>
                <TableCell><Button size="small" onClick={()=>{setOpenUpdateDialog(true);}} color="info" variant="contained">Update</Button>
                    <MythicDialog open={openUpdate} 
                        onClose={()=>{setOpenUpdateDialog(false);}} 
                        innerDialog={<SettingsOperatorDialog onAccept={onAccept} handleClose={()=>{setOpenUpdateDialog(false);}} title="Update Operator"  {...props}/>}
                     />
                </TableCell>
                <TableCell>
                    <Switch
                        checked={props.view_utc_time}
                        onChange={onViewUTCChanged}
                        color="primary"
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                        name="view_utc_time"
                      />
                </TableCell>
                <TableCell>
                  {isMe && 
                  <Switch
                    checked={hideUsernames}
                    onChange={onHideUsernamesChanged}
                    color="primary"
                    inputProps={{ 'aria-label': 'primary checkbox' }}
                    name="hide_usernames"
                  />
                  }
                  
                </TableCell>
                <TableCell>
                    <Switch
                        checked={props.active}
                        onChange={onActiveChanged}
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                        name="active"
                      />
                </TableCell>
                <TableCell>{toLocalTime(props.last_login, me.user.view_utc_time)}</TableCell>
                <TableCell>{toLocalTime(props.creation_time, me.user.view_utc_time)}</TableCell>
                <TableCell>
                    <Switch
                        checked={props.admin}
                        onChange={onAdminChanged}
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                        name="admin"
                      />
                </TableCell>
                <TableCell>
                  {props.id === me.user.id && 
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                      {open ? <KeyboardArrowUpIcon className="mythicElement"/> : <KeyboardArrowDownIcon className="mythicElement"/>}
                    </IconButton>
                  }
                    
                </TableCell>
            </TableRow>
            <TableRow>
              {props.id === me.user.id &&
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box margin={1}>
                      <Typography variant="h6" gutterBottom component="div" style={{display: "inline-block"}}>
                        API Tokens
                      </Typography>
                      <Button size="small" onClick={props.onCreateAPIToken} style={{float: "right"}} startIcon={<AddCircleOutlineOutlinedIcon/>} color="success" variant="contained">New</Button>
                      <Table size="small" aria-label="tokens" style={{"tableLayout": "fixed", "overflowWrap": "break-word"}}>
                        <TableHead>
                          <TableRow>
                            <TableCell style={{width: "10rem"}}>Delete</TableCell>
                            <TableCell>Token</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {
                            props.apitokens.map((token) => (<APITokenRow {...token} key={"token" + token.id} onDeleteAPIToken={props.onDeleteAPIToken} />))
                          }
                        </TableBody>
                      </Table>
                    </Box>
                  </Collapse>
                </TableCell>
              }
            
          </TableRow>
        </React.Fragment>
        )
}

