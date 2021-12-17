import React from 'react';
import {useSubscription, gql } from '@apollo/client';
import Badge from '@material-ui/core/Badge';
import MailIcon from '@material-ui/icons/Mail';
import { Link } from 'react-router-dom';
import { IconButton, Tooltip } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import ErrorIcon from '@material-ui/icons/Error';
import {snackActions} from './utilities/Snackbar';
import { meState } from '../cache';
import { useReactiveVar } from '@apollo/client';
import { makeStyles } from '@material-ui/core/styles';

const SUB_Event_Logs = gql`
subscription MySubscription($operation_id: Int!) {
  operationeventlog_aggregate(where: {deleted: {_eq: false}, level: {_eq: "warning"}, resolved: {_eq: false}, operation_id: {_eq: $operation_id}}) {
    aggregate{
        count
    }
  }
}
 `;
 
 const useStyles = makeStyles((theme) => ({
    tooltip: {
      backgroundColor: theme.palette.background.contrast,
      color: theme.palette.text.contrast,
      boxShadow: theme.shadows[1],
      fontSize: 13
    },
    arrow: {
      color: theme.palette.background.contrast,
    }
  }));
export function TopAppBarNotifications(props) {
    const me = useReactiveVar(meState);
    const classes = useStyles();
  const { loading, error, data } = useSubscription(SUB_Event_Logs, {
      variables: {operation_id: me?.user?.current_operation_id || 0},
    onError: data => {
        snackActions.error("Mythic encountered an error getting event log messages: " + data.toString());
        console.error(data);
    }
  });

    return (    
        <IconButton color="inherit" component={Link} to='/new/EventFeed' style={{float: "right"}}>
            <Tooltip title="Event Feed" arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}}>
            { 
                loading ? (
                    <Badge color="secondary" badgeContent={0}>
                        <CircularProgress size={20} thickness={4} />
                    </Badge>
                ) : 
                
                (
                    error ? (
                        <Badge color="secondary" badgeContent={0}>
                            <ErrorIcon />
                        </Badge>
                    ) : (
                        <Badge badgeContent={data.operationeventlog_aggregate.aggregate.count} color="error">
                            <MailIcon />
                        </Badge>
                    )
                )
                
            }
            </Tooltip>
        </IconButton>
    );
}

