import React, { useEffect } from 'react';
import {IconButton, Typography} from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { MythicDialog, MythicModifyStringDialog } from '../../MythicComponents/MythicDialog';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import { toLocalTime } from '../../utilities/Time';
import { gql, useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import EditIcon from '@material-ui/icons/Edit';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import {useTheme} from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import Tooltip from '@material-ui/core/Tooltip';

const updateCredentialComment = gql`
mutation updateCommentMutation($credential_id: Int!, $comment: String!){
    update_credential_by_pk(pk_columns: {id: $credential_id}, _set: {comment: $comment}) {
        comment
        id
        operator {
            username
        }
    }
}
`;
const updateCredentialAccount = gql`
mutation updateAccountMutation($credential_id: Int!, $account: String!){
    update_credential_by_pk(pk_columns: {id: $credential_id}, _set: {account: $account}) {
        account
        id
        operator {
            username
        }
    }
}
`;
const updateCredentialRealm = gql`
mutation updateAccountMutation($credential_id: Int!, $realm: String!){
    update_credential_by_pk(pk_columns: {id: $credential_id}, _set: {realm: $realm}) {
        realm
        id
        operator {
            username
        }
    }
}
`;
const updateCredentialCredential = gql`
mutation updateAccountMutation($credential_id: Int!, $credential: bytea!){
    update_credential_by_pk(pk_columns: {id: $credential_id}, _set: {credential_raw: $credential}) {
        credential_text
        id
        operator {
            username
        }
    }
}
`;
const updateCredentialDeleted = gql`
mutation updateAccountMutation($credential_id: Int!, $deleted: Boolean!){
    update_credential_by_pk(pk_columns: {id: $credential_id}, _set: {deleted: $deleted}) {
        deleted
        id
        operator {
            username
        }
    }
}
`;

export function CredentialTable(props){
    const [credentials, setCredentials] = React.useState([]);
    useEffect( () => {
        setCredentials([...props.credentials]);
    }, [props.credentials]);
    const onEditComment = ({id, comment, operator}) => {
        const updates = credentials.map( (cred) => {
            if(cred.id === id){
                return {...cred, comment, operator}
            }else{
                return {...cred}
            }
        });
        setCredentials(updates);
    }
    const onEditAccount = ({id, account, operator}) => {
        const updates = credentials.map( (cred) => {
            if(cred.id === id){
                return {...cred, account, operator}
            }else{
                return {...cred}
            }
        });
        setCredentials(updates);
    }
    const onEditRealm = ({id, realm, operator}) => {
        const updates = credentials.map( (cred) => {
            if(cred.id === id){
                return {...cred, realm, operator}
            }else{
                return {...cred}
            }
        });
        setCredentials(updates);
    }
    const onEditCredential = ({id, credential_text, operator}) => {
        const updates = credentials.map( (cred) => {
            if(cred.id === id){
                return {...cred, credential_text, operator}
            }else{
                return {...cred}
            }
        });
        setCredentials(updates);
    }
    const onEditDeleted = ({id, deleted, operator}) => {
        const updates = credentials.map( (cred) => {
            if(cred.id === id){
                return {...cred, deleted, operator}
            }else{
                return {...cred}
            }
        });
        setCredentials(updates);
    }

    return (
        <TableContainer component={Paper} className="mythicElement" style={{height: "calc(78vh)"}}>
            <Table stickyHeader size="small" style={{"maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "5rem"}}>Delete</TableCell>
                        <TableCell >Account</TableCell>
                        <TableCell >Realm</TableCell>
                        <TableCell >Credential</TableCell>
                        <TableCell >Comment</TableCell>
                        <TableCell >Timestamp</TableCell>
                        <TableCell >Task / Operator</TableCell>
                        <TableCell style={{width: "5rem"}}>Type</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {credentials.map( (op) => (
                    <CredentialTableRow
                        key={"cred" + op.id}
                        onEditComment={onEditComment}
                        onEditAccount={onEditAccount}
                        onEditRealm={onEditRealm}
                        onEditCredential={onEditCredential}
                        onEditDeleted={onEditDeleted}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

function CredentialTableRow(props){
    const me = useReactiveVar(meState);
    const theme = useTheme();
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [editCommentDialogOpen, setEditCommentDialogOpen] = React.useState(false);
    const [editAccountDialogOpen, setEditAccountDialogOpen] = React.useState(false);
    const [editRealmDialogOpen, setEditRealmDialogOpen] = React.useState(false);
    const [editCredentialDialogOpen, setEditCredentialDialogOpen] = React.useState(false);
    const [updateComment] = useMutation(updateCredentialComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
            props.onEditComment(data.update_credential_by_pk);
        }
    });
    const [updateAccount] = useMutation(updateCredentialAccount, {
        onCompleted: (data) => {
            snackActions.success("updated account");
            props.onEditAccount(data.update_credential_by_pk);
        }
    });
    const [updateRealm] = useMutation(updateCredentialRealm, {
        onCompleted: (data) => {
            snackActions.success("updated realm");
            props.onEditRealm(data.update_credential_by_pk);
        }
    });
    const [updateCredential] = useMutation(updateCredentialCredential, {
        onCompleted: (data) => {
            snackActions.success("updated credential");
            props.onEditCredential(data.update_credential_by_pk);
        }
    });
    const [updateDeleted] = useMutation(updateCredentialDeleted, {
        onCompleted: (data) => {
            snackActions.success("updated deleted status");
            props.onEditDeleted(data.update_credential_by_pk);
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {credential_id: props.id, comment: comment}})
    }
    const onSubmitUpdatedAccount = (account) => {
        updateAccount({variables: {credential_id: props.id, account: account}})
    }
    const onSubmitUpdatedRealm = (realm) => {
        updateRealm({variables: {credential_id: props.id, realm: realm}})
    }
    const onSubmitUpdatedCredential = (credential) => {
        updateCredential({variables: {credential_id: props.id, credential: credential}})
    }
    const onAcceptDelete = () => {
        updateDeleted({variables: {credential_id: props.id, deleted: !props.deleted}})
    }
    return (
        <React.Fragment>
            <TableRow hover>
                <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete} open={openDeleteDialog} acceptText={props.deleted ? "Restore" : "Remove" }/>
                <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen} 
                    onClose={()=>{setEditCommentDialogOpen(false);}} 
                    innerDialog={<MythicModifyStringDialog title="Edit Credential Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={()=>{setEditCommentDialogOpen(false);}} />}
                />
                <MythicDialog fullWidth={true} maxWidth="md" open={editAccountDialogOpen} 
                    onClose={()=>{setEditAccountDialogOpen(false);}} 
                    innerDialog={<MythicModifyStringDialog title="Edit Credential Account" onSubmit={onSubmitUpdatedAccount} value={props.account} onClose={()=>{setEditAccountDialogOpen(false);}} />}
                />
                <MythicDialog fullWidth={true} maxWidth="md" open={editRealmDialogOpen} 
                    onClose={()=>{setEditRealmDialogOpen(false);}} 
                    innerDialog={<MythicModifyStringDialog title="Edit Credential Realm" onSubmit={onSubmitUpdatedRealm} value={props.realm} onClose={()=>{setEditRealmDialogOpen(false);}} />}
                />
                <MythicDialog fullWidth={true} maxWidth="md" open={editCredentialDialogOpen} 
                    onClose={()=>{setEditCredentialDialogOpen(false);}} 
                    innerDialog={<MythicModifyStringDialog title="Edit Credential Credential" onSubmit={onSubmitUpdatedCredential} value={props.credential_text} onClose={()=>{setEditCredentialDialogOpen(false);}} />}
                />
                
                <TableCell>{props.deleted ? (
                    <Tooltip title="Restore Credential for use in Tasking">
                        <IconButton size="small" onClick={()=>{setOpenDeleteDialog(true);}} style={{color: theme.palette.success.main}} variant="contained"><RestoreFromTrashIcon/></IconButton>
                    </Tooltip>
                ) : (
                    <Tooltip title="Delete Credential so it can't be used in Tasking">
                        <IconButton size="small" onClick={()=>{setOpenDeleteDialog(true);}} style={{color: theme.palette.error.main}} variant="contained"><DeleteIcon/></IconButton>
                    </Tooltip>
                )} </TableCell>
                <TableCell>
                    <IconButton onClick={() => setEditAccountDialogOpen(true)} size="small" style={{display: "inline-block"}}><EditIcon /></IconButton>
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.account}</Typography>
                </TableCell>
                <TableCell >
                    <IconButton onClick={() => setEditRealmDialogOpen(true)} size="small" style={{display: "inline-block"}}><EditIcon /></IconButton>
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.realm}</Typography>
                </TableCell>
                <TableCell >
                    <IconButton onClick={() => setEditCredentialDialogOpen(true)} size="small" style={{display: "inline-block"}}><EditIcon /></IconButton>
                    <Typography variant="body2" style={{wordBreak: "break-all", maxWidth: "40rem"}}>{props.credential_text}</Typography>
                </TableCell>
                <TableCell>
                    <IconButton onClick={() => setEditCommentDialogOpen(true)} size="small" style={{display: "inline-block"}}><EditIcon /></IconButton>
                    <Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>{props.comment}</Typography>
                    </TableCell>
                <TableCell>
                <Typography variant="body2" style={{wordBreak: "break-all"}}>{toLocalTime(props.timestamp, me.user.view_utc_time)}</Typography>
                </TableCell>
                <TableCell>
                    {props.task_id !== null ? (
                        props.task_id
                    ): (props.operator.username)}
                </TableCell>
                <TableCell>{props.type}</TableCell>
            </TableRow>
        </React.Fragment>
    )
}

