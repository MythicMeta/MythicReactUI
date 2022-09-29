import React, {useEffect} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {getTimeDifference, useInterval } from '../../utilities/Time';
import {useTheme} from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import WifiIcon from '@mui/icons-material/Wifi';
import InsertLinkTwoToneIcon from '@mui/icons-material/InsertLinkTwoTone';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {MythicModifyStringDialog} from '../../MythicComponents/MythicDialog';
import {C2PathDialog} from '../Callbacks/C2PathDialog';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import {useSubscription, gql } from '@apollo/client';

const SUB_Edges = gql`
subscription CallbacksSubscription ($operation_id: Int!){
  callbackgraphedge(where: {operation_id: {_eq: $operation_id}}, order_by: {id: desc}) {
    id
    end_timestamp
    direction
    destination {
      active
      id
      operation_id
      user
      host
      payload {
        payloadtype {
          ptype
          id
        }
      }
      callbackc2profiles {
        c2profile {
          name
        }
      }
    }
    source {
      active
      id
      user
      operation_id
      host
      payload {
        payloadtype {
          ptype
          id
        }
      }
      callbackc2profiles {
        c2profile {
          name
        }
      }
    }
    c2profile {
      id
      is_p2p
      name
    }
  }
}
 `;

export function ExpandedCallbackSideDetails(props){
    const maxWidth = "30%";
    const theme = useTheme();
    return (
        <div style={{maxWidth, width: maxWidth, display: "inline-flex", height: "calc(94vh)", flexDirection: "column"}}>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main, marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                    Callback {props.callback.id}
                </Typography>
            </Paper>
            <TableContainer component={Paper} className="mythicElement">   
            <ExpandedCallbackSideDetailsTable {...props.callback} />
        </TableContainer>
        </div>
    )
}


