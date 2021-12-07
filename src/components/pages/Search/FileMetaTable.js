import React, {useEffect} from 'react';
import {Button, Link, Typography} from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import {snackActions} from '../../utilities/Snackbar';
import {MythicSnackDownload} from '../../MythicComponents/MythicSnackDownload';
import {useTheme} from '@material-ui/core/styles';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import { toLocalTime } from '../../utilities/Time';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import DeleteIcon from '@material-ui/icons/Delete';
import Switch from '@material-ui/core/Switch';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Tooltip from '@material-ui/core/Tooltip';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import ArchiveIcon from '@material-ui/icons/Archive';
import { gql, useMutation } from '@apollo/client';
import { ResponseDisplayScreenshotModal } from '../Callbacks/ResponseDisplayScreenshotModal';
import { MythicDialog, MythicModifyStringDialog } from '../../MythicComponents/MythicDialog';
import EditIcon from '@material-ui/icons/Edit';

const downloadBulkQuery = gql`
mutation downloadBulkMutation($files: [String!]!){
    download_bulk(files: $files){
        status
        error
        file_id
    }
}
`;
const updateFileDeleted = gql`
mutation updateFileMutation($file_id: Int!){
    deleteFile(file_id: $file_id) {
        status
        error
        file_ids
    }
}
`;
const updateFileComment = gql`
mutation updateCommentMutation($file_id: Int!, $comment: String!){
    update_filemeta_by_pk(pk_columns: {id: $file_id}, _set: {comment: $comment}) {
        comment
        id
    }
}
`;

