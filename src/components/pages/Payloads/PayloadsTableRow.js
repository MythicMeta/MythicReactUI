import React, {useRef} from 'react';
import {Button} from '@mui/material';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {DetailedPayloadTable} from './DetailedPayloadTable';
import Grow from '@mui/material/Grow';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import {PayloadDescriptionDialog} from './PayloadDescriptionDialog';
import {PayloadFilenameDialog} from './PayloadFilenameDialog';
import {PayloadBuildMessageDialog} from './PayloadBuildMessageDialog';
import {PayloadsTableRowC2Status} from './PayloadsTableRowC2Status';
import {PayloadsTableRowBuildStatus} from './PayloadsTableRowBuildStatus';
import {PayloadConfigCheckDialog} from './PayloadConfigCheckDialog';
import {PayloadRedirectRulesDialog} from './PayloadRedirectRulesDialog';
import {useTheme} from '@mui/material/styles';
import InfoIconOutline from '@mui/icons-material/InfoOutlined';
import {useMutation, gql, useLazyQuery} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import MythicStyledTableCell from '../../MythicComponents/MythicTableCell';
import {PayloadsTableRowBuildProgress} from './PayloadsTableRowBuildProgress';
import {b64DecodeUnicode} from '../Callbacks/ResponseDisplay';

import {CreateNewCallbackDialog} from './CreateNewCallbackDialog';

const rebuildPayloadMutation = gql`
mutation triggerRebuildMutation($uuid: String!) {
  rebuild_payload(uuid: $uuid) {
      status
      error
      uuid
  }
}
`;

const exportPayloadConfigQuery = gql`
query exportPayloadConfigQuery($uuid: String!) {
  export_payload_config(uuid: $uuid) {
      status
      error 
      config 
  }
}
`;

