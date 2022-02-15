import React, {useCallback, useEffect} from 'react';
import {Button} from '@mui/material';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import { MythicDisplayTextDialog} from '../../MythicComponents/MythicDisplayTextDialog';
import {MythicModifyStringDialog} from '../../MythicComponents/MythicDialog';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import LockIcon from '@mui/icons-material/Lock';
import {getTimeDifference, useInterval } from '../../utilities/Time';
import WifiIcon from '@mui/icons-material/Wifi';
import InsertLinkTwoToneIcon from '@mui/icons-material/InsertLinkTwoTone';
import {C2PathDialog} from './C2PathDialog';
import {snackActions} from '../../utilities/Snackbar';
import Paper from '@mui/material/Paper';
import Grow from '@mui/material/Grow';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {hideCallbackMutation} from './CallbackMutations';
import {useMutation } from '@apollo/client';
import SnoozeIcon from '@mui/icons-material/Snooze';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import {useTheme} from '@mui/material/styles';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faQuestion, faSkullCrossbones, faFolderOpen, faList} from '@fortawesome/free-solid-svg-icons';
import {faLinux, faApple, faWindows, faChrome} from '@fortawesome/free-brands-svg-icons';
import {useSubscription, gql } from '@apollo/client';
import {DetailedCallbackTable} from './DetailedCallbackTable';
import InfoIcon from '@mui/icons-material/Info';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import {TaskFromUIButton} from './TaskFromUIButton';
import {CallbacksTabsTaskMultipleDialog} from './CallbacksTabsTaskMultipleDialog';
import {CallbacksTabsHideMultipleDialog} from './CallbacksTabsHideMultipleDialog';

const SUB_Callbacks = gql`
subscription CallbacksSubscription ($callback_id: Int!){
  callback_by_pk(id: $callback_id) {
    id
    last_checkin
  }
}
 `;
