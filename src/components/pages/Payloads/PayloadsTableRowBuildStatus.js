import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import {useTheme} from '@material-ui/core/styles';
import React from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';
import { snackActions } from '../../utilities/Snackbar';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import {MythicStyledTooltip} from '../../MythicComponents/MythicStyledTooltip';

export function PayloadsTableRowBuildStatus(props){
    const theme = useTheme();
    return (
        <React.Fragment>
            {props.build_phase === "success" ?
                ( <MythicStyledTooltip title="Download payload">
                    <IconButton variant="contained" target="_blank" color="primary" href={window.location.origin + "/direct/download/" + props.filemetum.agent_file_id} download>
                        <GetAppIcon style={{color: theme.palette.success.main}} />
                    </IconButton>
                  </MythicStyledTooltip>
                    
                )
                : 
                (props.build_phase === "building" ? 
                (<MythicStyledTooltip title="Payload still building">
                    <IconButton variant="contained"><CircularProgress size={20} thickness={4} style={{color: theme.palette.info.main}}/></IconButton>
                </MythicStyledTooltip>) : 
                (<MythicStyledTooltip title="Failed to build payload">
                    <IconButton variant="contained" onClick={() => snackActions.warning("Payload failed to build, cannot download")}>
                        <ReportProblemIcon style={{color: theme.palette.error.main}} />
                    </IconButton>
                </MythicStyledTooltip>
                ) 
                )
            }
        </React.Fragment>

        )
}

