import React from 'react';
import { PayloadsTable } from './PayloadsTable';
import {useMutation, useQuery, gql, useSubscription} from '@apollo/client';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
const payloadFragment = gql`
fragment payloadData on payload {
  build_message
  build_phase
  build_stderr
  callback_alert
  creation_time
  id
  operator {
    id
    username
  }
  uuid
  tag
  deleted
  auto_generated
  payloadtype {
    id
    ptype
  }
  filemetum {
    agent_file_id
    filename_text
    id
  }
  payloadc2profiles {
    c2profile {
      running
      name
      is_p2p
      container_running
    }
  }
}
`;
const SUB_Payloads = gql`
${payloadFragment}
subscription SubPayloadsQuery($operation_id: Int!) {
  payload(where: { operation_id: {_eq: $operation_id}}, order_by: {id: desc}) {
    ...payloadData
  }
}
`;
const Get_Payloads = gql`
${payloadFragment}
query GetPayloadsQuery($operation_id: Int!) {
  payload(where: { operation_id: {_eq: $operation_id}}, order_by: {id: desc}, limit: 20) {
    ...payloadData
  }
}
`;
const payloadsDelete = gql`
mutation PayloadsDeletePayloadMutation($id: Int!) {
  deleteFile(file_id: $id) {
      file_ids
      status
      error
      payload_ids
  }
}
`;
const payloadsCallbackAlert = gql`
mutation PayloadsCallbackAlertMutation($id: Int!, $callback_alert: Boolean!) {
  update_payload_by_pk(pk_columns: {id: $id}, _set: {callback_alert: $callback_alert}) {
    id
    callback_alert
  }
}
`;
const restorePayloadMutation = gql`
mutation RestorePayloadToUndeleted($id: Int!){
  update_payload_by_pk(pk_columns: {id: $id}, _set: {deleted: false}){
    id
    deleted
  }
}
`;

export function Payloads(props){
    const me = useReactiveVar(meState);
    const [payloads, setPayloads] = React.useState([]);
    const mountedRef = React.useRef(true);
    useQuery(Get_Payloads, {
      variables: {operation_id: me?.user?.current_operation_id || 0},
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
        if(!mountedRef.current){
          return null;
        }
        const updated = data.payload.reduce( (prev, cur) => {
          const index = prev.findIndex( (p) => p.id === cur.id );
          if(index > -1){
            prev[index] = {...cur};
            return [...prev];
          }else{
            return [cur, ...prev];
          }
        }, [...payloads])
        updated.sort( (a,b) => a.id > b.id ? -1 : 1);
        setPayloads(updated);
      },
    })
    useSubscription(SUB_Payloads, {
      variables: {operation_id: me?.user?.current_operation_id || 0},
      fetchPolicy: "no-cache",
      onSubscriptionData: ({subscriptionData}) => {
        if(!mountedRef.current){
          return  null;
        }
        const updated = subscriptionData.data.payload.reduce( (prev, cur) => {
          const index = prev.findIndex( (p) => p.id === cur.id );
          if(index > -1){
            prev[index] = {...cur};
            return [...prev];
          }else{
            return [cur, ...prev];
          }
        }, [...payloads])
        updated.sort( (a,b) => a.id > b.id ? -1 : 1);
        setPayloads(updated);
      },
      onError: (data) => {
        snackActions.warning("Failed to get payloads");
        console.log(data);
      }
      });
    const [deletePayload] = useMutation(payloadsDelete, {
        onCompleted: (data) => {
          if(data.deleteFile.status === "success"){
            const updated = payloads.map( (p) => {
              if(data.deleteFile.payload_ids.includes(p.id)){
                return {...p, deleted: true};
              }else{
                return {...p}
              }
            });
            setPayloads(updated);
            snackActions.success("Successfully deleted");
          }else{
            snackActions.error(data.deleteFile.error);
          }
          
        },
        onError: (data) => {
          snackActions.warning("Failed to delete payload");
          console.log(data);
        }
    });
    const [restorePayload] = useMutation(restorePayloadMutation, {
      onCompleted: (data) => {
        const updated = payloads.map( (payload) => {
          if(payload.id === data.update_payload_by_pk.id){
            return {...payload, ...data.update_payload_by_pk};
          }else{
            return {...payload};
          }
        });
        setPayloads(updated);
        if(data.update_payload_by_pk.deleted === false){
          snackActions.success("Successfully marked payload as not deleted");
        }
      },
      onError: (data) => {
        snackActions.warning("Failed to mark as not deleted");
        console.log(data);
      }
  });
    const [callbackAlert] = useMutation(payloadsCallbackAlert, {
      onCompleted: (data) => {
        const updated = payloads.map( (payload) => {
          if(payload.id === data.update_payload_by_pk.id){
            return {...payload, ...data.update_payload_by_pk};
          }else{
            return {...payload};
          }
        });
        if(data.update_payload_by_pk.callback_alert){
          snackActions.success("Now Alerting on New Callbacks");
        }else{
          snackActions.success("No Longer Alerting on New Callbacks");
        }
        
        setPayloads(updated);
      },
      onError: (data) => {
        snackActions.warning("Failed to update callback alerting status");
        console.log(data);
      }
    });
    const onDeletePayload = (id) => {
        deletePayload({variables: {id}});
    }
    const onUpdateCallbackAlert = (id, callback_alert) => {
        callbackAlert({
            variables: {id, callback_alert}
        
        });
    }
    const onRestorePayload = (id) => {
      restorePayload({
        variables: {id}
      })
    }
    React.useEffect( () => {
      return() => {
        mountedRef.current = false;
      }
       // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
      <div style={{display: "flex", flexGrow: 1, flexDirection: "column", marginTop:"10px"}}>
        <PayloadsTable onDeletePayload={onDeletePayload} onUpdateCallbackAlert={onUpdateCallbackAlert} payload={payloads} onRestorePayload={onRestorePayload}/>
      </div>
    );
} 
