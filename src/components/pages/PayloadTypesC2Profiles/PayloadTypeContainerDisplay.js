import React, { useEffect }  from 'react';
import { PayloadTypeCard } from './PayloadTypeCard';
import {useSubscription, gql } from '@apollo/client';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {useTheme} from '@mui/material/styles';

 const SUB_Payload_Types = gql`
 subscription getPayloadTypesSubscription {
  payloadtype(where: {deleted: {_eq: false}}, order_by: {ptype: asc}) {
    author
    container_running
    id
    last_heartbeat
    note
    ptype
    supported_os
    wrapper
    translationcontainer {
        id
        name
        last_heartbeat
        container_running
    }
    wrap_these_payload_types {
        id
        wrapped {
          ptype
        }
    }
  }
}
 `;


export function PayloadTypeContainerDisplay(props){
    const theme = useTheme();
    const {  data } = useSubscription(SUB_Payload_Types);
    const [payloadTypes, setPayloadTypes] = React.useState([]);
    useEffect( () => {
      if(data === undefined){
        setPayloadTypes([]);
        return;
      }
      setPayloadTypes(data.payloadtype);
    }, [data])
    return (
          <div style={{flexDirection: "column", alignItems: "stretch"}}>
              <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                  <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                      Payload Types
                  </Typography>
                </Paper> 
              {
                  payloadTypes.map( (pt) => (
                      <PayloadTypeCard key={"payloadtype" + pt.id} {...pt} />
                  ))
              }
              
          </div>
    );
}