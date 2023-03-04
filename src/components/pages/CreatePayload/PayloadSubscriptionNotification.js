import React from 'react';
import {gql, useSubscription} from '@apollo/client';
import Button from '@mui/material/Button';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import {useTheme} from '@mui/material/styles';
import {snackActions} from '../../utilities/Snackbar';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-xcode';
import {PayloadsTableRowBuildProgress} from '../Payloads/PayloadsTableRowBuildProgress';
import { toast } from 'react-toastify';
import { Link } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import { MythicDialog } from '../../MythicComponents/MythicDialog';

//fromNow must be in ISO format for hasura/postgres stuff
//new Date().toISOString() will do it
const subscribe_payloads = gql`
subscription NewPayloadsSubscription($fromNow: timestamp!, $operation_id: Int!) {
  payload_stream(batch_size: 1, cursor: {initial_value: {timestamp: $fromNow}, ordering: ASC}, where: { operation_id: {_eq: $operation_id}, deleted: {_eq: false}}) {
    build_message
    build_phase
    build_stderr
    build_stdout
    uuid
    description
    id
    filemetum{
        agent_file_id
    }
    payload_build_steps(order_by: {step_number: asc}) {
        step_name
        step_number
        step_success
        start_time
        end_time
        step_stdout
        step_stderr
        id
      }
  }
}
 `;
const useStyles =  makeStyles(theme => ({
    root: {
        [theme.breakpoints.up('sm')]: {
            minWidth: '344px !important',
        },
    },
    typography: {
        fontWeight: 'bold',
    },
    actionRoot: {
        padding: '0px 8px 0px 16px',
    },
    icons: {
        marginLeft: 'auto',
        float: "right"
    },
    expand: {
        padding: '8px 8px',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        }),
    },
    collapse: {
        padding: 16,
    },
    checkIcon: {
        fontSize: 20,
        color: '#b3b3b3',
        paddingRight: 4,
    },
    button: {
        padding: 0,
        textTransform: 'none',
    },
}));

const SnackMessage = (props) => {
    
    const theme = useTheme();
    const classes = useStyles(theme);
    return (
        <React.Fragment>                    
            <Typography variant="subtitle2" className={classes.typography}>
                    {props.payloadData.build_phase === "success" ? (
                        "Payload successfuly built!"
                    ) : (
                        "Payload Building..."
                    )}
                    
                </Typography>
                    <PayloadsTableRowBuildProgress {...props.payloadData} />
                    {props.payloadData.build_phase === "success" && 
                        <React.Fragment>
                            <Typography gutterBottom>Agent ready for download</Typography>
                            
                            <Link download={true} href={"/direct/download/" + props.file_id} target="_blank">
                                Download here
                            </Link>
                        </React.Fragment>
                    }
        </React.Fragment>

    );
};
const SnackMessageError = (props) => {
    
    const theme = useTheme();
    return (
        <React.Fragment>
            <DialogTitle id="form-dialog-title">Payload Failed to Build!!</DialogTitle>
            <AceEditor 
                mode="json"
                theme={theme.palette.mode === "dark" ? "monokai" : "xcode"}
                fontSize={14}
                showGutter={true}
                highlightActiveLine={true}
                value={"Build Message:\n" + props.payloadData.build_message + "\nStdErr: \n" + props.payloadData.build_stderr + "\nStdOut: \n" + props.payloadData.build_stdout}
                focus={true}
                width={"100%"}
                setOptions={{
                    showLineNumbers: true,
                    tabSize: 4
                }}/>
        <DialogActions>
          <Button variant="contained" onClick={props.onClose} color="primary">
            Close
          </Button>
        </DialogActions>
        </React.Fragment>
    );
};

export function PayloadSubscriptionNotification(props) {
    const [payloadData, setPayloadData] = React.useState({});
    const displayingToast = React.useRef(false);
    const [displayErrorDialog, setDisplayErrorDialog] = React.useState(false);
    const dismissedUUIDs = React.useRef([]);
    const getSnackMessage = () => {
        return <SnackMessage
            file_id={payloadData.filemetum.agent_file_id} 
            payloadData={payloadData}
            handleDismiss={handleDismiss}
            />
    };
    const handleDismiss = () => {
        displayingToast.current = false;
        dismissedUUIDs.current.push(payloadData.uuid);
    }
    const handleErrorClose = () => {
        dismissedUUIDs.current.push(payloadData.uuid);
        setDisplayErrorDialog(false);
    }
    
    React.useEffect( () => {
        if(payloadData.uuid === undefined){
            return;
        }
        if(dismissedUUIDs.current.includes(payloadData.uuid)){
            return
        }
        if(!displayingToast.current){
            if(payloadData.build_phase === "success" || payloadData.build_phase === "building"){
                snackActions.info(getSnackMessage(), {toastId: payloadData.uuid, autoClose: false, onClose: handleDismiss, closeOnClick: false});
            }
            displayingToast.current = true;
            return;
        }
        if(payloadData.build_phase === "error"){
            snackActions.dismiss();
            setDisplayErrorDialog(true);
        } else {
            snackActions.update(getSnackMessage(), payloadData.uuid, {
                type: payloadData.build_phase === "success" ? toast.TYPE.SUCCESS : toast.TYPE.INFO,
            });
        }
        
    }, [payloadData, getSnackMessage]);
    const {  } = useSubscription(subscribe_payloads, {variables: {fromNow: props.fromNow, operation_id: props.me?.user?.current_operation_id || 0},
    onSubscriptionData: ({subscriptionData}) => {
        if(subscriptionData.data.payload_stream[0].uuid === props.subscriptionID){
            setPayloadData({...subscriptionData.data.payload_stream[0]});
        }
    }
    });
    return (    
        displayErrorDialog &&
        <MythicDialog fullWidth={true} maxWidth="xl" open={displayErrorDialog} 
                        onClose={handleErrorClose} 
                        innerDialog={<SnackMessageError payloadData={payloadData} onClose={handleErrorClose} />}
                    />
    );
}

