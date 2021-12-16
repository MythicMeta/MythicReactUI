import React from 'react';
import Paper from '@material-ui/core/Paper';
import {useTheme} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import {ReportingTable} from './ReportingTable';


export function Reporting() {
  const theme = useTheme();
  return (
  <div style={{maxHeight: "calc(96vh)", margin:"10px", }}>
    <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
      <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
          Mythic Report Generation
      </Typography>
    </Paper> 
    <ReportingTable />
  </div>
  );
}
