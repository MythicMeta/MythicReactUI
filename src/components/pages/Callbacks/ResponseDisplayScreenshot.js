import React from 'react';
import {Button} from '@material-ui/core';
import {ResponseDisplayScreenshotModal} from './ResponseDisplayScreenshotModal';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';

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

export const ResponseDisplayScreenshot = (props) =>{
  const [openScreenshot, setOpenScreenshot] = React.useState(false);
  const classes = useStyles();
  const now = (new Date()).toUTCString();
  const clickOpenScreenshot = () => {
    setOpenScreenshot(true);
  }

  return (
    <React.Fragment>
      {openScreenshot &&
      <MythicDialog fullWidth={true} maxWidth="xl" open={openScreenshot} 
          onClose={()=>{setOpenScreenshot(false);}} 
          innerDialog={<ResponseDisplayScreenshotModal href={"/api/v1.4/files/screencaptures/" + props.agent_file_id + "?time=" + now} onClose={()=>{setOpenScreenshot(false);}} />}
      />
      }
      <pre style={{display: "inline-block"}}>
        {props?.plaintext || ""}
      </pre>
      <Tooltip title={props?.hoverText || "View Screenshot"}  arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}}>
        <Button color="primary" variant={props.variant ? props.variant : "contained"} onClick={clickOpenScreenshot} style={{marginBottom: "10px"}}>{props.name}</Button>
      </Tooltip>
    </React.Fragment>
  )   
}