export function PayloadsTableRow(props){
    const [viewError, setViewError] = React.useState(true);
    const [openUpdate, setOpenUpdateDialog] = React.useState(false);
    const [openDelete, setOpenDeleteDialog] = React.useState(false);
    const [openDescription, setOpenDescriptionDialog] = React.useState(false);
    const [openFilename, setOpenFilenameDialog] = React.useState(false);
    const [openBuildMessage, setOpenBuildMessageDialog] = React.useState(false);
    const [openDetailedView, setOpenDetailedView] = React.useState(false);
    const [openConfigCheckDialog, setOpenConfigCheckDialog] = React.useState(false);
    const [openRedirectRulesDialog, setOpenRedirectRulesDialog] = React.useState(false);
    const [openCreateNewCallbackDialog, setOpenCreateNewCallbackDialog] = React.useState(false);
    const dropdownAnchorRef = useRef(null);
    const theme = useTheme();
    const [triggerRebuild] = useMutation(rebuildPayloadMutation, {
      onCompleted: (data) => {
        if(data.rebuild_payload.status === "success"){
          snackActions.success("Successfully triggered rebuild");
        } else {
          snackActions.error("Failed to build:\n" + data.rebuild_payload.error);
        }
        
      },
      onError: (data) => {
        snackActions.error("Failed to trigger rebuild: " + data);
      }
    });
    
    const [exportConfig] = useLazyQuery(exportPayloadConfigQuery, {
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
        //console.log(data)
        if(data.export_payload_config.status === "success"){
          const dataBlob = new Blob([data.export_payload_config.config], {type: 'text/plain'});
          const ele = document.getElementById("download_config");
          if(ele !== null){
            ele.href = URL.createObjectURL(dataBlob);
            ele.download = b64DecodeUnicode(props.filemetum.filename_text) + ".json";
            ele.click();
          }else{
            const element = document.createElement("a");
            element.id = "download_config";
            element.href = URL.createObjectURL(dataBlob);
            element.download = b64DecodeUnicode(props.filemetum.filename_text) + ".json";
            document.body.appendChild(element);
            element.click();
          }
        }else{
          snackActions.error("Failed to export configuration: " + data.export_payload_config.error);
        }
      },
      onError: (data) => {
        console.log(data);
        snackActions.error("Failed to export configuration: " + data.message)
      }
    })
    const onAlertChanged = () => {
        const {id, callback_alert} = props;
        props.onAlertChanged(id, !callback_alert);
    }
    const onAcceptDelete = () => {
        props.onDeletePayload(props.filemetum.id);
        setOpenDeleteDialog(false);
    }
    const handleMenuItemClick = (event, index) => {
        options[index].click();
        setOpenUpdateDialog(false);
    };
    const options = [{name: 'Rename File', click: () => {
                        setOpenFilenameDialog(true);
                     }},
                     {name: 'Edit Description', click: () => {
                        setOpenDescriptionDialog(true);
                     }},
                     {name: props.callback_alert ? 'Stop Alerting to New Callbacks' : "Start Alerting to New Callbacks", click: () => {
                        onAlertChanged();
                      }},
                     {name: 'View Build Message/Stdout', click: () => {
                        setViewError(false);
                        setOpenBuildMessageDialog(true);
                     }},
                     {name: 'View Build Errors', click: () => {
                        setViewError(true);
                        setOpenBuildMessageDialog(true);
                     }},
                     {name: 'Trigger New Build', click: () => {
                      triggerRebuild({variables: {uuid: props.uuid}});
                    }},
                    {name: 'Export Payload Config', click: () => {
                      exportConfig({variables: {uuid: props.uuid}});
                    }},
                    {name: 'Generate Redirect Rules', click: () => {
                      setOpenRedirectRulesDialog(true);
                    }},
                    {name: 'Check Agent C2 Configuration', click: () => {
                      setOpenConfigCheckDialog(true);
                    }},
                    {name: 'Generate Callback', click: () => {
                      setOpenCreateNewCallbackDialog(true);
                    }}
                     ]
    ;
    const handleClose = (event) => {
        if (dropdownAnchorRef.current && dropdownAnchorRef.current.contains(event.target)) {
          return;
        }
        setOpenUpdateDialog(false);
      };
    
    const shouldDisplay = React.useMemo(() => {
      if(!props.deleted && !props.auto_generated){
        return true;
      }else if(props.deleted && props.showDeleted){
        if(!props.auto_generated){return true}
        if(props.auto_generated && props.showAutoGenerated){return true}
        return false; // we're auto generated but we aren't showing autogenerated
      }else if(props.auto_generated && props.showAutoGenerated){
        if(!props.deleted){return true}
        if(props.deleted && props.showDeleted){return true}
        return false; // we're deleted and we aren't showing deleted
      }else{
        return false; // we're either deleted or auto generated and we aren't showing those
      }
    }, [props.deleted, props.showDeleted, props.auto_generated, props.showAutoGenerated]);
    return (
      shouldDisplay ? (
        <React.Fragment>
            <TableRow key={"payload" + props.uuid} hover>
                <MythicStyledTableCell>
                  {props.deleted ? (
                    <MythicStyledTooltip title={"Mark payload as not deleted so you can get callbacks, but does not recreate the payload on disk"}>
                      <IconButton size="small" onClick={() => {props.onRestorePayload(props.id)}} color="success" variant="contained"><RestoreFromTrashIcon /></IconButton>
                    </MythicStyledTooltip>
                    
                  ) : (
                    <React.Fragment>
                      <MythicStyledTooltip title={"Delete the payload from disk and mark as deleted. No new callbacks can be generated from this payload"}>
                        <IconButton size="small" onClick={()=>{setOpenDeleteDialog(true);}} color="error" variant="contained"><DeleteIcon/></IconButton>
                      </MythicStyledTooltip>
                      
                      {openDelete && 
                        <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete} open={openDelete}/>
                      }
                    </React.Fragment>
                  )}
                  
                </MythicStyledTableCell>
                <MythicStyledTableCell><Button ref={dropdownAnchorRef} size="small" onClick={()=>{setOpenUpdateDialog(true);}} color="primary" variant="contained">Actions</Button>
                <Popper open={openUpdate} anchorEl={dropdownAnchorRef.current} role={undefined} transition disablePortal style={{zIndex: 4}}>
                  {({ TransitionProps, placement }) => (
                    <Grow
                      {...TransitionProps}
                      style={{
                        transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                      }}
                    >
                      <Paper variant="outlined" style={{backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light, color: "white"}}>
                        <ClickAwayListener onClickAway={handleClose}>
                          <MenuList id="split-button-menu"  >
                            {options.map((option, index) => (
                              <MenuItem
                                key={option.name + props.uuid}
                                onClick={(event) => handleMenuItemClick(event, index)}
                              >
                                {option.name}
                              </MenuItem>
                            ))}
                          </MenuList>
                        </ClickAwayListener>
                      </Paper>
                    </Grow>
                  )}
                </Popper>
                {openDescription &&
                    <MythicDialog fullWidth={true} maxWidth="md" open={openDescription} 
                        onClose={()=>{setOpenDescriptionDialog(false);}} 
                        innerDialog={<PayloadDescriptionDialog payload_id={props.id} onClose={()=>{setOpenDescriptionDialog(false);}} />}
                    />
                }
                {openFilename &&
                    <MythicDialog fullWidth={true} maxWidth="md" open={openFilename} 
                        onClose={()=>{setOpenFilenameDialog(false);}} 
                        innerDialog={<PayloadFilenameDialog payload_id={props.id} onClose={()=>{setOpenFilenameDialog(false);}} />}
                    />
                }
                {openBuildMessage &&
                    <MythicDialog fullWidth={true} maxWidth="lg" open={openBuildMessage} 
                        onClose={()=>{setOpenBuildMessageDialog(false);}} 
                        innerDialog={<PayloadBuildMessageDialog payload_id={props.id} viewError={viewError} onClose={()=>{setOpenBuildMessageDialog(false);}} />}
                    />
                }
                {openConfigCheckDialog &&
                    <MythicDialog fullWidth={true} maxWidth="md" open={openConfigCheckDialog} 
                        onClose={()=>{setOpenConfigCheckDialog(false);}} 
                        innerDialog={<PayloadConfigCheckDialog uuid={props.uuid} onClose={()=>{setOpenConfigCheckDialog(false);}} />}
                    />
                }
                {openRedirectRulesDialog &&
                    <MythicDialog fullWidth={true} maxWidth="md" open={openRedirectRulesDialog} 
                        onClose={()=>{setOpenRedirectRulesDialog(false);}} 
                        innerDialog={<PayloadRedirectRulesDialog uuid={props.uuid} onClose={()=>{setOpenRedirectRulesDialog(false);}} />}
                    />
                }
                
                {openCreateNewCallbackDialog &&
                  <MythicDialog fullWidth={true} maxWidth="md" open={openCreateNewCallbackDialog} 
                      onClose={()=>{setOpenCreateNewCallbackDialog(false);}} 
                      innerDialog={<CreateNewCallbackDialog uuid={props.uuid} onClose={()=>{setOpenCreateNewCallbackDialog(false);}} />}
                  />
                }
                </MythicStyledTableCell>
                <MythicStyledTableCell>
                  <PayloadsTableRowBuildProgress {...props} />
                </MythicStyledTableCell>
                <MythicStyledTableCell>
                    <PayloadsTableRowBuildStatus {...props} />
                </MythicStyledTableCell>
                <MythicStyledTableCell>{b64DecodeUnicode(props.filemetum.filename_text)}</MythicStyledTableCell>
                <MythicStyledTableCell>{props.description}</MythicStyledTableCell>
                <MythicStyledTableCell>
                    <PayloadsTableRowC2Status payloadc2profiles={props.payloadc2profiles} uuid={props.uuid} />
                </MythicStyledTableCell>
                <MythicStyledTableCell>
                  <MythicStyledTooltip title={props.payloadtype.name}>
                      <img
                          style={{width: "35px", height: "35px"}}
                          src={"/static/" + props.payloadtype.name + ".svg"}
                      />
                  </MythicStyledTooltip>
                </MythicStyledTableCell>
                <MythicStyledTableCell>
                    <IconButton size="small" color="info" onClick={() => setOpenDetailedView(true)}>
                        <InfoIconOutline />
                    </IconButton>
                </MythicStyledTableCell>
            </TableRow>
            <TableRow>
            {openDetailedView ? (
              <MythicDialog fullWidth={true} maxWidth="md" open={openDetailedView} 
                  onClose={()=>{setOpenDetailedView(false);}} 
                  innerDialog={<DetailedPayloadTable {...props} payload_id={props.id} onClose={()=>{setOpenDetailedView(false);}} />}
              />
            ) : (null) }
          </TableRow>
        </React.Fragment>
      ) : (null)
    )
}