export const CallbacksTableIDCell = ({rowData, onOpenTab, toggleLock, updateDescription}) =>{
    const dropdownAnchorRef = React.useRef(null);
    const theme = useTheme();
    const [openMetaDialog, setOpenMetaDialog] = React.useState(false);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [openEditDescriptionDialog, setOpenEditDescriptionDialog] = React.useState(false);
    const [openTaskingButton, setOpenTaskingButton] = React.useState(false);
    const taskingData = React.useRef({"parameters": "", "ui_feature": "callback_table:exit"});
    const [openTaskMultipleDialog, setOpenTaskMultipleDialog] = React.useState(false);
    const [openHideMultipleDialog, setOpenHideMultipleDialog] = React.useState(false);
    const editDescriptionSubmit = (description) => {
        updateDescription({description, id: rowData.id})
    }
    const handleDropdownToggle = (evt) => {
            evt.stopPropagation();
            setDropdownOpen((prevOpen) => !prevOpen);
      };
    const localOnOpenTab = (tabType) => {
        if(tabType === "interact"){
            onOpenTab({tabType, tabID: rowData.id + tabType, callbackID: rowData.id});
        }else if(tabType === "processBrowser"){
            onOpenTab({tabType, tabID: rowData.host, callbackID: rowData.id});
        }else{
            onOpenTab({tabType, tabID: rowData.id + tabType, callbackID: rowData.id});
        }
    }
    const handleMenuItemClick = (event, index) => {
        options[index].click(event);
        setDropdownOpen(false);
    };
    const handleClose = (event) => {
        if (dropdownAnchorRef.current && dropdownAnchorRef.current.contains(event.target)) {
          return;
        }

        setDropdownOpen(false);
      };
    const [hideCallback] = useMutation(hideCallbackMutation, {
        update: (cache, {data}) => {
            if(data.updateCallback.status === "success"){
                snackActions.success("Hiding callback");
            }else{
                snackActions.warning(data.updateCallback.error);
            }
            
        },
        onError: data => {
            console.log(data);
        }
    });
    const localToggleLock = () => {
        toggleLock({id: rowData.id, locked: rowData.locked})
    }
    const options =  [
        {name: 'Hide Callback', icon: <VisibilityOffIcon style={{paddingRight: "5px"}}/>, click: (evt) => {
            evt.stopPropagation();
            hideCallback({variables: {callback_id: rowData.id}});
        }},
        {
            name: "Hide Multiple", icon: <VisibilityOffIcon style={{paddingRight: "5px"}}/>, click: (evt) => {
                setOpenHideMultipleDialog(true);
            }
        },
        {
            name: "Exit Callback", icon: <FontAwesomeIcon icon={faSkullCrossbones} style={{cursor: "pointer", marginRight: "10px"}} />, click: (evt) => {
                taskingData.current = {"parameters": "", "ui_feature": "callback_table:exit", "getConfirmation": true, acceptText: "exit"};
                setOpenTaskingButton(true);
            }
        },
        {
            name: "Task Multiple", icon: <FontAwesomeIcon icon={faList} style={{cursor: "pointer", marginRight: "10px"}} />, click: (evt) => {
                setOpenTaskMultipleDialog(true);
            }
        },
        {name: 'File Browser', icon: <FontAwesomeIcon icon={faFolderOpen} style={{cursor: "pointer", marginRight: "10px"}} />, click: (evt) => {
            evt.stopPropagation();
            localOnOpenTab("fileBrowser");
        }},
        {name: 'Process Browser', icon: <AccountTreeIcon style={{paddingRight: "5px"}}/>, click: (evt) => {
            evt.stopPropagation();
            localOnOpenTab("processBrowser");
        }},
        {name: rowData.locked ? 'Unlock (Locked by ' + rowData.locked_operator.username + ')' : 'Lock Callback', icon: rowData.locked ? (<LockOpenIcon style={{paddingRight: "5px"}}/>) : (<LockIcon style={{paddingRight: "5px"}} />), click: (evt) => {
            evt.stopPropagation();
            localToggleLock();
        }},
        {name: "Edit Description", icon: <EditIcon style={{paddingRight: "5px"}} />, click: (evt) => {
            evt.stopPropagation();
            setOpenEditDescriptionDialog(true);
        }},
        {name: "Expand Callback", icon: <OpenInNewIcon style={{paddingRight: "5px"}} />, click: (evt) => {
            evt.stopPropagation();
            window.open("/new/callbacks/" + rowData.id, "_blank").focus();
        }},
        {name: "View Metadata", icon: <InfoIcon style={{paddingRight: "5px"}} />, click: (evt) => {
            evt.stopPropagation();
            setOpenMetaDialog(true);
        }}
    ];
    return (
        <div>
            <ButtonGroup  
                color={rowData.integrity_level > 2 ? "error" : "primary"} 
                ref={dropdownAnchorRef} 
                aria-label="split button"
                color="info"
            >
                <Button style={{padding: "0 10px 0 10px"}} color={rowData.integrity_level > 2 ? "error" : "primary"}  variant="contained"
                    onClick={(evt) => {evt.stopPropagation();localOnOpenTab("interact")}}>
                    { rowData.locked ? (<LockIcon fontSize="large" style={{marginRight: "10px"}} />):(<KeyboardIcon fontSize="large" style={{marginRight: "10px"}}/>) } 
                    {rowData.id}
                </Button>
                <Button
                    style={{margin: 0, padding: 0}}
                    variant="contained"
                    aria-controls={dropdownOpen ? 'split-button-menu' : undefined}
                    aria-expanded={dropdownOpen ? 'true' : undefined}
                    color={rowData.integrity_level > 2 ? "secondary" : "primary"} 
                    aria-haspopup="menu"
                    onClick={handleDropdownToggle}
                >
                <ArrowDropDownIcon/>
                </Button>
            </ButtonGroup>
            <Popper open={dropdownOpen} anchorEl={dropdownAnchorRef.current} role={undefined} transition style={{zIndex: 200}}>
                {({ TransitionProps, placement }) => (
                <Grow
                    {...TransitionProps}
                    style={{
                    transformOrigin: placement === 'bottom' ? 'top left' : 'top center',
                    }}
                >
                    <Paper style={{backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light, color: "white"}} elevation={5}>
                    <ClickAwayListener onClickAway={handleClose}>
                        <MenuList id="split-button-menu">
                        {options.map((option, index) => (
                            <MenuItem
                            key={option.name}
                            onClick={(event) => handleMenuItemClick(event, index)}
                            >
                            {option.icon}{option.name}
                            </MenuItem>
                        ))}
                        </MenuList>
                    </ClickAwayListener>
                    </Paper>
                </Grow>
                )}
            </Popper>     
            {openTaskingButton && 
                <TaskFromUIButton ui_feature={taskingData.current?.ui_feature || " "} 
                    callback_id={rowData.id} 
                    parameters={taskingData.current?.parameters || ""}
                    openDialog={taskingData.current?.openDialog || false}
                    getConfirmation={taskingData.current?.getConfirmation || false}
                    acceptText={taskingData.current?.acceptText || "YES"}
                    onTasked={() => setOpenTaskingButton(false)}/>
            }  
            {openMetaDialog && 
                <MythicDialog fullWidth={true} maxWidth="lg" open={openMetaDialog}
                    onClose={()=>{setOpenMetaDialog(false);}} 
                    innerDialog={<DetailedCallbackTable onClose={()=>{setOpenMetaDialog(false);}} callback_id={rowData.id} />}
                />
            }
            {openEditDescriptionDialog &&
                <MythicDialog 
                    fullWidth={true} 
                    open={openEditDescriptionDialog}  
                    onClose={() => {setOpenEditDescriptionDialog(false);}}
                    innerDialog={
                        <MythicModifyStringDialog title={"Edit Callback's Description"} 
                            onClose={() => {setOpenEditDescriptionDialog(false);}} 
                            value={rowData.description} 
                            onSubmit={editDescriptionSubmit} 
                        />
                    }
                />
            }
            {openTaskMultipleDialog &&
                <MythicDialog 
                    fullWidth={true} 
                    maxWidth="lg"
                    open={openTaskMultipleDialog}  
                    onClose={() => {setOpenTaskMultipleDialog(false);}}
                    innerDialog={
                        <CallbacksTabsTaskMultipleDialog onClose={() => {setOpenTaskMultipleDialog(false);}} />
                    }
                />
            }
            {openHideMultipleDialog &&
                <MythicDialog 
                    fullWidth={true} 
                    maxWidth="lg"
                    open={openHideMultipleDialog}  
                    onClose={() => {setOpenHideMultipleDialog(false);}}
                    innerDialog={
                        <CallbacksTabsHideMultipleDialog onClose={() => {setOpenHideMultipleDialog(false);}} />
                    }
                />
            }
    </div>
    )
}
export const CallbacksTableStringCell = ({cellData}) => {
    return (
        <div>{cellData}</div>
    )
}
export const CallbacksTableLastCheckinCell = React.memo( (props) => {
    const [displayTime, setDisplayTime] = React.useState("");
    const [lastCheckin, setLastCheckin] = React.useState(-1);
    const mountedRef = React.useRef(true);
    useSubscription(SUB_Callbacks, {
        variables: {callback_id: props.rowData.id}, fetchPolicy: "network-only", shouldResubscribe: true,
        onSubscriptionData: ({subscriptionData}) => {
            if(!mountedRef.current || !props.parentMountedRef.current){
                return null;
            }
            setLastCheckin(subscriptionData.data.callback_by_pk.last_checkin);
        }
    });
    useInterval( () => {
        if(!mountedRef.current || !props.parentMountedRef.current){
            return null;
        }
        if(lastCheckin === -1){
            setDisplayTime("Loading...");
            return;
        }
        setDisplayTime(getTimeDifference(lastCheckin));
    }, 1000, mountedRef, props.parentMountedRef);
    React.useEffect( () => {
        return() => {
            mountedRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <div>
            {displayTime}
        </div>
        
    )
});
export const CallbacksTablePayloadTypeCell = ({rowData}) => {
    return (
        <MythicStyledTooltip title={rowData.payload.payloadtype.ptype}>
            <img
                style={{width: "35px", height: "35px"}}
                src={"/static/" + rowData.payload.payloadtype.ptype + ".svg"}
            />
        </MythicStyledTooltip>
    )
}
export const CallbacksTableC2Cell = ({rowData, initialCallbackGraphEdges}) => {
    const theme = useTheme();
    const [activeEgress, setActiveEgress] = React.useState(theme.palette.success.main);
    const [activeEgressBool, setActiveEgressBool] = React.useState(true);
    const [hasEgressRoute, setHasEgressRoute] = React.useState(true);
    const [openC2Dialog, setOpenC2Dialog] = React.useState(false);
    const [callbackgraphedges, setCallbackgraphedges] = React.useState([]);
    const [callbackgraphedgesAll, setCallbackgraphedgesAll] = React.useState([]);

    const onOpenC2Dialog = (event) => {
        event.stopPropagation();
        setOpenC2Dialog(true);
    }
    useEffect( () => {
        const routes = callbackgraphedgesAll.filter( (edge) => {
            if(!edge.c2profile.is_p2p && edge.source.id === rowData.id && edge.destination.id === rowData.id){
                return true;
            }
            return false;
        }).length;
        if(routes > 0 && !hasEgressRoute){
            setHasEgressRoute(true);
        }else if(routes === 0 && hasEgressRoute){
            setHasEgressRoute(false);
        }
    }, [callbackgraphedgesAll]);
    useEffect( () => {
        const getEdges = (activeOnly) => {
            //update our aggregate of callbackgraphedges for both src and dst that involve us
            let myEdges = initialCallbackGraphEdges?.filter( (edge) =>{
                if(edge.source.id === rowData.id || edge.destination.id === rowData.id){
                    if(activeOnly){
                        if(edge.end_timestamp === null){
                            return true;
                        }
                        else{return false}
                    }
                    return true;
                }
                return false;
            }) || [];
            let foundMore = true;
            while(foundMore){
                //look at all of the edges in myEdges and see if there are any edges that share a source/destination in props.callbackgraphedges that are _not_ in myEdges so far
                const newEdges = initialCallbackGraphEdges?.reduce( (prev, edge) => {
                    //looking to see if we should add 'edge' to our list of relevant edges
                    if(prev.includes(edge)){return [...prev]}
                    //look through all of the previous edges we know about and see if there's a matching source/destination id with the new edge
                    const matching = prev.filter( (e) => {
                        if(e.source.id === edge.source.id || e.source.id === edge.destination.id || e.destination.id === edge.source.id ){
                            if(activeOnly){
                                if(edge.end_timestamp === null) { return true}
                                else{return false}
                            }
                            return true;
                        }
                        return false;
                    });
                    if(matching.length > 0){
                        return [...prev, edge];
                    }else{
                        return [...prev];
                    }
                }, [...myEdges]) || [];
                foundMore = newEdges.length > myEdges;
                myEdges = [...newEdges];
            }
            return myEdges;
        }
        const myActiveEdges = getEdges(true);
        const myEdges = getEdges(false);
        if(callbackgraphedges.length !== myActiveEdges.length){
            setCallbackgraphedges(myActiveEdges);
        }
        if(callbackgraphedgesAll.length !== myEdges.length){
            setCallbackgraphedgesAll(myEdges);
        }
    }, [initialCallbackGraphEdges, rowData.id]);
    useEffect( () => {
        //determine if there are any active routes left at all
        const activeRoutes = callbackgraphedges.filter( (edge) => {
            if(!edge.c2profile.is_p2p  && edge.end_timestamp === null){
                return true;
            }
            return false
        });
        if(activeRoutes.length === 0){
            setActiveEgress(theme.palette.error.main);
            setActiveEgressBool(false);
        }else{
            setActiveEgress(theme.palette.success.main);
            setActiveEgressBool(true);
        }
    }, [callbackgraphedges, theme.palette.success.main, theme.palette.error.main]);
    useEffect( () => {
        if(!activeEgressBool){
            //snackActions.warning(`Callback ${rowData.id} has no egress route! Re-link before tasking`);
        }
    }, [activeEgressBool])
    return (
        <div>
            {hasEgressRoute ? 
                <WifiIcon onClick={onOpenC2Dialog} style={{color: activeEgress, cursor: "pointer"}}/> : 
                <InsertLinkTwoToneIcon onClick={onOpenC2Dialog} style={{color: activeEgress, cursor: "pointer"}} />
            }
            <MythicDialog 
                fullWidth={true} 
                maxWidth="lg" 
                open={openC2Dialog}
                onClose={()=>{setOpenC2Dialog(false);}} 
                innerDialog={
                    <C2PathDialog 
                        onClose={()=>{setOpenC2Dialog(false);}} {...rowData} 
                        callbackgraphedges={activeEgressBool ? callbackgraphedges : callbackgraphedgesAll} 
                    />
                }
            />
        </div>
        
    )
}
export const CallbacksTableOSCell = React.memo( ({rowData, cellData}) => {
    const [openOSDialog, setOpenOSDialog] = React.useState(false);
    const getOSIcon = useCallback( () => {
        switch(rowData.payload.os.toLowerCase()){
            case "windows":
                return <FontAwesomeIcon icon={faWindows} size="2x" style={{cursor: "pointer"}} onClick={displayOSInfo} />
            case "linux":
                return <FontAwesomeIcon icon={faLinux} size="2x" style={{cursor: "pointer"}} onClick={displayOSInfo} />
            case "macos":
                return <FontAwesomeIcon icon={faApple} size="2x" style={{cursor: "pointer"}} onClick={displayOSInfo}/>
            case "chrome":
                return <FontAwesomeIcon icon={faChrome} size="2x" style={{cursor: "pointer"}} onClick={displayOSInfo} />
            default:
                return <FontAwesomeIcon icon={faQuestion} size="2x" style={{cursor: "pointer"}} onClick={displayOSInfo} />
        }
    }, []);
    const displayOSInfo = React.useCallback( () => {
        setOpenOSDialog(true);
    }, []);
    return (
        <div>
            {getOSIcon()}
            { openOSDialog &&
                <MythicDisplayTextDialog 
                    onClose={()=>{setOpenOSDialog(false);}} 
                    title={"Operating System Information"} 
                    maxWidth={"md"} 
                    fullWidth={true} 
                    value={cellData} 
                    open={openOSDialog}
                />
            }
        </div>
        
                
    )
});
export const CallbacksTableSleepCell = ({rowData, cellData, updateSleepInfo}) => {
    const theme = useTheme();
    const [openSleepDialog, setOpenSleepDialog] = React.useState(false);
    const editSleepSubmit = (sleep) => {
        updateSleepInfo({sleep_info: sleep, id: rowData.id});
    }
    const onOpenSleepDialog = (event) => {
        event.stopPropagation();
        setOpenSleepDialog(true);
    }
    return (
        <div>
            <SnoozeIcon onClick={onOpenSleepDialog} 
                style={{color: cellData === "" ? theme.palette.warning.main : theme.palette.info.main, cursor: "pointer"}}
            />
            { openSleepDialog &&
                <MythicDialog fullWidth={true} open={openSleepDialog}  onClose={() => {setOpenSleepDialog(false);}}
                    innerDialog={
                        <MythicModifyStringDialog title={"Sleep Information"} 
                            onClose={() => {setOpenSleepDialog(false);}} 
                            value={cellData} 
                            onSubmit={editSleepSubmit} />
                    }
                />
            }
        </div>
        
            
    )
}