export function ExpandedCallbackSideDetailsTable(props){
    const dropdownAnchorRef = React.useRef(null);
    const theme = useTheme();
    const me = useReactiveVar(meState);
    const [displayTime, setDisplayTime] = React.useState("");
    const [openEditDescriptionDialog, setOpenEditDescriptionDialog] = React.useState(false);
    const [activeEgress, setActiveEgress] = React.useState(theme.palette.success.main);
    const [activeEgressBool, setActiveEgressBool] = React.useState(true);
    const [openC2Dialog, setOpenC2Dialog] = React.useState(false);
    const [callbackgraphedges, setCallbackgraphedges] = React.useState([]);
    const [callbackgraphedgesAll, setCallbackgraphedgesAll] = React.useState([]);
    const [hasEgressRoute, setHasEgressRoute] = React.useState(true);
    const [callbackEdges, setCallbackEdges] = React.useState([]);
    useSubscription(SUB_Edges, {
        variables: {operation_id: me.user.current_operation_id}, fetchPolicy: "network-only",
        shouldResubscribe: true,
        onSubscriptionData: ({subscriptionData}) => {
          setCallbackEdges(subscriptionData.data.callbackgraphedge)
        }
    });
    const updateTime = (curTime) => {
        setDisplayTime(getTimeDifference(curTime));
    };
    useInterval( () => {
        updateTime(props.last_checkin);
    });
    useEffect( () => {
        const routes = callbackgraphedgesAll.filter( (edge) => {
            if(!edge.c2profile.is_p2p && edge.source.id === props.id && edge.destination.id === props.id){
                return true;
            }
            return false;
        }).length;
        if(routes > 0 && !hasEgressRoute){
            setHasEgressRoute(true);
        }else if(routes === 0 && hasEgressRoute){
            setHasEgressRoute(false);
        }
    }, [callbackgraphedgesAll])
    useEffect( () => {
        const getEdges = (activeOnly) => {
            //update our aggregate of callbackgraphedges for both src and dst that involve us
            let myEdges = callbackEdges.filter( (edge) =>{
                if(edge.source.id === props.id || edge.destination.id === props.id){
                    if(activeOnly){
                        if(edge.end_timestamp === null){
                            return true;
                        }
                        else{return false}
                    }
                    return true;
                }
                return false;
            });
            let foundMore = true;
            while(foundMore){
                //look at all of the edges in myEdges and see if there are any edges that share a source/destination in callbackEdges that are _not_ in myEdges so far
                const newEdges = callbackEdges.reduce( (prev, edge) => {
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
                }, [...myEdges]);
                foundMore = newEdges.length > myEdges;
                myEdges = [...newEdges];
            }
            return myEdges;
        }
        const myActiveEdges = getEdges(true);
        const myEdges = getEdges(false);
        setCallbackgraphedges(myActiveEdges);
        setCallbackgraphedgesAll(myEdges);
    }, [callbackEdges, props.id]);
    
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

    const toggleLock = () => {
        props.toggleLock({id: props.id, locked: props.locked})
    }
    const editDescriptionSubmit = (description) => {
        props.updateDescription({description, id: props.id})
    }
    const options = [{name: props.locked ? 'Locked (by ' + props.locked_operator.username + ')' : 'Unlocked', icon: props.locked ? (<LockIcon style={{paddingRight: "5px"}}/>) : (<LockOpenIcon style={{paddingRight: "5px"}} />), click: (evt) => {
                        evt.stopPropagation();
                        toggleLock();
                     }},
                     {name: "Edit Description", icon: <EditIcon style={{paddingRight: "5px"}} />, click: (evt) => {
                        evt.stopPropagation();
                        setOpenEditDescriptionDialog(true);
                     }},
                 ];
    return (
        <Table  size="small" style={{"overflow": "scroll"}}>
                <TableBody>
                    <TableRow hover>
                        <TableCell>Elevation Level</TableCell>
                        <TableCell>{props.integrity_level}
                            {props.integrity_level > 2 ? (" ( High Integrity )") : ""}
                            {props.integrity_level === 2 ? (" ( Medium Integrity ) ") : ""}
                            {props.integrity_level < 2 ? (" ( Low Integrity )") : ""}
                        </TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Callback Lock Status</TableCell>
                        <TableCell>
                            {props.locked ? (
                                <React.Fragment>
                                    <LockIcon style={{paddingRight: "5px", display: "inline-block", paddingTop: "6px"}}/>
                                    <Typography style={{display: "inline-block"}}>
                                        {'Locked (by ' + props.locked_operator.username + ')'}
                                    </Typography>
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <LockOpenIcon style={{paddingRight: "5px", display: "inline-block", paddingTop: "6px"}}/>
                                    
                                    <Typography style={{display: "inline-block"}}>
                                        {'Unlocked'}
                                    </Typography>
                                </React.Fragment>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>IP Address</TableCell>
                        <TableCell>{props.ip}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>External IP</TableCell>
                        <TableCell>{props.external_ip}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Host</TableCell>
                        <TableCell>{props.host}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>User</TableCell>
                        <TableCell>{props.user}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Domain</TableCell>
                        <TableCell>{props.domain}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>OS / Architecture</TableCell>
                        <TableCell>{props.os}({props.architecture})</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Process ID</TableCell>
                        <TableCell>{props.pid}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Last Checkin</TableCell>
                        <TableCell>{displayTime}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>First Checkin</TableCell>
                        <TableCell>{props.init_callback}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Description</TableCell>
                        <TableCell>{props.description}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Sleep Info</TableCell>
                        <TableCell>{props.sleep_info}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Agent Type</TableCell>
                        <TableCell>{props.payload.payloadtype.ptype}</TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Egress Route</TableCell>
                        <TableCell>
                        {hasEgressRoute ? 
                            <WifiIcon onClick={(evt)=>{evt.stopPropagation();setOpenC2Dialog(true);}} style={{color: activeEgress, cursor: "pointer"}}/> : 
                            <InsertLinkTwoToneIcon onClick={(evt)=>{evt.stopPropagation();setOpenC2Dialog(true);}} style={{color: activeEgress, cursor: "pointer"}} />
                        }
                        </TableCell>
                    </TableRow>
                    <TableRow hover>
                        <TableCell>Process Name</TableCell>
                        <TableCell>{props.process_name}</TableCell>
                    </TableRow>
                    <MythicDialog fullWidth={true} maxWidth="lg" open={openC2Dialog}
                        onClose={()=>{setOpenC2Dialog(false);}} 
                        innerDialog={<C2PathDialog onClose={()=>{setOpenC2Dialog(false);}} {...props} callbackgraphedges={activeEgressBool ? callbackgraphedges : callbackgraphedgesAll} />}
                    />
                    <MythicDialog fullWidth={true} open={openEditDescriptionDialog}  onClose={() => {setOpenEditDescriptionDialog(false);}}
                        innerDialog={
                            <MythicModifyStringDialog title={"Edit Callback's Description"} onClose={() => {setOpenEditDescriptionDialog(false);}} value={props.description} onSubmit={editDescriptionSubmit} />
                        }
                        />
                    <TableRow hover>
                        <TableCell>Extra Info</TableCell>
                        <TableCell>{props.extra_info}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
    )
}
