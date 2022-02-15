import {MythicTabPanel, MythicTabLabel} from '../../../components/MythicComponents/MythicTabPanel';
import React, {useEffect} from 'react';
import {gql, useLazyQuery, useQuery } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import MythicTextField from '../../MythicComponents/MythicTextField';
import { useReactiveVar } from '@apollo/client';
import { meState } from '../../../cache';
import {useTheme} from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import {CallbacksTabsProcessBrowserTree} from './CallbacksTabsProcessBrowserTree';
import {CallbacksTabsProcessBrowserTable} from './CallbacksTabsProcessBrowserTable';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {MythicModifyStringDialog} from '../../MythicComponents/MythicDialog';
import LockIcon from '@mui/icons-material/Lock';
import {TaskFromUIButton} from './TaskFromUIButton';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';

const dataFragment = gql`
fragment objData on process {
    name
    process_id
    parent_process_id
    architecture
    bin_path
    integrity_level
    id
    user
}
`;
const taskFragment = gql`
fragment taskDataProcess on task {
    id
    callback {
        id
        host
        payload {
            id
            os
            payloadtype{
                ptype
            }
        }
    }
}
`;
const getNextProcessQuery = gql`
${dataFragment}
${taskFragment}
query getHostProcessesQuery($operation_id: Int!, $host: String!, $task_id: Int!) {
    process(where: {operation_id: {_eq: $operation_id}, host: {_eq: $host}, task_id: {_gt: $task_id}}, order_by: {task_id: asc}, limit: 1) {
        task {
            ...taskDataProcess
            processes(order_by: {process_id: asc}) {
                ...objData
            }
        }
    }
  }
`;
const getPrevProcessQuery = gql`
${dataFragment}
${taskFragment}
query getHostProcessesQuery($operation_id: Int!, $host: String!, $task_id: Int!) {
    process(where: {operation_id: {_eq: $operation_id}, host: {_eq: $host}, task_id: {_lt: $task_id}}, order_by: {task_id: desc}, limit: 1) {
        task {
            ...taskDataProcess
            processes(order_by: {name: asc}) {
                ...objData
            }
        }
    }
  }
`;
const getLatestTaskForHost = gql`
query getHostsQuery($operation_id: Int!, $host:String!){
    process_aggregate(where: {operation_id: {_eq: $operation_id}, host: {_eq: $host}}, distinct_on: task_id){
        aggregate {
            max {
              task_id
            }
        }
    }
}
`;

