import React from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';

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

export const ResponseDisplayDownload = (props) =>{
  const classes = useStyles();
  return (
    <React.Fragment>
      <pre style={{display: "inline-block"}}>
        {props.download?.plaintext || ""}
      </pre>
      
      <Tooltip title={props?.dowload?.hoverText || "Download payload"}  arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}}>
        <Button variant={props.download?.variant || "contained"} component="a" target="_blank" color="primary" href={"/api/v1.4/files/download/" + props.download.agent_file_id} download
          startIcon={<GetAppIcon />}>
            {props.download?.name || ""}
        </Button>
      </Tooltip><br/>
    </React.Fragment>
  )   
}