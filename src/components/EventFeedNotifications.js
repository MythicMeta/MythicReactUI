import React, {useEffect} from 'react';
import {gql, useSubscription} from '@apollo/client';
import { meState } from '../cache';
import { useReactiveVar } from '@apollo/client';
import {snackActions} from './utilities/Snackbar';

//fromNow must be in ISO format for hasura/postgres stuff
//new Date().toISOString() will do it
const subscribe_payloads = gql`
subscription EventFeedNotificationSubscription($fromNow: timestamp!, $operation_id: Int!) {
  operationeventlog(limit: 1, where: {deleted: {_eq: false}, timestamp: {_gte: $fromNow}, operation_id: {_eq: $operation_id}}, order_by: {id: desc}) {
    operator {
        username
    }
    id
    message
    level
    resolved
    source
  }
}
 `;

export function EventFeedNotifications(props) {
    const me = useReactiveVar(meState);
    let seenIds = React.useRef([]);
    const fromNow = React.useRef( (new Date()).toISOString() );
    const { loading, error, data } = useSubscription(subscribe_payloads, {
        variables: {fromNow: fromNow.current, operation_id: me?.user?.current_operation_id || 0}, 
        fetchPolicy: "no-cache",
        shouldResubscribe: true,
        onError: (errorData) => {
            snackActions.warning("Failed to get event notifications");
        }
    });

    useEffect( () => {
        //console.log(data, loading, error, fromNow.current);
        if(!loading && !error && data && data.operationeventlog.length > 0){
            if(data.operationeventlog[0].source === "debug"){
                return;
            }
            if(data.operationeventlog[0].resolved){
                return;
            }
            if(data.operationeventlog[0].operator && !seenIds.current.includes(data.operationeventlog[0].id)){
                const message = data.operationeventlog[0].operator.username + ":" + data.operationeventlog[0].message;
                snackActions.toast(message, data.operationeventlog[0].level, { autoHideDuration: 2000});
                seenIds.current.push(data.operationeventlog[0].id);
            }else if(!data.operationeventlog[0].operator && !seenIds.current.includes(data.operationeventlog[0].id)){
                snackActions.toast(data.operationeventlog[0].message, data.operationeventlog[0].level, {autoHideDuration: 3000});
                seenIds.current.push(data.operationeventlog[0].id);
            }
        }else if(error){
            console.error(error);
            snackActions.warning("Mythic encountered an error getting operational event stream", {autoHideDuration: 2000});
        }
    }, [loading, data, error, me.user]);
    return (    
       null
    );
}

