import { MythicTabPanel, MythicTabLabel } from '../../../components/MythicComponents/MythicTabPanel';
import React, { useEffect, useCallback } from 'react';
import { gql, useLazyQuery, useQuery } from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import MythicTextField from '../../MythicComponents/MythicTextField';
import { useReactiveVar } from '@apollo/client';
import { meState } from '../../../cache';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import { CallbacksTabsFileBrowserTree } from './CallbacksTabsFileBrowserTree';
import { CallbacksTabsFileBrowserTable } from './CallbacksTabsFileBrowserTable';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { MythicModifyStringDialog } from '../../MythicComponents/MythicDialog';
import LockIcon from '@mui/icons-material/Lock';
import { Backdrop } from '@mui/material';
import {CircularProgress} from '@mui/material';
import {TaskFromUIButton} from './TaskFromUIButton';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';

const fileDataFragment = gql`
    fragment fileObjData on filebrowserobj {
        access_time
        comment
        deleted
        filemeta {
            id
        }
        host
        id
        is_file
        modify_time
        parent_id
        size
        success
        task {
            callback {
                id
            }
            operator {
                id
            }
        }
        full_path_text
        name_text
        timestamp
        parent_path_text
        filebrowserobjs_aggregate {
            aggregate {
                count
            }
        }
    }
`;
const rootFileQuery = gql`
    ${fileDataFragment}
    query myRootFolderQuery($operation_id: Int!) {
        filebrowserobj(where: { operation_id: { _eq: $operation_id }, parent_id: { _is_null: true } }) {
            ...fileObjData
        }
    }
`;
const folderQuery = gql`
    ${fileDataFragment}
    query myFolderQuery($filebrowserobj_id: Int!, $operation_id: Int!) {
        filebrowserobj(
            where: { parent_id: { _eq: $filebrowserobj_id }, operation_id: { _eq: $operation_id } }
            order_by: { is_file: asc, name: asc }
        ) {
            ...fileObjData
        }
    }
`;
const fileDataSubscription = gql`
    ${fileDataFragment}
    subscription liveData($now: timestamp!, $operation_id: Int!) {
        filebrowserobj(
            distinct_on: id
            order_by: { id: desc }
            where: { timestamp: { _gt: $now }, operation_id: { _eq: $operation_id } }
            limit: 1
        ) {
            ...fileObjData
        }
    }
`;
const getDeltaFilesQuery = gql`
    ${fileDataFragment}
    query myDeltaFilesQuery($lastTime: timestamp!, $now: timestamp!, $operation_id: Int!) {
        filebrowserobj(
            distinct_on: id
            order_by: { id: desc }
            where: {
                _and: [{ timestamp: { _gte: $lastTime } }, { timestamp: { _lte: $now } }]
                operation_id: { _eq: $operation_id }
            }
        ) {
            ...fileObjData
        }
    }
`;