export function FileMetaDownloadTable(props){
    const [selected, setSelected] = React.useState({});
    const [files, setFiles] = React.useState([]);
    const onToggleSelection = (id, checked) => {
        setSelected({...selected, [id]: checked});
    }
    useEffect( () => {
        const initialSelected = props.files.reduce( (prev, file) => {
            return {...prev, [file.id]: false}
        }, {});
        setSelected(initialSelected);
        setFiles([...props.files]);
    }, [props.files]);
    const [downloadBulk] = useMutation(downloadBulkQuery, {
        onCompleted: (data) => {
            snackActions.dismiss();
            if(data.download_bulk.status === "success"){
                snackActions.success("", {persist: true, content: key => <MythicSnackDownload id={key} title="Download Zip File" innerText="Filenames are random UUIDs, so a JSON file is included with a mapping of UUID to real filename" downloadLink={window.location.origin + "/api/v1.4/files/download/" + data.download_bulk.file_id} />});
            }else{
                snackActions.error(data.error);
            }
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to zip up files");
        }
    })
    const onDownloadBulk = () => {
        snackActions.info("Zipping up files...");
        let fileIds = [];
        for(const [key, value] of Object.entries(selected)){
            if(value){
                for(let j = 0; j < props.files.length; j++){
                    if(props.files[j].id === parseInt(key)){
                        fileIds.push(props.files[j].agent_file_id);
                    }
                }
            }
        }
        downloadBulk({variables:{files: fileIds}})
    }
    const onDelete = ({file_ids}) => {
        const updated = files.map( (file) => {
            if(file_ids.includes(file.id)){
                return {...file, deleted: true};
            }else{
                return {...file}
            }
        });
        setFiles(updated);
    }
    const onEditComment = ({id, comment}) => {
        const updated = files.map( (file) => {
            if(file.id === id){
                return {...file, comment: comment};
            }else{
                return {...file}
            }
        });
        setFiles(updated);
    }
    return (
        <TableContainer component={Paper} className="mythicElement" style={{height: "calc(78vh)"}}>   
            <Button size="small" onClick={onDownloadBulk} style={{float: "right"}} color="primary" variant="contained"><ArchiveIcon/>Zip & Download Selected</Button>
            <Table stickyHeader size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "5rem"}}></TableCell>
                        <TableCell style={{width: "5rem"}}>Delete</TableCell>
                        <TableCell >File</TableCell>
                        <TableCell >Time</TableCell>
                        <TableCell >Host</TableCell>
                        <TableCell >Comment</TableCell>
                        <TableCell style={{width: "5rem"}}>More</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {files.map( (op) => (
                    <FileMetaDownloadTableRow
                        key={"file" + op.id}
                        onToggleSelection={onToggleSelection}
                        onEditComment={onEditComment}
                        selected={selected}
                        onDelete={onDelete}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

function FileMetaDownloadTableRow(props){
    const [openDelete, setOpenDelete] = React.useState(false);
    const [openDetails, setOpenDetails] = React.useState(false);
    const [editCommentDialogOpen, setEditCommentDialogOpen] = React.useState(false);
    const me = useReactiveVar(meState);
    const theme = useTheme();
    const [deleteFile] = useMutation(updateFileDeleted, {
        onCompleted: (data) => {
            snackActions.dismiss();
            props.onDelete(data.deleteFile);
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to delete file");
        }
    })
    const onAcceptDelete = () => {
        deleteFile({variables: {file_id: props.id}})
    }
    const onSelectChanged = (event) => {
        props.onToggleSelection(props.id, event.target.checked);
    }
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
            props.onEditComment(data.update_filemeta_by_pk)
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {file_id: props.id, comment: comment}})
    }
    return (
        <React.Fragment>
            <TableRow hover>
                <MythicConfirmDialog onClose={() => {setOpenDelete(false);}} onSubmit={onAcceptDelete} open={openDelete}/>
                <TableCell>
                    {props.deleted ? (null) : (
                        <Tooltip title="Toggle to download multiple files at once">
                            <Switch
                                checked={props.selected[props.id] === undefined ? false : props.selected[props.id]}
                                onChange={onSelectChanged}
                                color="primary"
                                inputProps={{ 'aria-label': 'primary checkbox' }}
                                name="select_multiple"
                                />
                        </Tooltip>
                    )}
                    
                </TableCell>
                <TableCell>
                    {props.deleted ? (null) : (
                        <IconButton size="small" onClick={()=>{setOpenDelete(true);}} style={{color: theme.palette.error.main}} variant="contained"><DeleteIcon/></IconButton>
                    )}
                </TableCell>
                <TableCell>
                    {props.deleted ? (<Typography variant="body2" style={{wordBreak: "break-all"}}>{props.full_remote_path_text}</Typography>) : (
                        props.complete ? (
                            <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" href={window.location.origin + "/api/v1.4/files/download/" + props.agent_file_id}>{props.full_remote_path_text}</Link>
                        ) : (
                            <React.Fragment>
                                <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.full_remote_path_text}</Typography> <Typography color="secondary" style={{wordBreak: "break-all"}} >{props.chunks_received} / {props.total_chunks} Chunks Received</Typography>
                            </React.Fragment>
                        )
                    )}
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{toLocalTime(props.timestamp, me.user.view_utc_time)}</Typography>
                </TableCell>
                <TableCell ><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.host}</Typography></TableCell>
                <TableCell>{props.comment}<IconButton onClick={() => setEditCommentDialogOpen(true)} size="small" style={{display: "inline-block"}}><EditIcon /></IconButton>
                    <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen} 
                        onClose={()=>{setEditCommentDialogOpen(false);}} 
                        innerDialog={<MythicModifyStringDialog title="Edit File Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={()=>{setEditCommentDialogOpen(false);}} />}
                    />
                </TableCell>
                <TableCell>
                    <IconButton size="small" aria-label="expand row" onClick={() => setOpenDetails(!openDetails)}>
                            {openDetails ? <KeyboardArrowUpIcon className="mythicElement"/> : <KeyboardArrowDownIcon className="mythicElement"/>}
                        </IconButton>
                </TableCell>
            </TableRow>
                {openDetails ? (
                    <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                            <Collapse in={openDetails}>
                                <Box margin={1}>
                                <TableContainer component={Paper} className="mythicElement">   
                                    <Table  size="small" style={{"tableLayout": "fixed", "maxWidth": "99%", "overflow": "scroll"}}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell style={{width: "16rem"}}>md5</TableCell>
                                                <TableCell style={{width: "20rem"}}>sha1</TableCell>
                                                <TableCell style={{width: "20rem"}}>UUID</TableCell>
                                                <TableCell >Operator</TableCell>
                                                <TableCell style={{width: "6rem"}}>Task</TableCell>
                                                <TableCell>Task Comment</TableCell>
                                                <TableCell>Command</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell ><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.md5}</Typography></TableCell>
                                                <TableCell ><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.sha1}</Typography></TableCell>
                                                <TableCell ><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.agent_file_id}</Typography></TableCell>
                                                <TableCell ><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.operator.username}</Typography></TableCell>
                                                <TableCell>
                                                    {props.task === null ? (
                                                        null
                                                    ) : (
                                                        <Link style={{wordBreak: "break-all"}} underline="always" target="_blank" href={"/new/task/" + props.task.id}>{props.task.id}</Link>
                                                    )}
                                                    
                                                </TableCell>
                                                <TableCell>{props.task !== null ? (<Typography variant="body2" style={{wordBreak: "break-all"}}>{props.task.comment}</Typography>) : (null)}</TableCell>
                                                <TableCell>
                                                    {props.task === null ? (null) : (
                                                        <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.task.command.cmd}</Typography>
                                                    )}
                                                    
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                </Box>
                            </Collapse>
                        </TableCell>
                    </TableRow>
            ) : (null) }
        </React.Fragment>
    )
}

