import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import GetAppIcon from '@material-ui/icons/GetApp';
import Tooltip from '@material-ui/core/Tooltip';
import { Button } from '@material-ui/core';

export const ResponseDisplayDownload = (props) =>{
  return (
    <React.Fragment>
      <Tooltip title="Download payload">
        <IconButton variant="contained" component="a" target="_blank" color="primary" href={"/api/v1.4/files/download/" + props.download.agent_file_id} download>
            <GetAppIcon  />
        </IconButton>
      </Tooltip>
    </React.Fragment>
  )   
}