export function CallbacksTabsFileBrowserLabel(props) {
    const [description, setDescription] = React.useState('File Browser: ' + props.tabInfo.callbackID);
    const [openEditDescriptionDialog, setOpenEditDescriptionDialog] = React.useState(false);
    useEffect(() => {
        if (props.tabInfo.customDescription !== '' && props.tabInfo.customDescription !== undefined) {
            setDescription(props.tabInfo.customDescription);
        } else {
            setDescription('File Browser: ' + props.tabInfo.callbackID);
        }
    }, [props.tabInfo.payloadDescription, props.tabInfo.customDescription]);
    const editDescriptionSubmit = (description) => {
        props.onEditTabDescription(props.tabInfo, description);
    };
    const contextMenuOptions = props.contextMenuOptions.concat([
        {
            name: 'Set Tab Description', 
            click: ({event}) => {
                setOpenEditDescriptionDialog(true);
            }
        },
    ]);
    return (
        <React.Fragment>
            <MythicTabLabel label={description} onDragTab={props.onDragTab}  {...props} contextMenuOptions={contextMenuOptions} />
            {openEditDescriptionDialog && (
                <MythicDialog
                    fullWidth={true}
                    open={openEditDescriptionDialog}
                    onClose={() => {
                        setOpenEditDescriptionDialog(false);
                    }}
                    innerDialog={
                        <MythicModifyStringDialog
                            title={"Edit Tab's Description"}
                            onClose={() => {
                                setOpenEditDescriptionDialog(false);
                            }}
                            value={description}
                            onSubmit={editDescriptionSubmit}
                        />
                    }
                />
            )}
        </React.Fragment>
    );
}
export const CallbacksTabsFileBrowserPanel = ({ index, value, tabInfo }) => {
    const me = useReactiveVar(meState);
    const fileBrowserRoots = React.useRef([]);
    const [backdropOpen, setBackdropOpen] = React.useState(false);
    const [fileBrowserRootsState, setFileBrowserRootsState] = React.useState([]);
    const [selectedFolder, setSelectedFolder] = React.useState([]);
    const selectedFolderDataRef = React.useRef({});
    const [selectedFolderData, setSelectedFolderData] = React.useState({
        task: { callback: { id: tabInfo.callbackID } },
        host: tabInfo.host,
        full_path_text: '.',
    });
    const currentCallbackIDSetInTable = React.useRef();
    const lastFetchedTime = React.useRef(new Date().toISOString());
    const [showDeletedFiles, setShowDeletedFiles] = React.useState(false);
    const [openTaskingButton, setOpenTaskingButton] = React.useState(false);
    const taskingData = React.useRef({"parameters": "", "ui_feature": "file_browser:list"});
    const mountedRef = React.useRef(true);
    const { subscribeToMore, loading } = useQuery(rootFileQuery, {
        variables: { operation_id: me.user.current_operation_id },
        onCompleted: (data) => {
            const roots = data.filebrowserobj.reduce((prev, cur) => {
                for (let i = 0; i < prev.length; i++) {
                    if (prev[i]['host'] === cur.host) {
                        if(prev[i].children){
                            prev[i].children.push({ ...cur, parent_id: cur.host, children: [] });
                        }else{
                            prev[i].children = [{ ...cur, parent_id: cur.host, children: [] }];
                        }
                        
                        return [...prev];
                    }
                }
                return [
                    ...prev,
                    { ...cur, id: cur.host, children: [{ ...cur, parent_id: cur.host, children: [] }] },
                ];
            }, []);
            setFileBrowserRootsState(roots);
        },
        fetchPolicy: 'network-only',
    });
    const [getFileDeltas] = useLazyQuery(getDeltaFilesQuery, {
        onCompleted: (data) => {
            let updatingData = [...fileBrowserRoots.current];
            data.filebrowserobj.forEach((obj) => {
                let found = false;
                if (obj.parent_id === null) {
                    // we could have a new host, a new root, or a n updated root
                    let foundHost = false;
                    updatingData.forEach((root) => {
                        if (root['host'] === obj['host']) {
                            foundHost = true;
                            //console.log(root, obj);
                            root.children.forEach((rootEntry) => {
                                if (rootEntry['name_text'] === obj['name_text']) {
                                    found = true;
                                    rootEntry.comment = obj.comment;
                                    rootEntry.success = obj.success;
                                    rootEntry.deleted = obj.deleted;
                                    rootEntry.filemeta = obj.filemeta;
                                }
                            });
                        }
                    });
                    if (!foundHost) {
                        found = false;
                    } else if (foundHost && !found) {
                        found = true;
                        // there's a host entry that matches obj, but this is a new root, so find the match again
                        updatingData.forEach((root) => {
                            if (root['host'] === obj['host']) {
                                root.children.push({ ...obj, parent_id: obj['host'], children: [] });
                            }
                        });
                    }
                } else {
                    // parent_id is not null, so it's not a root entry
                    updatingData.forEach((root) => {
                        if (root['host'] === obj['host']) {
                            found = true;
                            mergeData(root, obj.parent_id, [obj]);
                        }
                    });
                }
                if (!found && obj.parent_id === null) {
                    // add a new top-level host entry
                    updatingData.push({
                        ...obj,
                        id: obj['host'],
                        children: [{ ...obj, parent_id: obj['host'], children: [] }],
                    });
                }
            });
            setFileBrowserRootsState(updatingData);
            //console.log("updating data", updatingData, selectedFolderDataRef.current, data.filebrowserobj[0]);
            if (
                data.filebrowserobj.length > 0 &&
                selectedFolderDataRef.current.id !== undefined &&
                (data.filebrowserobj[0].parent_id === selectedFolderDataRef.current.id ||
                    selectedFolderDataRef.current.host === data.filebrowserobj[0].host)
            ) {
                // this means we got updated data for something in the folder we're currently looking at in the table, so we need to make sure to update the table
                //console.log("updating table");
                setSelectedFolder(Object.values(selectedFolderDataRef.current.children));
            }
        },
        onError: (data) => {
            console.log(data);
        },
    });
    useEffect(() => {
        fileBrowserRoots.current = fileBrowserRootsState;
    }, [fileBrowserRootsState]);
    useEffect(() => {
        selectedFolderDataRef.current = selectedFolderData;
    }, [selectedFolderData]);
    const [getFolderData] = useLazyQuery(folderQuery, {
        onError: (data) => {
            console.error(data);
        },
        fetchPolicy: 'no-cache',
        notifyOnNetworkStatusChange: true,
        onCompleted: (data) => {
            let found = false;
            if (data.filebrowserobj.length === 0) {
                snackActions.dismiss();
                if (selectedFolderData.success === null) {
                    snackActions.info("Folder hasn't been listed yet");
                } else {
                    snackActions.info('Empty folder');
                }
                setSelectedFolder(Object.values(selectedFolderData.children));
                setBackdropOpen(false);
                return;
            }
            snackActions.dismiss();
            snackActions.success('Fetched data');
            const newRoots = fileBrowserRootsState.map((root) => {
                if (data.filebrowserobj[0]['host'] === root['host']) {
                    // for each element we get back, add to this root
                    let workingSet = { ...root };
                    found = true;
                    mergeData(workingSet, data.filebrowserobj[0].parent_id, data.filebrowserobj);
                    return workingSet;
                } else {
                    return { ...root };
                }
            });
            if (!found) {
                // we need to add this as a root element
                newRoots.push(data.filebrowserobj[0]);
                mergeData(data.filebrowserobj[0], data.filebrowserobj[0].parent_id, data.filebrowserobj);
            }
            //console.log("setting new roots");
            setFileBrowserRootsState(newRoots);
            setSelectedFolder(Object.values(selectedFolderData.children));
            setBackdropOpen(false);
        },
    });
    const mergeData = useCallback((search, parent_id, all_objects) => {
        //merge the obj into fileBrowserRoots
        //console.log('in mergeData');
        // might need to do a recursive call
        // if this is a folder with children, check the children
        if (parent_id === search.id) {
            // iterate for each child we're trying to update/insert
            //console.log("found parent, setting children");
            for (let i = 0; i < all_objects.length; i++) {
                if (search.children[all_objects[i].id] === undefined) {
                    search.children[all_objects[i].id] = { ...all_objects[i], children: {} };
                } else {
                    search.children[all_objects[i].id] = {
                        ...all_objects[i],
                        children: search.children[all_objects[i].id].children,
                    };
                }
            }
            //console.log("found parent, set children, returning");
            return true;
        }
        // this current search isn't all_object's parent, so check search's children for our parent
        for (const [_, value] of Object.entries(search.children)) {
            if (all_objects[0].parent_path_text.startsWith(value.full_path_text)) {
                let found = mergeData(value, parent_id, all_objects);
                if (found) {
                    return true;
                }
            }
        }
        return false;
    }, []);
    const onSetTableData = useCallback((filebrowserobj) => {
        setSelectedFolder(Object.values(filebrowserobj.children));
        setSelectedFolderData(filebrowserobj);
    }, []);
    const fetchFolderData = useCallback((filebrowserobj) => {
        getFolderData({
            variables: { filebrowserobj_id: filebrowserobj.id, operation_id: me.user.current_operation_id },
        });
        setBackdropOpen(true);
        setSelectedFolderData(filebrowserobj);
    }, []);
    const onListFilesButton = ({ fullPath, hostname }) => {
        taskingData.current = ({"parameters": {path: fullPath, host: hostname, file: ""}, "ui_feature": "file_browser:list"});
        setOpenTaskingButton(true);
    };
    const onUploadFileButton = ({ hostname, fullPath }) => {
        taskingData.current = ({"parameters": {path: fullPath, host: hostname}, "ui_feature": "file_browser:upload", "openDialog": true});
        setOpenTaskingButton(true);
    };
    const onTaskRowAction = useCallback(({ path, host, filename, uifeature, openDialog, getConfirmation }) => {
        taskingData.current = ({"parameters": {
            host: host,
            path: path,
            file: filename,
        }, "ui_feature": uifeature, openDialog, getConfirmation});
        setOpenTaskingButton(true);
    }, []);
    const onChangeCallbackID = (callbackID) => {
        currentCallbackIDSetInTable.current = callbackID;
    };
    const subscribeToMoreCallback = useCallback(
        (prev, { subscriptionData }) => {
            if(!mountedRef.current){
                return;
            }
            if (subscriptionData.data.filebrowserobj.length > 0) {
                getFileDeltas({
                    variables: {
                        operation_id: me.user.current_operation_id,
                        now: new Date().toISOString(),
                        lastTime: lastFetchedTime.current,
                    },
                });
                if (
                    subscriptionData.data.filebrowserobj[0] !== null &&
                    subscriptionData.data.filebrowserobj[0] !== undefined
                ) {
                    lastFetchedTime.current = subscriptionData.data.filebrowserobj[0]['timestamp'];
                }

                return;
            }
        },
        [mergeData]
    );
    const toggleShowDeletedFiles = (showStatus) => {
        setShowDeletedFiles(showStatus);
    };
    React.useEffect( () => {
        return() => {
            mountedRef.current = false;
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <MythicTabPanel index={index} value={value}>
            <div style={{ display: 'flex', flexGrow: 1, overflowY: 'auto' }}>
                <div style={{ width: '30%', overflow: 'auto', flexGrow: 1 }}>
                    <Backdrop open={backdropOpen} style={{zIndex: 2, position: "absolute"}} invisible={true}>
                        <CircularProgress color="inherit" />
                    </Backdrop>
                    <CallbacksTabsFileBrowserTree
                        showDeletedFiles={showDeletedFiles}
                        treeRoot={fileBrowserRootsState}
                        fetchFolderData={fetchFolderData}
                        setTableData={onSetTableData}
                    />
                    
                </div>
                <div style={{ width: '60%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div style={{ flexGrow: 0 }}>
                        <FileBrowserTableTop
                            selectedFolderData={selectedFolderData}
                            onListFilesButton={onListFilesButton}
                            onUploadFileButton={onUploadFileButton}
                            onChangeCallbackID={onChangeCallbackID}
                            toggleShowDeletedFiles={toggleShowDeletedFiles}
                            initialCallbackID={tabInfo.callbackID}
                            subscribeToNewFileBrowserObjs={() => {
                                subscribeToMore({
                                    document: fileDataSubscription,
                                    variables: {
                                        now: new Date().toISOString(),
                                        operation_id: me?.user?.current_operation_id || 0,
                                    },
                                    updateQuery: subscribeToMoreCallback,
                                })
                            }}
                        />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <Backdrop open={backdropOpen} style={{zIndex: 2, position: "absolute"}} invisible={true}>
                            <CircularProgress color="inherit" />
                        </Backdrop>
                        <CallbacksTabsFileBrowserTable
                            showDeletedFiles={showDeletedFiles}
                            onRowDoubleClick={fetchFolderData}
                            selectedFolder={selectedFolder}
                            onTaskRowAction={onTaskRowAction}
                        />
                    </div>
                </div>
            </div>
            {openTaskingButton && 
                <TaskFromUIButton ui_feature={taskingData.current?.ui_feature || " "} 
                    callback_id={currentCallbackIDSetInTable.current} 
                    parameters={taskingData.current?.parameters || ""}
                    tasking_location={"file_browser"}
                    openDialog={taskingData.current?.openDialog || false}
                    getConfirmation={taskingData.current?.getConfirmation || false}
                    onTasked={() => setOpenTaskingButton(false)}/>
            }
        </MythicTabPanel>
    );
};
const FileBrowserTableTop = ({
    selectedFolderData,
    onListFilesButton,
    initialCallbackID,
    onUploadFileButton,
    onChangeCallbackID,
    subscribeToNewFileBrowserObjs,
    toggleShowDeletedFiles,
}) => {
    const theme = useTheme();
    const [hostname, setHostname] = React.useState('');
    const [fullPath, setFullPath] = React.useState('');
    const [callbackID, setCallbackID] = React.useState(initialCallbackID);
    const [showDeletedFiles, setLocalShowDeletedFiles] = React.useState(false);
    const [manuallySetCallbackID, setManuallySetCallbackID] = React.useState(true);
    const onChangeHost = (_, value) => {
        setHostname(value);
    };
    const onChangePath = (_, value) => {
        setFullPath(value);
    };
    const onChangeID = (_, value) => {
        setManuallySetCallbackID(true);
        setCallbackID(parseInt(value));
    };
    const revertCallbackID = () => {
        setManuallySetCallbackID(false);
        if (selectedFolderData.task) {
            setCallbackID(selectedFolderData.task.callback.id);
        } else {
            setCallbackID(0);
            onChangeCallbackID(0);
        }
    };
    useEffect(() => {
        if (selectedFolderData.host !== undefined) {
            setHostname(selectedFolderData.host);
        }
        if (selectedFolderData.full_path_text !== undefined) {
            setFullPath(selectedFolderData.full_path_text);
        }
        if (!manuallySetCallbackID) {
            if (selectedFolderData.task !== undefined) {
                setCallbackID(selectedFolderData.task.callback.id);
            }
        }
    }, [selectedFolderData, manuallySetCallbackID]);
    const onLocalListFilesButton = () => {
        if (fullPath === '') {
            snackActions.warning('Must provide a path to list');
            return;
        }
        if (callbackID > 0) {
            onListFilesButton({ callbackID, fullPath, hostname });
        } else {
            snackActions.warning('Must select a folder or set a callback number first');
        }
    };
    const onLocalUploadFileButton = () => {
        if (callbackID > 0) {
            onUploadFileButton({ fullPath, hostname });
        } else {
            snackActions.warning('Must select a folder or set a callback number first');
        }
    };
    useEffect(() => {
        //console.log("useEffect for onChangeCAllbackID")
        onChangeCallbackID(callbackID);
    }, [callbackID]);
    useEffect(() => {
        subscribeToNewFileBrowserObjs();
    }, []);
    const onLocalToggleShowDeletedFiles = () => {
        setLocalShowDeletedFiles(!showDeletedFiles);
        toggleShowDeletedFiles(!showDeletedFiles);
    };
    return (
        <Grid container spacing={0} style={{ paddingTop: '10px' }}>
            <Grid item xs={4}>
                <MythicTextField placeholder='Host Name' value={hostname} onChange={onChangeHost} name='Host Name' />
            </Grid>
            <Grid item xs={7}>
                <MythicTextField
                    placeholder='Path'
                    value={fullPath}
                    onEnter={onLocalListFilesButton}
                    onChange={onChangePath}
                    name='Path'
                    InputProps={{
                        endAdornment: (
                            <React.Fragment>
                                <MythicStyledTooltip title='Task callback to list contents'>
                                    <IconButton style={{ padding: '3px' }} onClick={onLocalListFilesButton} size="large">
                                        <RefreshIcon style={{ color: theme.palette.info.main }} />
                                    </IconButton>
                                </MythicStyledTooltip>
                                <MythicStyledTooltip title='Upload file to folder via callback'>
                                    <IconButton style={{ padding: '3px' }} onClick={onLocalUploadFileButton} size="large">
                                        <CloudUploadIcon style={{ color: theme.palette.info.main }} />
                                    </IconButton>
                                </MythicStyledTooltip>
                                <MythicStyledTooltip title={showDeletedFiles ? 'Hide Deleted Files' : 'Show Deleted Files'}>
                                    <IconButton
                                        style={{ padding: '3px' }}
                                        onClick={onLocalToggleShowDeletedFiles}
                                        size="large">
                                        {showDeletedFiles ? (
                                            <VisibilityIcon style={{ color: theme.palette.info.main }} />
                                        ) : (
                                            <VisibilityOffIcon style={{ color: theme.palette.info.main }} />
                                        )}
                                    </IconButton>
                                </MythicStyledTooltip>
                            </React.Fragment>
                        ),
                        style: { padding: 0 },
                    }}
                />
            </Grid>
            <Grid item xs={1}>
                <MythicTextField
                    type='number'
                    placeholder='Callback'
                    name='Callback'
                    onChange={onChangeID}
                    value={callbackID}
                    InputProps={{
                        endAdornment: manuallySetCallbackID ? (
                            <MythicStyledTooltip title='Change Callback Based on Data Origin'>
                                <IconButton style={{ padding: '3px' }} onClick={revertCallbackID} size="large">
                                    <LockIcon style={{ color: theme.palette.info.main }} />
                                </IconButton>
                            </MythicStyledTooltip>
                        ) : (
                            <MythicStyledTooltip title='Manually Update Callback Number to Prevent Data Origin Tracking'>
                                <IconButton style={{ padding: '3px' }} size="large">
                                    <RotateLeftIcon disabled style={{ color: theme.palette.warning.main }} />
                                </IconButton>
                            </MythicStyledTooltip>
                        ),
                        style: { padding: 0, margin: 0 },
                    }}
                />
            </Grid>
        </Grid>
    );
};
