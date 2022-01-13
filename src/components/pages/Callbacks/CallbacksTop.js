import React from 'react';
import {useSubscription, gql } from '@apollo/client';
import {CallbacksTable} from './CallbacksTable';
import {CallbacksGraph} from './CallbacksGraph';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {useTheme} from '@material-ui/core/styles';

const SUB_Callbacks = gql`
subscription CallbacksSubscription ($operation_id: Int!){
  callback(where: {active: {_eq: true}, operation_id: {_eq: $operation_id}}, order_by: {id: desc}) {
    architecture
    description
    domain
    external_ip
    host
    id
    integrity_level
    ip
    locked
    locked_operator {
      username
    }
    extra_info
    sleep_info
    pid
    os
    user
    agent_callback_id
    operation_id
    process_name
    payload {
      os
      payloadtype {
        ptype
        id
      }
      tag
      id
    }
  }
}
 `;
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
export function CallbacksTop({onOpenTab, topDisplay, heights}){
    const me = useReactiveVar(meState);
    const theme = useTheme();
    const [callbacks, setCallbacks] = React.useState([]);
    const [callbackEdges, setCallbackEdges] = React.useState([]);
    useSubscription(SUB_Callbacks, {
        variables: {operation_id: me?.user?.current_operation_id || 0}, fetchPolicy: "network-only",
        shouldResubscribe: true,
        onSubscriptionData: ({subscriptionData}) => {
          setCallbacks(subscriptionData.data.callback);
        }
    });
    useSubscription(SUB_Edges, {
        variables: {operation_id: me?.user?.current_operation_id || 0}, fetchPolicy: "network-only",
        shouldResubscribe: true,
        onSubscriptionData: ({subscriptionData}) => {
          setCallbackEdges(subscriptionData.data.callbackgraphedge)
        }
    });
    const onOpenTabLocal = ({tabType, tabID, callbackID}) => {
      for(let i = 0; i < callbacks.length; i++){
        if(callbacks[i]["id"] === callbackID){
          const tabData = {tabID, tabType, callbackID, 
              payloadtype: callbacks[i]["payload"]["payloadtype"]["ptype"],
              payloadtype_id: callbacks[i]["payload"]["payloadtype"]["id"],
              operation_id: callbacks[i]["operation_id"],
              payloadDescription: callbacks[i]["payload"]["tag"],
              callbackDescription: callbacks[i]["description"],
              host: callbacks[i]["host"],
              os: callbacks[i]["payload"]["os"]};
          onOpenTab(tabData);
        }
      }
    }
    return (
      <div style={{height: "100%", width: "100%"}}>
        {topDisplay === "graph" ? (
          <CallbacksGraph maxHeight={"100%"} topHeight={heights.top} key={"callbacksgraph"} onOpenTab={onOpenTabLocal} callbacks={callbacks} callbackgraphedges={callbackEdges} />
        ) : (
          <div style={{height: "100%", width: "100%", display: "flex", flexDirection: "column"}}>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px", width: "100%"}} variant={"elevation"}>
              <Typography variant="h4" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                  Active Callbacks
              </Typography>
            </Paper>
            <CallbacksTable key={"callbackstable"} onOpenTab={onOpenTabLocal} callbacks={callbacks} callbackgraphedges={callbackEdges} />
          </div>
          )}
        </div>
    );
}