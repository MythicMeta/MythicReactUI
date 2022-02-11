import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import React from 'react';
import GetAppIcon from '@mui/icons-material/GetApp';
import { snackActions } from '../../utilities/Snackbar';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import {MythicStyledTooltip} from '../../MythicComponents/MythicStyledTooltip';

export function PayloadsTableRowBuildStatus(props){
    return (
        <React.Fragment>
            {props.build_phase === "success" ?
                ( <MythicStyledTooltip title="Download payload">
                    <IconButton
                        variant="contained"
                        target="_blank"
                        color="primary"
                        href={window.location.origin + "/direct/download/" + props.filemetum.agent_file_id}
                        download
                        size="large">
                        <GetAppIcon color="success" />
                    </IconButton>
                  </MythicStyledTooltip>
                    
                )
                : 
                (props.build_phase === "building" ? 
                (<MythicStyledTooltip title="Payload still building">
                    <IconButton variant="contained" size="large"><CircularProgress size={20} thickness={4} color="info"/></IconButton>
                </MythicStyledTooltip>) : 
                (<MythicStyledTooltip title="Failed to build payload">
                    <IconButton
                        variant="contained"
                        onClick={() => snackActions.warning("Payload failed to build, cannot download")}
                        size="large">
                        <ReportProblemIcon color="error" />
                    </IconButton>
                </MythicStyledTooltip>
                ) 
                )
            }
        </React.Fragment>
    );
}

