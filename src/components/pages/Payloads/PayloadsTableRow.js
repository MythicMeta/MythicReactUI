import React, {useRef} from 'react';
import {Button} from '@material-ui/core';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import { toLocalTime } from '../../utilities/Time';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import {DetailedPayloadTable} from './DetailedPayloadTable';
import Grow from '@material-ui/core/Grow';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Paper from '@material-ui/core/Paper';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import {PayloadDescriptionDialog} from './PayloadDescriptionDialog';
import {PayloadFilenameDialog} from './PayloadFilenameDialog';
import {PayloadBuildMessageDialog} from './PayloadBuildMessageDialog';
import {PayloadsTableRowC2Status} from './PayloadsTableRowC2Status';
import {PayloadsTableRowBuildStatus} from './PayloadsTableRowBuildStatus';
import {PayloadConfigCheckDialog} from './PayloadConfigCheckDialog';
import {PayloadRedirectRulesDialog} from './PayloadRedirectRulesDialog';
import {useTheme} from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import {useMutation, gql, useLazyQuery} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';

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
    const dropdownAnchorRef = useRef(null);
    const me = useReactiveVar(meState);
    const theme = useTheme();
    const [triggerRebuild] = useMutation(rebuildPayloadMutation, {
      onCompleted: (data) => {
        console.log(data);
        snackActions.success("Successfully triggered rebuild");
      },
      onError: (data) => {
        snackActions.error("Failed to trigger rebuild: " + data);
      }
    });
    const [exportConfig] = useLazyQuery(exportPayloadConfigQuery, {
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
        if(data.export_payload_config.status === "success"){
          const dataBlob = new Blob([data.export_payload_config.config], {type: 'text/plain'});
          const ele = document.getElementById("download_config");
          if(ele !== null){
            ele.href = URL.createObjectURL(dataBlob);
            ele.download = props.filemetum.filename_text + ".json";
            ele.click();
          }else{
            const element = document.createElement("a");
            element.id = "download_config";
            element.href = URL.createObjectURL(dataBlob);
            element.download = props.filemetum.filename_text + ".json";
            document.body.appendChild(element);
            element.click();
          }
        }else{
          snackActions.error("Failed to export configuration: " + data.export_payload_config.error);
        }
      },
      onError: (data) => {
        snackActions.error("Failed to export configuration: " + data)
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
                    }}
                     ]
    ;
    const handleClose = (event) => {
        if (dropdownAnchorRef.current && dropdownAnchorRef.current.contains(event.target)) {
          return;
        }
        setOpenUpdateDialog(false);
      };
    return (
        <React.Fragment>
            <TableRow key={"payload" + props.uuid} hover>
                <TableCell>
                <IconButton size="small" onClick={()=>{setOpenDeleteDialog(true);}} style={{color: theme.palette.error.main}} variant="contained"><DeleteIcon/></IconButton>
                <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete} open={openDelete}/>
                </TableCell>
                <TableCell>{toLocalTime(props.creation_time, me.user.view_utc_time)}</TableCell>
                <TableCell><Button ref={dropdownAnchorRef} size="small" onClick={()=>{setOpenUpdateDialog(true);}} color="primary" variant="contained">Actions</Button>
                <Popper open={openUpdate} anchorEl={dropdownAnchorRef.current} role={undefined} transition disablePortal style={{zIndex: 4}}>
                  {({ TransitionProps, placement }) => (
                    <Grow
                      {...TransitionProps}
                      style={{
                        transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                      }}
                    >
                      <Paper variant="outlined" style={{backgroundColor: theme.palette.type === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light, color: "white"}}>
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
                {openDescription ? (
                    <MythicDialog fullWidth={true} maxWidth="md" open={openDescription} 
                        onClose={()=>{setOpenDescriptionDialog(false);}} 
                        innerDialog={<PayloadDescriptionDialog payload_id={props.id} onClose={()=>{setOpenDescriptionDialog(false);}} />}
                    />
                ): (null) }
                {openFilename ? (
                    <MythicDialog fullWidth={true} maxWidth="md" open={openFilename} 
                        onClose={()=>{setOpenFilenameDialog(false);}} 
                        innerDialog={<PayloadFilenameDialog payload_id={props.id} onClose={()=>{setOpenFilenameDialog(false);}} />}
                    />
                ): (null) }
                {openBuildMessage ? (
                    <MythicDialog fullWidth={true} maxWidth="md" open={openBuildMessage} 
                        onClose={()=>{setOpenBuildMessageDialog(false);}} 
                        innerDialog={<PayloadBuildMessageDialog payload_id={props.id} viewError={viewError} onClose={()=>{setOpenBuildMessageDialog(false);}} />}
                    />
                ): (null) }
                {openConfigCheckDialog ? (
                    <MythicDialog fullWidth={true} maxWidth="md" open={openConfigCheckDialog} 
                        onClose={()=>{setOpenConfigCheckDialog(false);}} 
                        innerDialog={<PayloadConfigCheckDialog uuid={props.uuid} onClose={()=>{setOpenConfigCheckDialog(false);}} />}
                    />
                ): (null) }
                {openRedirectRulesDialog ? (
                    <MythicDialog fullWidth={true} maxWidth="md" open={openRedirectRulesDialog} 
                        onClose={()=>{setOpenRedirectRulesDialog(false);}} 
                        innerDialog={<PayloadRedirectRulesDialog uuid={props.uuid} onClose={()=>{setOpenRedirectRulesDialog(false);}} />}
                    />
                ): (null) }
                </TableCell>
                <TableCell>
                    <PayloadsTableRowBuildStatus {...props} />
                </TableCell>
                <TableCell>{props.filemetum.filename_text}</TableCell>
                <TableCell>{props.tag}</TableCell>
                <TableCell>
                    <PayloadsTableRowC2Status payloadc2profiles={props.payloadc2profiles} uuid={props.uuid} />
                </TableCell>
                <TableCell>
                    <IconButton size="small" color="primary" onClick={() => setOpenDetailedView(true)}>
                        <InfoIcon />
                    </IconButton>
                </TableCell>
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
        )
}

