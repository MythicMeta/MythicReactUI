import React from 'react';
import { QuickStartCard } from './QuickStartCard';
import Paper from '@material-ui/core/Paper';
import {useTheme} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import {AgentC2Overview} from './AgentC2Overview';


export function Home() {
  const theme = useTheme();
  return (
  <div style={{maxHeight: "calc(96vh)", margin:"10px", }}>
    <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
      <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
          Welcome To Mythic
      </Typography>
    </Paper> 
    <QuickStartCard />
    <AgentC2Overview />
  </div>
  );
}
