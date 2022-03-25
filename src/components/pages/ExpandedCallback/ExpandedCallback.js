import React  from 'react';
import {useSubscription, gql } from '@apollo/client';
import {ExpandedCallbackSideDetails} from './ExpandedCallbackSideDetails';
import  {useParams} from "react-router-dom";
import {CallbacksTabsTaskingPanel} from '../Callbacks/CallbacksTabsTasking';
import { snackActions } from '../../utilities/Snackbar';


const SUB_Callbacks = gql`
subscription CallbacksSubscription ($callback_id: Int!){
  callback_by_pk(id: $callback_id) {
    architecture
    description
    domain
    external_ip
    host
    id
    integrity_level
    ip
    last_checkin
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
    callbacktokens(where: {deleted: {_eq: false}}) {
      token {
        TokenId
        id
        User
        description
      }
      callback {
        id
      }
      id
    }
  }
}
 `;


export function ExpandedCallback(props){
    
    const {callbackId} = useParams();
    const [callback, setCallbacks] = React.useState({"payload": {"payloadtype": {"ptype": ""}}, "callbacktokens": []});
    const [tabInfo, setTabInfo] = React.useState({callbackID: parseInt(callbackId)});
    useSubscription(SUB_Callbacks, {
        variables: {callback_id: callbackId}, fetchPolicy: "network-only",
        shouldResubscribe: true,
        onSubscriptionData: ({subscriptionData}) => {
          if(subscriptionData.data.callback_by_pk === null){
            snackActions.error("Unknown Callback");
            return;
          }
          setCallbacks(subscriptionData.data.callback_by_pk);
          setTabInfo({tabID: "interact", tabType: "interact", callbackID: parseInt(callbackId), 
          payloadtype: subscriptionData.data.callback_by_pk["payload"]["payloadtype"]["ptype"],
          payloadDescription: subscriptionData.data.callback_by_pk["payload"]["tag"],
          callbackDescription: subscriptionData.data.callback_by_pk["description"],
          operation_id: subscriptionData.data.callback_by_pk["operation_id"],
          os: subscriptionData.data.callback_by_pk["payload"]["os"]});
        }
    });

    return (
        <div style={{width: "100%", height: "100%", maxHeight: "100%", display: "flex", flexDirection: "row"}}>
          {tabInfo.payloadtype !== undefined ? (
            <React.Fragment>
              <ExpandedCallbackSideDetails callback={callback} />
              <CallbacksTabsTaskingPanel style={{height:`calc(${96}vh)`, maxHeight:`calc(${96}vh)`, width:"69%", maxWidth: "69%", position: "absolute", overflow: "auto", display: "inline-flex", flexDirection: "column"}} 
                tabInfo={tabInfo} callbacktokens={callback.callbacktokens}/>
            </React.Fragment>
          ) : (
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", left: "50%", top: "50%"}}>Fetching Callback</div>
          )}
            
        </div>
    );
}
