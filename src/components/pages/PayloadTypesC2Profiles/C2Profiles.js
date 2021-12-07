import React  from 'react';
import { C2ProfilesCard } from './C2ProfilesCard';
import {useSubscription, gql } from '@apollo/client';
import LinearProgress from '@material-ui/core/LinearProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {useTheme} from '@material-ui/core/styles';

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
export function C2Profiles(props){
    const theme = useTheme();
    const { loading, error, data } = useSubscription(SUB_C2_Profiles);

    if (loading) {
     return <LinearProgress style={{marginTop: "10px"}}/>;
    }
    if (error) {
     console.error(error);
     return <div>Error!</div>;
    }
    return (
        <div style={{maxHeight: "calc(95vh)", maxWidth: "100%"}}>
          <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
            <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                C2 Profiles
            </Typography>
          </Paper> 
          {
              data.c2profile.map( (pt) => (
                  <C2ProfilesCard key={"c2prof" + pt.id} {...pt} />
              ))
          }
        </div>
    );
}
