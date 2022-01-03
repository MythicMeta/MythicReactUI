import React from 'react';
import Typography from '@material-ui/core/Typography';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import {useTheme} from '@material-ui/core/styles';
import {MythicStyledTooltip} from '../../MythicComponents/MythicStyledTooltip';
import PermScanWifiIcon from '@material-ui/icons/PermScanWifi';

export function PayloadsTableRowC2Status(props){
    const theme = useTheme();
    return (
        <React.Fragment>
            {
                props.payloadc2profiles.map( (c2) => (
                    <Typography key={c2.c2profile.name + props.uuid} style={{display: "flex"}}> 
                        {c2.c2profile.is_p2p ?
                            ( c2.c2profile.container_running ? 
                                <MythicStyledTooltip title="C2 Container online">
                                    <CheckCircleIcon style={{color: theme.palette.success.main}}/>
                                </MythicStyledTooltip>: 
                                <MythicStyledTooltip title="C2 Container offline">
                                    <CancelIcon style={{color: theme.palette.error.main}}/>
                                </MythicStyledTooltip> )
                            :
                        ( c2.c2profile.running ? 
                            <MythicStyledTooltip title="C2 Internal Server Running">
                                <CheckCircleIcon style={{color: theme.palette.success.main}}/>
                            </MythicStyledTooltip> : 
                            (c2.c2profile.container_running ? (
                                <MythicStyledTooltip title="C2 Internal Server Not Running, but Container Online">
                                    <PermScanWifiIcon style={{color: theme.palette.warning.main}}/> 
                                </MythicStyledTooltip>
                            ) : (
                                <MythicStyledTooltip title="C2 Container offline">
                                    <CancelIcon style={{color: theme.palette.error.main}}/> 
                                </MythicStyledTooltip>
                            ))
                            )
                        } - {c2.c2profile.name}
                    </Typography>
                )) 
            }
                
        </React.Fragment>
        )
}
