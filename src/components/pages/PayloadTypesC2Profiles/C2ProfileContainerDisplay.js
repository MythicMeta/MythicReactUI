import React, {useEffect} from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {useTheme} from '@material-ui/core/styles';
import {C2ProfilesCard} from './C2ProfilesCard';
import {useSubscription, gql } from '@apollo/client';

const SUB_C2_Profiles = gql`
subscription getPayloadTypesSubscription {
   c2profile(where: {deleted: {_eq: false}}, order_by: {name: asc}) {
   author
   id
   container_running
   description
   is_p2p
   last_heartbeat
   name
   running
   payloadtypec2profiles(order_by: {payloadtype: {ptype: asc}}) {
     payloadtype {
       ptype
     }
   }
 }
}
`;

export function C2ProfileContainerDisplay(props) {
  const { data } = useSubscription(SUB_C2_Profiles, {fetchPolicy: "network-only"});
  const [c2profile, setC2profile] = React.useState([]);
  const theme = useTheme();
  useEffect( () => {
    if(data === undefined){
      setC2profile([]);
      return;
    }
    setC2profile(data.c2profile);
  }, [data])
  return (
        <div style={{ flexDirection: "column", alignItems: "stretch", paddingLeft: "10px"}}>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                  C2 Profiles
              </Typography>
            </Paper> 
            {
                c2profile.map( (pt) => (
                    <C2ProfilesCard key={"c2prof" + pt.id} {...pt} />
                ))
            }
        </div>
    
    
  );
}
