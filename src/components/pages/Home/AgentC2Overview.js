import React from 'react';
import { useQuery, gql} from '@apollo/client';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {useTheme} from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Tooltip from '@mui/material/Tooltip';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';

const GetC2ProfilesAndPayloadTypes = gql`
query GetC2AndPayloadType {
  c2profile(where: {deleted: {_eq: false}}) {
    name
    id
  }
  payloadtype(where: {deleted: {_eq: false}}) {
    ptype
    wrapper
    id
    payloadtypec2profiles {
      c2profile {
        name
        id
      }
    }
  }
  wrappers: payloadtype(where: {deleted: {_eq: false}, wrapper: {_eq: true}}) {
    ptype
    wrapper
    id
    wrap_these_payload_types {
      wrapped {
        wrapper
        id
        ptype
      }
    }
  }
}
`;

export function AgentC2Overview(props){
    const theme = useTheme();
    const [c2Profiles, setC2Profiles] = React.useState([]);
    const [payloadTypeRows, setPayloadTypeRows] = React.useState([]);
    const [payloadTypeRowsNoWrappers, setPayloadTypeRowsNoWrappers] = React.useState([]);
    const [wrappers, setWrappers] = React.useState([]);
    const { loading } = useQuery(GetC2ProfilesAndPayloadTypes, {fetchPolicy: "network-only",
      onCompleted: (data) => {
        const c2Headers = data.c2profile.map( (c2) => c2.name);
        const payloadRows = data.payloadtype.map( (payload) => {
          const payloadc2 = payload.payloadtypec2profiles.map( (c2) => {
            return c2.c2profile.name;
          })
          return {ptype: payload.ptype, payloadtypec2profiles: payloadc2, wrapper: payload.wrapper };
        });
        
        c2Headers.sort();
        payloadRows.sort( (a,b) => a.ptype < b.ptype ? -1 : 1);
        const payloadTypeNoWrappers = payloadRows.filter( p => !p.wrapper);
        const wrapperRows = data.wrappers.map( (payload) => {
          const wrapped = payload.wrap_these_payload_types.map( (w) => {
            return w.wrapped.ptype;
          });
          return {ptype: payload.ptype, wrapped}
        });
        wrapperRows.sort( (a,b) => a.ptype < b.ptype ? -1 : 1);
        setWrappers(wrapperRows);
        setC2Profiles(c2Headers);
        setPayloadTypeRows(payloadRows);
        setPayloadTypeRowsNoWrappers(payloadTypeNoWrappers);
      },
      onError: (data) => {

      }
    });
    if (loading) {
     return <LinearProgress />;;
    }
    return (
    <div style={{ marginTop: "10px", marginRight: "5px"}}>
        <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main, marginBottom: "5px", marginTop: "10px", marginRight: "5px"}} variant={"elevation"}>
            <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                Agent / C2 Overview
            </Typography>
        </Paper>
        <TableContainer component={Paper} className="mythicElement">   
        <Table  size="small">
            <TableHead>
                <TableRow hover>
                    <TableCell></TableCell>
                    {c2Profiles.map( (c2) => (
                      <TableCell key={c2}>{c2}</TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {payloadTypeRowsNoWrappers.map( (payload) => (
                  <TableRow key={payload.ptype} hover>
                    <TableCell>{payload.ptype}</TableCell>
                    {c2Profiles.map( (c2) => (
                      <TableCell key={'payload' + c2}>
                        {payload.payloadtypec2profiles.includes(c2) ? 
                        <MythicStyledTooltip title={payload.ptype + " supports " + c2}>
                            <CheckCircleIcon color="success"/>
                        </MythicStyledTooltip>
                     : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
        {wrappers.length > 0 && 
          <TableContainer component={Paper} className="mythicElement" style={{marginTop: "10px"}}>   
              <Table  size="small">
                  <TableHead>
                      <TableRow hover>
                          <TableCell></TableCell>
                          {payloadTypeRows.map( (pt) => (
                            <TableCell key={'wrapped' + pt.ptype}>{pt.ptype}</TableCell>
                          ))}
                      </TableRow>
                  </TableHead>
                  <TableBody>
                      {wrappers.map( (payload) => (
                        <TableRow key={'wrapper' + payload.ptype} hover>
                          <TableCell>{payload.ptype}</TableCell>
                          {payloadTypeRows.map( (wr) => (
                            <TableCell key={'payload' + wr.ptype}>
                              {payload.wrapped.includes(wr.ptype) ? 
                              <MythicStyledTooltip title={payload.ptype + " wraps " + wr.ptype}>
                                  <CheckCircleIcon color="success"/>
                              </MythicStyledTooltip>
                          : ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </TableContainer>
        }
      </div>
    );
} 