export function CallbacksTabsProcessBrowserLabel(props){
    const [description, setDescription] = React.useState("Processes: " + props.tabInfo.host)
    const [openEditDescriptionDialog, setOpenEditDescriptionDialog] = React.useState(false);
    const onContextMenu = (event) => {
        event.stopPropagation();
        event.preventDefault();
        setOpenEditDescriptionDialog(true);
    }
    useEffect( () => {
        if(props.tabInfo.customDescription !== "" && props.tabInfo.customDescription !== undefined){
            setDescription(props.tabInfo.customDescription);
        }else{
            setDescription("Processes: " + props.tabInfo.host);
        }
    }, [props.tabInfo.customDescription])
    const editDescriptionSubmit = (description) => {
        props.onEditTabDescription(props.tabInfo, description);
    }
    return (
        <React.Fragment>
            <MythicTabLabel label={description} onContextMenu={onContextMenu} {...props}/>
            {openEditDescriptionDialog &&
                <MythicDialog fullWidth={true} open={openEditDescriptionDialog}  onClose={() => {setOpenEditDescriptionDialog(false);}}
                    innerDialog={
                        <MythicModifyStringDialog title={"Edit Tab's Description"} onClose={() => {setOpenEditDescriptionDialog(false);}} value={description} onSubmit={editDescriptionSubmit} />
                    }
                />
            }
        </React.Fragment>  
    )
}
export const CallbacksTabsProcessBrowserPanel = ({index, value, tabInfo}) =>{
    const me = useReactiveVar(meState);
    const fileBrowserRoots = React.useRef([]);
    const [fileBrowserRootsState, setFileBrowserRootsState] = React.useState([]);
    const [selectedFolder, setSelectedFolder] = React.useState([]);
    const [taskInfo, setTaskInfo] = React.useState({});
    const currentCallbackIDSetInTable = React.useRef();
    const [currentOS, setCurrentOS] = React.useState("");
    const [openTaskingButton, setOpenTaskingButton] = React.useState(false);
    const taskingData = React.useRef({"parameters": "", "ui_feature": "process_browser:list"});
    const buildProcessTree = (originalProcesses) => {
        // Build a map of each PID to its list index
        let processes = originalProcesses.map(p => { return {...p, children: []}})
        let processIdx = {};
        for (let i = 0; i < processes.length; i += 1) {
            processIdx[processes[i].process_id] = i;
        }

        // Check for any parent_process_id values that do not exist
        for (let i = 0; i < processes.length; i += 1) {
            if (!processIdx.hasOwnProperty(processes[i].parent_process_id)) {
                processes[i].parent_process_id = null;
            }
        }

        // Push each process into the correct list
        let dataTree = [];
        for (let i = 0; i < processes.length; i += 1) {
            const cur = processes[i];
            if(cur.parent_process_id === null || cur.parent_process_id <= 0){
                dataTree.push(cur);
            }else{
                processes[processIdx[cur.parent_process_id]].children.push(cur);
            }
        }

        return dataTree;
    }
    const [getNextProcessDataByHostAndTask] = useLazyQuery(getNextProcessQuery, {
        onError: data => {
            console.error(data)
        },
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            if(data.process.length > 0){
                let dataTree = buildProcessTree(data.process[0].task.processes);
                setFileBrowserRootsState(dataTree);
                setSelectedFolder(data.process[0].task.processes);
                setCurrentOS(data.process[0].task.callback.payload.os);
                setTaskInfo(data.process[0].task);
                snackActions.dismiss();
                snackActions.success("Successfully fetched process data");
            }else{
                snackActions.dismiss();
                snackActions.warning("No Newer Process Sets");
            }
            
        }
    });
    
    const [getPreviousProcessDataByHostAndTask] = useLazyQuery(getPrevProcessQuery, {
        onError: data => {
            console.error(data)
        },
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            if(data.process.length > 0){
                let dataTree = buildProcessTree(data.process[0].task.processes);
                setFileBrowserRootsState(dataTree);
                setSelectedFolder(data.process[0].task.processes);
                setCurrentOS(data.process[0].task.callback.payload.os);
                setTaskInfo(data.process[0].task);
                snackActions.dismiss();
                snackActions.success("Successfully fetched process data");
            }else{
                snackActions.dismiss();
                snackActions.warning("No Earlier Process Sets");
            }
            
        }
    });
    useQuery(getLatestTaskForHost, {
        variables: {operation_id: me.user.current_operation_id, host: tabInfo.host},
        onCompleted: (data) => {
            if(data.process_aggregate.aggregate.max.task_id === null){
                snackActions.warning("No Process Data for " + tabInfo.host)
                setTaskInfo({callback: {host: tabInfo.host, id: tabInfo.callbackID}, id: 0})
            }else{
                snackActions.info("Fetching latest process data for " + tabInfo.host);
                getNextProcessDataByHostAndTask({variables: {operation_id: me.user.current_operation_id, 
                    host: tabInfo.host,
                    task_id: data.process_aggregate.aggregate.max.task_id - 1
                }});
            }
        }, fetchPolicy: "network-only"
    });
    useEffect( () => {
        fileBrowserRoots.current = fileBrowserRootsState;
    }, [fileBrowserRootsState])

    const onListFilesButton = ({callbackID}) => {
        taskingData.current = ({"parameters": "", "ui_feature": "process_browser:list"});
        setOpenTaskingButton(true);
    }
    const onNextButton = ({task_id}) => {
        getNextProcessDataByHostAndTask({variables: {operation_id: me.user.current_operation_id, 
            host: tabInfo.host,
            task_id: task_id
        }})
    }
    const onPreviousButton = ({task_id}) => {
        getPreviousProcessDataByHostAndTask({variables: {operation_id: me.user.current_operation_id, 
            host: tabInfo.host,
            task_id: task_id
        }})
    }
    const onDiffButton = ({task_id}) => {
        
    }
    const onTaskRowAction = ({process_id, architecture, uifeature}) => {
        taskingData.current = {"parameters": {"process_id": process_id, "architecture": architecture}, "ui_feature": uifeature, openDialog: true};
        setOpenTaskingButton(true);
        console.log(process_id, architecture, uifeature);
    }
    const onChangeCallbackID = (callbackID) => {
        currentCallbackIDSetInTable.current = callbackID;
    }
    return (
        <MythicTabPanel index={index} value={value} >
            <div style={{display: "flex", flexGrow: 1, overflowY: "auto"}}>
                <div style={{width: "30%", overflow: "auto", flexGrow: 1}}>
                    <CallbacksTabsProcessBrowserTree 
                        treeRoot={fileBrowserRootsState} />
                </div>
                <div style={{width: "60%", display: "flex", flexDirection: "column", overflow: "auto", flexGrow: 1}}>
                    <ProcessBrowserTableTop
                        onListFilesButton={onListFilesButton} 
                        onNextButton={onNextButton} 
                        onPreviousButton={onPreviousButton}
                        onDiffButton={onDiffButton}  
                        initialCallbackID={tabInfo.callbackID}
                        onChangeCallbackID={onChangeCallbackID}
                        taskInfo={taskInfo}/>
                    <CallbacksTabsProcessBrowserTable selectedFolder={selectedFolder} onTaskRowAction={onTaskRowAction} os={currentOS}/>
                </div>
                {openTaskingButton && 
                    <TaskFromUIButton ui_feature={taskingData.current?.ui_feature || " "} 
                        callback_id={currentCallbackIDSetInTable.current} 
                        parameters={taskingData.current?.parameters || ""}
                        openDialog={taskingData.current?.openDialog || false}
                        onTasked={() => setOpenTaskingButton(false)}/>
                    }
            </div>            
        </MythicTabPanel>
    )
}
const ProcessBrowserTableTop = ({onListFilesButton, onNextButton, onPreviousButton, initialCallbackID, onDiffButton, onChangeCallbackID, taskInfo}) => {
    const theme = useTheme();
    const [hostname, setHostname] = React.useState("");
    const [callbackID, setCallbackID] = React.useState(initialCallbackID);
    const [manuallySetCallbackID, setManuallySetCallbackID] = React.useState(true);
    const [taskID, setTaskID] = React.useState(0);
    const onChangeID = (name, value, error) => {
        setManuallySetCallbackID(true);
        setCallbackID(parseInt(value));
    }
    const revertCallbackID = () => {
        setManuallySetCallbackID(false);
        if(taskInfo.callback !== undefined){
            setCallbackID(taskInfo.callback.id);
        }else{
            setCallbackID(0);
        }
        
    }
    useEffect( () => {
        if(taskInfo.callback !== undefined){
            setHostname(taskInfo.callback.host);    
            setTaskID(taskInfo.id);
        }
        if(!manuallySetCallbackID){
            if(taskInfo.callback !== undefined){
                setCallbackID(taskInfo.callback.id);
            }else{
                setCallbackID(0);
            }
            
        }
    }, [taskInfo, manuallySetCallbackID]);
    const onLocalListFilesButton = () => {
        if(callbackID > 0){
            onListFilesButton({callbackID})
        }else{
            snackActions.warning("Must set a callback number to task first");
        }
    }
    const onLocalNextButton = () => {
        snackActions.info("Fetching next process data...");
        onNextButton({task_id: taskInfo.id});
    }
    const onLocalPreviousButton = () => {
        snackActions.info("Fetching previous process data...");
        onPreviousButton({task_id: taskInfo.id});
    }
    const onLocalDiffButton = () => {
        if(callbackID > 0){
            onNextButton({callbackID});
        }else{
            snackActions.warning("Must select a callback number first");
        }
    }
    useEffect( () => {
        onChangeCallbackID(callbackID);
    }, [callbackID, onChangeCallbackID])
    return (
        <Grid container spacing={0} style={{paddingTop: "10px"}}>
            <Grid item xs={10}>
                <MythicTextField placeholder="Host Name" value={hostname} disabled
                    onChange={() => {}} name="Host Name" InputProps={{
                        endAdornment: 
                        <React.Fragment>
                            <MythicStyledTooltip title="Fetch Previous Saved Process Listing">
                                <IconButton style={{padding: "3px"}} onClick={onLocalPreviousButton} size="large"><SkipPreviousIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </MythicStyledTooltip>
                            <MythicStyledTooltip title="Task Callback to List Processes">
                                <IconButton style={{padding: "3px"}} onClick={onLocalListFilesButton} size="large"><RefreshIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </MythicStyledTooltip>
                            <MythicStyledTooltip title="Fetch Next Saved Process Listing">
                                <IconButton style={{padding: "3px"}} onClick={onLocalNextButton} size="large"><SkipNextIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </MythicStyledTooltip>
                            <MythicStyledTooltip title="Compare Previous Listing">
                                <IconButton style={{padding: "3px"}} onClick={onLocalDiffButton} size="large"><CompareArrowsIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </MythicStyledTooltip>
                        </React.Fragment>
                    }} />
            </Grid>
            <Grid item xs={1}>
                <MythicTextField type="number" placeholder="Callback" name="Callback"
                    onChange={onChangeID} value={callbackID} InputProps={{
                        endAdornment: manuallySetCallbackID ? (
                            <MythicStyledTooltip title="Change Callback Based on Data Origin">
                                <IconButton style={{padding: "3px"}} onClick={revertCallbackID} size="large">
                                    <LockIcon style={{color: theme.palette.info.main}}/>
                                </IconButton>
                            </MythicStyledTooltip>
                        ) : (<MythicStyledTooltip title="Manually Update Callback Number to Prevent Data Origin Tracking">
                                <IconButton style={{padding: "3px"}} size="large">
                                    <RotateLeftIcon disabled style={{color: theme.palette.warning.main}}/> 
                                </IconButton>
                            </MythicStyledTooltip>),
                        style: {padding: 0, margin: 0}
                    }}/>
            </Grid>
            <Grid item xs={1}>
                <MythicTextField type="number" name="Task Data"
                    disabled value={taskID} onChange={() => {}}/>
            </Grid>
        </Grid>
    );
}
