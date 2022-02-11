import React, { useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {useTheme} from '@mui/material/styles';
import {TranslationContainerCard} from './TranslationContainerCard';
import {useSubscription, gql } from '@apollo/client';
const SUB_Translation_Containers = gql`
subscription getTranslationContainersSubscription {
 translationcontainer(where: {deleted: {_eq: false}}, order_by: {name: asc}) {
   name
   id
   container_running
   last_heartbeat
   payloadtypes(order_by: {ptype: asc}) {
       ptype
       id
   }
 }
}
`;
export function TranslationContainerDisplay(props) {
  const [translationContainers, setTranslationContainers] = React.useState([]);
  const [translationContainersWithPayloads, setTranslationContainersWithPayloads] = React.useState([]);
  const {  data } = useSubscription(SUB_Translation_Containers);
  const theme = useTheme();
  useEffect( () => {
    if(data === undefined){
      setTranslationContainers([]);
      return;
    }
    const unassigned = data.translationcontainer.filter( (tr) => tr.payloadtypes.length === 0);
    const assigned = data.translationcontainer.filter( (tr) => tr.payloadtypes.length > 0);
    setTranslationContainers(unassigned);
    setTranslationContainersWithPayloads(assigned); 
  }, [data]);
  return (
    <div style={{width: "100%", display: "inline-flex", flexDirection: "column", alignItems: "stretch", }}>
      {
        translationContainers.length > 0 ? (
          <React.Fragment>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h4" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                  Translation Containers Not Assigned to Payload Types
              </Typography>
            </Paper> 
            {translationContainers.map( (tr) => (
              <TranslationContainerCard key={"translation_container" + tr.id} {...tr} />
            ))}
          </React.Fragment>
        ) : (null)
      }
      {
        translationContainersWithPayloads.length > 0 ? (
          <React.Fragment>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h4" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                  Translation Containers
              </Typography>
            </Paper> 
            {translationContainersWithPayloads.map( (tr) => (
              <TranslationContainerCard key={"translation_container" + tr.id} {...tr} />
            ))}
          </React.Fragment>
        ) : (null)
      }
    </div>
    
    
  );
}
