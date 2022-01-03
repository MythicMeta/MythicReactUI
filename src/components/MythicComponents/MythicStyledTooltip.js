import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Tooltip } from '@material-ui/core';

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

export function MythicStyledTooltip(props){
    const { children, title, ...other} = props;
    const classes = useStyles();
    return (
        <Tooltip title={title} arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}} {...other}>
            {<span style={{display: "inline-block"}}>{children}</span>}
        </Tooltip>
    );
}