export function FileMetaUploadTable(props){
    const [selected, setSelected] = React.useState({});
    const [files, setFiles] = React.useState([]);
    const onToggleSelection = (id, checked) => {
        setSelected({...selected, [id]: checked});
    }
    useEffect( () => {
        const initialSelected = props.files.reduce( (prev, file) => {
            return {...prev, [file.id]: false}
        }, {});
        setSelected(initialSelected);
        setFiles([...props.files]);
    }, [props.files]);
    const [downloadBulk] = useMutation(downloadBulkQuery, {
        onCompleted: (data) => {
            snackActions.dismiss();
            if(data.download_bulk.status === "success"){
                snackActions.success("", {persist: true, content: key => <MythicSnackDownload id={key} title="Download Zip File" innerText="Filenames are random UUIDs, so a JSON file is included with a mapping of UUID to real filename" downloadLink={window.location.origin + "/api/v1.4/files/download/" + data.download_bulk.file_id} />});
            }else{
                snackActions.error(data.error);
            }
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to zip up files");
        }
    })
    const onDownloadBulk = () => {
        snackActions.info("Zipping up files...");
        let fileIds = [];
        for(const [key, value] of Object.entries(selected)){
            if(value){
                for(let j = 0; j < props.files.length; j++){
                    if(props.files[j].id === parseInt(key)){
                        fileIds.push(props.files[j].agent_file_id);
                    }
                }
            }
        }
        downloadBulk({variables:{files: fileIds}})
    }
    const onDelete = ({file_ids}) => {
        const updated = files.map( (file) => {
            if(file_ids.includes(file.id)){
                return {...file, deleted: true};
            }else{
                return {...file}
            }
        });
        setFiles(updated);
    }
    const onEditComment = ({id, comment}) => {
        const updated = files.map( (file) => {
            if(file.id === id){
                return {...file, comment: comment};
            }else{
                return {...file}
            }
        });
        setFiles(updated);
    }
    return (
        <TableContainer component={Paper} className="mythicElement" style={{height: "calc(78vh)"}}>   
            <Button size="small" onClick={onDownloadBulk} style={{float: "right"}} color="primary" variant="contained"><ArchiveIcon/>Zip & Download Selected</Button>
            <Table stickyHeader size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "5rem"}}></TableCell>
                        <TableCell style={{width: "5rem"}}>Delete</TableCell>
                        <TableCell >Source</TableCell>
                        <TableCell >Destination</TableCell>
                        <TableCell >Time</TableCell>
                        <TableCell >Host</TableCell>
                        <TableCell >Comment</TableCell>
                        <TableCell style={{width: "5rem"}}>More</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {files.map( (op) => (
                    <FileMetaUploadTableRow
                        key={"file" + op.id}
                        onToggleSelection={onToggleSelection}
                        onEditComment={onEditComment}
                        selected={selected}
                        onDelete={onDelete}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

function FileMetaUploadTableRow(props){
    const [openDelete, setOpenDelete] = React.useState(false);
    const [openDetails, setOpenDetails] = React.useState(false);
    const [editCommentDialogOpen, setEditCommentDialogOpen] = React.useState(false);
    const me = useReactiveVar(meState);
    const theme = useTheme();
    const [deleteFile] = useMutation(updateFileDeleted, {
        onCompleted: (data) => {
            snackActions.dismiss();
            props.onDelete(data.deleteFile);
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to delete file");
        }
    })
    const onAcceptDelete = () => {
        deleteFile({variables: {file_id: props.id}})
    }
    const onSelectChanged = (event) => {
        props.onToggleSelection(props.id, event.target.checked);
    }
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
            props.onEditComment(data.update_filemeta_by_pk)
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {file_id: props.id, comment: comment}})
    }
    return (
        <React.Fragment>
            <TableRow hover>
                <MythicConfirmDialog onClose={() => {setOpenDelete(false);}} onSubmit={onAcceptDelete} open={openDelete}/>
                <TableCell>
                    {props.deleted ? (null) : (
                        <Tooltip title="Toggle to download multiple files at once">
                            <Switch
                                checked={props.selected[props.id] === undefined ? false : props.selected[props.id]}
                                onChange={onSelectChanged}
                                color="primary"
                                inputProps={{ 'aria-label': 'primary checkbox' }}
                                name="select_multiple"
                                />
                        </Tooltip>
                    )}
                    
                </TableCell>
                <TableCell>
                    {props.deleted ? (null) : (
                        <IconButton size="small" onClick={()=>{setOpenDelete(true);}} style={{color: theme.palette.error.main}} variant="contained"><DeleteIcon/></IconButton>
                    )}
                </TableCell>
                <TableCell>
                    <Link style={{wordBreak: "break-all"}} color="textPrimary" download underline="always" target="_blank" href={window.location.origin + "/api/v1.4/files/download/" + props.agent_file_id}>{props.filename_text}</Link>
                </TableCell>
                <TableCell  style={{wordBreak: "break-all"}}>
                    {props.deleted ? (<Typography variant="body2" style={{wordBreak: "break-all"}}>{props.full_remote_path_text}</Typography>) : (
                        props.complete ? (
                            <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" href={window.location.origin + "/api/v1.4/files/download/" + props.agent_file_id}>{props.full_remote_path_text}</Link>
                        ) : (
                            <React.Fragment>
                                <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.full_remote_path_text}</Typography> <Typography color="secondary" style={{wordBreak: "break-all"}} >{props.chunks_received} / {props.total_chunks} Chunks Received</Typography>
                            </React.Fragment>
                        )
                    )}
                </TableCell>
                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{toLocalTime(props.timestamp, me.user.view_utc_time)}</Typography></TableCell>
                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.host}</Typography></TableCell>
                <TableCell>
                    {props.comment}<IconButton onClick={() => setEditCommentDialogOpen(true)} size="small" style={{display: "inline-block"}}><EditIcon /></IconButton>
                    <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen} 
                        onClose={()=>{setEditCommentDialogOpen(false);}} 
                        innerDialog={<MythicModifyStringDialog title="Edit File Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={()=>{setEditCommentDialogOpen(false);}} />}
                    />
                </TableCell>
                <TableCell>
                    <IconButton size="small" aria-label="expand row" onClick={() => setOpenDetails(!openDetails)}>
                            {openDetails ? <KeyboardArrowUpIcon className="mythicElement"/> : <KeyboardArrowDownIcon className="mythicElement"/>}
                        </IconButton>
                </TableCell>
            </TableRow>
                {openDetails ? (
                    <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                            <Collapse in={openDetails}>
                                <Box margin={1}>
                                <TableContainer component={Paper} className="mythicElement">   
                                    <Table  size="small" style={{"tableLayout": "fixed", "maxWidth": "99%", "overflow": "scroll"}}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell >md5</TableCell>
                                                <TableCell >sha1</TableCell>
                                                <TableCell >UUID</TableCell>
                                                <TableCell >Operator</TableCell>
                                                <TableCell style={{width: "6rem"}}>Task</TableCell>
                                                <TableCell>Task Comment</TableCell>
                                                <TableCell>Command</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.md5}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.sha1}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.agent_file_id}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.operator.username}</Typography></TableCell>
                                                <TableCell>
                                                    {props.task === null ? (null) : (
                                                        <Link style={{wordBreak: "break-all"}} underline="always" target="_blank" href={"/new/task/" + props.task.id}>{props.task.id}</Link>
                                                    )}
                                                    
                                                </TableCell>
                                                <TableCell>{props.task !== null ? (<Typography variant="body2" style={{wordBreak: "break-all"}}>{props.task.comment}</Typography>) : (null)}</TableCell>
                                                <TableCell>
                                                    {props.task === null ? (null) : (
                                                        <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.task.command.cmd}</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                </Box>
                            </Collapse>
                        </TableCell>
                    </TableRow>
            ) : (null) }
        </React.Fragment>
    )
}

