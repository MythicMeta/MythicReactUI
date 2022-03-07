import React, { useEffect } from 'react';
import {Button, IconButton, Typography} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { MythicDialog, MythicModifyStringDialog, MythicViewJSONAsTableDialog } from '../../MythicComponents/MythicDialog';
import {DownloadHistoryDialog} from '../Callbacks/DownloadHistoryDialog';
import HistoryIcon from '@mui/icons-material/History';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { gql, useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import EditIcon from '@mui/icons-material/Edit';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';

const updateFileComment = gql`
mutation updateCommentMutation($filebrowserobj_id: Int!, $comment: String!){
    update_filebrowserobj_by_pk(pk_columns: {id: $filebrowserobj_id}, _set: {comment: $comment}) {
        comment
        id
    }
}
`;

export function FileBrowserTable(props){
    const [files, setFiles] = React.useState([]);
    useEffect( () => {
        setFiles([...props.files]);
    }, [props.files]);
    const onEditComment = ({id, comment}) => {
        const updates = files.map( (file) => {
            if(file.id === id){
                return {...file, comment}
            }else{
                return {...file}
            }
        });
        setFiles(updates);
    }
    return (
        <TableContainer component={Paper} className="mythicElement" >
            <Table stickyHeader size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell >Host / Path</TableCell>
                        <TableCell >Modify Time</TableCell>
                        <TableCell >Comment</TableCell>
                        <TableCell style={{width: "7rem"}}>Permissions</TableCell>
                        <TableCell style={{width: "7rem"}}>Downloads</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {files.map( (op) => (
                    <FileBrowserTableRow
                        key={"file" + op.id}
                        onEditComment={onEditComment}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
const convertTime = (timestamp) => {
    try{
        // handle Unix epoch timestamps
        const dateData = new Date(parseInt(timestamp)).toISOString();
        return dateData.slice(0, 10) + " " + dateData.slice(11,-1);
    }catch(error){
        try{
            // handle windows FILETIME values
            const dateData = new Date( ((parseInt(timestamp) / 10000000) - 11644473600) * 1000).toISOString();
            return dateData.slice(0, 10) + " " + dateData.slice(11,-1);
        }catch(error2){
            console.log("error with timestamp: ", timestamp);
            return String(timestamp);
        }
        
    }
}
function FileBrowserTableRow(props){
    const [viewPermissionsDialogOpen, setViewPermissionsDialogOpen] = React.useState(false);
    const [fileHistoryDialogOpen, setFileHistoryDialogOpen] = React.useState(false);
    const [editCommentDialogOpen, setEditCommentDialogOpen] = React.useState(false);
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
            props.onEditComment(data.update_filebrowserobj_by_pk)
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {filebrowserobj_id: props.id, comment: comment}})
    }
    return (
        <React.Fragment>
            <TableRow hover>
                <MythicDialog fullWidth={true} maxWidth="md" open={viewPermissionsDialogOpen} 
                    onClose={()=>{setViewPermissionsDialogOpen(false);}} 
                    innerDialog={<MythicViewJSONAsTableDialog title="View Permissions Data" leftColumn="Permission" rightColumn="Value" value={props.permissions} onClose={()=>{setViewPermissionsDialogOpen(false);}} />}
                    />
                <MythicDialog fullWidth={true} maxWidth="md" open={fileHistoryDialogOpen} 
                    onClose={()=>{setFileHistoryDialogOpen(false);}} 
                    innerDialog={<DownloadHistoryDialog title="Download History" value={props.filemeta} onClose={()=>{setFileHistoryDialogOpen(false);}} />}
                />
                <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen} 
                    onClose={()=>{setEditCommentDialogOpen(false);}} 
                    innerDialog={<MythicModifyStringDialog title="Edit File Browser Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={()=>{setEditCommentDialogOpen(false);}} />}
                />
                <TableCell>
                <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.host}</Typography>
                <Typography variant="body2" style={{wordBreak: "break-all", textDecoration: props.deleted ? "strike-through" : ""}}>{props.full_path_text}</Typography>
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{convertTime(props.modify_time)}</Typography>
                </TableCell>
                <TableCell><IconButton onClick={() => setEditCommentDialogOpen(true)} size="small" style={{display: "inline-block"}}><EditIcon /></IconButton><Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>{props.comment}</Typography></TableCell>
                <TableCell>
                    <Button color="primary" variant="outlined" onClick={() => setViewPermissionsDialogOpen(true)}><PlaylistAddCheckIcon /></Button>
                </TableCell>
                <TableCell>
                    {props.filemeta.length > 0 ? (
                        <MythicStyledTooltip title="View Download History and Download Files">
                            <Button color="primary" variant="contained" onClick={() => setFileHistoryDialogOpen(true)}><HistoryIcon /></Button>
                        </MythicStyledTooltip>
                    ): (null)}
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}

