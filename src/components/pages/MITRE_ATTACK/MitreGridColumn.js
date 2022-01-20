import React from 'react';
import {MitreGridRow} from './MitreGridRow';
import {useTheme} from '@material-ui/core/styles';
import { Box } from '@material-ui/core';

export function MitreGridColumn({column, showCountGrouping}){
  const theme = useTheme();
  const [rowCounts, setrowCounts] = React.useState(0);
  React.useEffect( () => {
    switch(showCountGrouping){
      case "":
        setrowCounts(column?.rows?.length || 0);
        break;
      case "command": 
        setrowCounts(column.commands);
        break;
      case "task":
        setrowCounts(column.tasks);
        break;
    }
  }, [column.commands, column.rows, column.tasks, showCountGrouping])
  return (
    <div style={{display: "flex", flexDirection: "column", paddingRight: "15px",}}>
      <Box height={"80px"} width={"100%"} style={{backgroundColor: theme.tableHover}}>
        <h2 style={{margin: 0, textAlign: "center"}}><b>{column.tactic}</b></h2>
        <p style={{textAlign: "center", margin: 0}}>{rowCounts} techniques</p>
      </Box>
      
      <div style={{display: "flex", flexDirection: "column"}}>
        {column.rows.map( (r, index) => (
          <MitreGridRow row={r} key={"row"+ index} showCountGrouping={showCountGrouping}/>
        ))}
      </div>
      
    </div>
  )
}

