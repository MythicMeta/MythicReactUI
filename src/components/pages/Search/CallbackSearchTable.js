import React, { useEffect } from 'react';
import {IconButton, Typography, Link} from '@material-ui/core';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import { toLocalTime } from '../../utilities/Time';
import {  useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import {useTheme} from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import {toggleHideCallbackMutations} from '../Callbacks/CallbackMutations';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import {DetailedCallbackTable} from '../Callbacks/DetailedCallbackTable';
import InfoIcon from '@material-ui/icons/Info';

export function CallbackSearchTable(props){
    const [callbacks, setCallbacks] = React.useState([]);
    useEffect( () => {
        setCallbacks([...props.callbacks]);
    }, [props.callbacks]);

    const onEditDeleted = ({id, active}) => {
        const updates = callbacks.map( (cred) => {
            if(cred.id === id){
                return {...cred, active}
            }else{
                return {...cred}
            }
        });
        setCallbacks(updates);
    }

    return (
        <TableContainer component={Paper} className="mythicElement">
            <Table stickyHeader size="small" style={{"maxWidth": "100%", "overflow": "auto"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "5rem"}}>Hide</TableCell>
                        <TableCell >User</TableCell>
                        <TableCell >Domain</TableCell>
                        <TableCell >Host</TableCell>
                        <TableCell >Description</TableCell>
                        <TableCell >IP</TableCell>
                        <TableCell >ID</TableCell>
                        <TableCell>Checkin Times</TableCell>
                        <TableCell>Details</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {callbacks.map( (op) => (
                    <CallbackSearchTableRow
                        key={"cred" + op.id}
                        onEditDeleted={onEditDeleted}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

function CallbackSearchTableRow(props){
    const me = useReactiveVar(meState);
    const theme = useTheme();
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [openMetaDialog, setOpenMetaDialog] = React.useState(false);
    const [updateDeleted] = useMutation(toggleHideCallbackMutations, {
        onCompleted: (data) => {
            snackActions.success("Updated active status");
            props.onEditDeleted({id: props.id, active: !props.active});
        },
        onError: (data) => {
            snackActions.error("Operation not allowed");
        }
    });
    const onAcceptDelete = () => {
        updateDeleted({variables: {callback_id: props.id, active: !props.active}})
    }
    return (
        <React.Fragment>
            <TableRow hover>
                <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete} open={openDeleteDialog} acceptText={props.active ? "Hide" : "Restore" }/>
                
                <TableCell>{!props.active ? (
                    <MythicStyledTooltip title="Restore Callback for Tasking">
                        <IconButton size="small" onClick={()=>{setOpenDeleteDialog(true);}} style={{color: theme.palette.success.main}} variant="contained"><RestoreFromTrashIcon/></IconButton>
                    </MythicStyledTooltip>
                ) : (
                    <MythicStyledTooltip title="Hide Callback so it can't be used in Tasking">
                        <IconButton size="small" onClick={()=>{setOpenDeleteDialog(true);}} style={{color: theme.palette.error.main}} variant="contained"><DeleteIcon/></IconButton>
                    </MythicStyledTooltip>
                )} </TableCell>
                <TableCell>
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.user}</Typography>
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.domain}</Typography>
                </TableCell>
                <TableCell>{props.host}</TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>{props.description}</Typography>
                </TableCell>
                <TableCell>
                    {props.ip}
                </TableCell>
                <TableCell>
                <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" 
                        href={"/new/callbacks/" + props.id}>
                            {props.id}
                    </Link>
                </TableCell>
                <TableCell>
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>
                        Initial: {toLocalTime(props.init_callback, me.user.view_utc_time)}
                    </Typography>
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>
                        Latest: {toLocalTime(props.last_checkin, me.user.view_utc_time)}
                    </Typography>
                </TableCell>
                <TableCell>
                    <InfoIcon onClick={() => setOpenMetaDialog(true)} style={{color: theme.palette.info.main}}/>
                    {openMetaDialog && 
                        <MythicDialog fullWidth={true} maxWidth="lg" open={openMetaDialog}
                            onClose={()=>{setOpenMetaDialog(false);}} 
                            innerDialog={<DetailedCallbackTable onClose={()=>{setOpenMetaDialog(false);}} callback_id={props.id} />}
                        />
                    }
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}

