import React from 'react';
import {Button} from '@material-ui/core';
import {ResponseDisplayScreenshotModal} from './ResponseDisplayScreenshotModal';
import { MythicDialog } from '../../MythicComponents/MythicDialog';

export const ResponseDisplayScreenshot = (props) =>{
  const [openScreenshot, setOpenScreenshot] = React.useState(false);
  const now = (new Date()).toUTCString();
  const clickOpenScreenshot = () => {
    setOpenScreenshot(true);
  }

  return (
    <React.Fragment>
      <MythicDialog fullWidth={true} maxWidth="xl" open={openScreenshot} 
                        onClose={()=>{setOpenScreenshot(false);}} 
                        innerDialog={<ResponseDisplayScreenshotModal href={"/api/v1.4/files/screencaptures/" + props.agent_file_id + "?time=" + now} onClose={()=>{setOpenScreenshot(false);}} />}
                    />
      <Button color="primary" variant={props.variant ? props.variant : "contained"} onClick={clickOpenScreenshot} style={{marginBottom: "10px"}}>{props.name}</Button>
    </React.Fragment>
  )   
}