export function FileMetaScreenshotTable(props){
    const [files, setFiles] = React.useState([]);
    useEffect( () => {
        setFiles([...props.files]);
    }, [props.files]);
    const onEditComment = ({id, comment}) => {
        const updated = files.map( (file) => {
            if(file.id === id){
                return {...file, comment: comment};
            }else{
                return {...file}
            }
        });
        setFiles(updated);
    }
    return (
        <TableContainer component={Paper} className="mythicElement">   
            <Table stickyHeader size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "400px"}}>Thumbnail</TableCell>
                        <TableCell >Filename</TableCell>
                        <TableCell >Time</TableCell>
                        <TableCell >Host</TableCell>
                        <TableCell >Comment</TableCell>
                        <TableCell style={{width: "5rem"}}>More</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {files.map( (op) => (
                    <FileMetaScreenshotTableRow
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
function FileMetaScreenshotTableRow(props){
    const [openDetails, setOpenDetails] = React.useState(false);
    const me = useReactiveVar(meState);
    const [openScreenshot, setOpenScreenshot] = React.useState(false);
    const [editCommentDialogOpen, setEditCommentDialogOpen] = React.useState(false);
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
            props.onEditComment(data.update_filemeta_by_pk)
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {file_id: props.id, comment: comment}})
    }
    
    return (
        <React.Fragment>
            <TableRow hover>
                <TableCell >
                    <img onClick={() => setOpenScreenshot(true)} src={"/api/v1.4/files/screencaptures/" + props.agent_file_id} style={{width: "350px", cursor: "pointer"}} />
                    <MythicDialog fullWidth={true} maxWidth="xl" open={openScreenshot} 
                        onClose={()=>{setOpenScreenshot(false);}} 
                        innerDialog={<ResponseDisplayScreenshotModal href={"/api/v1.4/files/screencaptures/" + props.agent_file_id} onClose={()=>{setOpenScreenshot(false);}} />} />
                        {props.chunks_received < props.total_chunks ? (<Typography color="secondary" style={{wordBreak: "break-all"}} >{props.chunks_received} / {props.total_chunks} Chunks Received</Typography>) : (null)}
                </TableCell>
                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.filename_text}</Typography></TableCell>
                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{toLocalTime(props.timestamp, me.user.view_utc_time)}</Typography></TableCell>
                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.host}</Typography></TableCell>
                <TableCell>
                    {props.comment}<IconButton onClick={() => setEditCommentDialogOpen(true)} size="small" style={{display: "inline-block"}}><EditIcon /></IconButton>
                    <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen} 
                        onClose={()=>{setEditCommentDialogOpen(false);}} 
                        innerDialog={<MythicModifyStringDialog title="Edit File Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={()=>{setEditCommentDialogOpen(false);}} />}
                    />
                </TableCell>
                <TableCell>
                    <IconButton size="small" aria-label="expand row" onClick={() => setOpenDetails(!openDetails)}>
                            {openDetails ? <KeyboardArrowUpIcon className="mythicElement"/> : <KeyboardArrowDownIcon className="mythicElement"/>}
                        </IconButton>
                </TableCell>
            </TableRow>
                {openDetails ? (
                    <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                            <Collapse in={openDetails}>
                                <Box margin={1}>
                                <TableContainer component={Paper} className="mythicElement">   
                                    <Table  size="small" style={{"tableLayout": "fixed", "maxWidth": "99%", "overflow": "scroll"}}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell >md5</TableCell>
                                                <TableCell >sha1</TableCell>
                                                <TableCell >UUID</TableCell>
                                                <TableCell >Operator</TableCell>
                                                <TableCell style={{width: "6rem"}}>Task</TableCell>
                                                <TableCell>Task Comment</TableCell>
                                                <TableCell>Command</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.md5}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.sha1}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.agent_file_id}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" style={{wordBreak: "break-all"}}>{props.operator.username}</Typography></TableCell>
                                                <TableCell>
                                                    {props.task === null ? (null) : (
                                                        <Link style={{wordBreak: "break-all"}} underline="always" target="_blank" href={"/new/task/" + props.task.id}>{props.task.id}</Link>
                                                    )}
                                                    
                                                </TableCell>
                                                <TableCell>{props.task !== null ? (<Typography variant="body2" style={{wordBreak: "break-all"}}>{props.task.comment}</Typography>) : (null)}</TableCell>
                                                <TableCell>
                                                    {props.task === null ? (null) : (
                                                        <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.task.command.cmd}</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                </Box>
                            </Collapse>
                        </TableCell>
                    </TableRow>
            ) : (null) }
        </React.Fragment>
    )
}