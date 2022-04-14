import {MythicTabPanel, MythicSearchTabLabel} from '../../../components/MythicComponents/MythicTabPanel';
import React, { useEffect } from 'react';
import { gql, useLazyQuery} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import Pagination from '@mui/material/Pagination';
import { Typography } from '@mui/material';
import {SocksSearchTable} from './SocksSearchTable';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSocks} from '@fortawesome/free-solid-svg-icons';
import IconButton from '@mui/material/IconButton';

const callbackFragment = gql`
fragment callbackData on callback{
    user
    host
    description
    domain
    id
    integrity_level
    ip
    process_name
    active
    init_callback
    last_checkin
    port
}
`;
const fetchLimit = 20;
const userSearch = gql`
${callbackFragment}
query userQuery($operation_id: Int!, $offset: Int!, $fetchLimit: Int!) {
    callback_aggregate(distinct_on: id, where: {operation_id: {_eq: $operation_id}, port: {_is_null: false}}) {
      aggregate {
        count
      }
    }
    callback(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {operation_id: {_eq: $operation_id}, port: {_is_null: false}}) {
      ...callbackData
    }
}
`;

export function SearchTabSocksLabel(props){
    return (
        <MythicSearchTabLabel label={"SOCKS"} iconComponent={
            <FontAwesomeIcon icon={faSocks} size="lg" style={{marginTop: "5px"}}/>} {...props}/>
    )
}

export const SearchTabSocksPanel = (props) =>{
    const [callbackData, setCallbackData] = React.useState([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const me = useReactiveVar(meState);
    const [onSocksSearch] = useLazyQuery(userSearch, {
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            snackActions.dismiss();
            if(data.callback_aggregate.aggregate.count === 0){
                snackActions.info("No Socks Running");
            }
            setTotalCount(data.callback_aggregate.aggregate.count);
            setCallbackData(data.callback);
        },
        onError: (data) => {
            snackActions.error("Failed to fetch data for socks");
            console.log(data);
        }
    });
    useEffect(() => {
        if(props.value === props.index){
            onSocksSearch({variables: {offset: 0, operation_id: me?.user?.current_operation_id || 0, fetchLimit}});
        }
    }, [props.value, props.index])
    const onChangePage = (event, value) => {
        if(value === 1){
            onSocksSearch({variables: { offset: 0, operation_id: me?.user?.current_operation_id || 0, fetchLimit}});
        }else{
            onSocksSearch({variables: { offset: (value - 1) * fetchLimit, operation_id: me?.user?.current_operation_id || 0, fetchLimit}});        
        }
    }
    return (
        <MythicTabPanel {...props} >
            <div style={{overflowY: "auto", flexGrow: 1}}>
                {callbackData.length > 0 ? (
                    <SocksSearchTable callbacks={callbackData} />) : (
                    <div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", left: "50%", top: "50%"}}>No Search Results</div>
                )}
            </div>
            <div style={{background: "transparent", display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Pagination count={Math.ceil(totalCount / fetchLimit)} variant="outlined" color="primary" boundaryCount={1}
                    siblingCount={1} onChange={onChangePage} showFirstButton={true} showLastButton={true} style={{padding: "20px"}}/>
                <Typography style={{paddingLeft: "10px"}}>Total Results: {totalCount}</Typography>
            </div>
        </MythicTabPanel>
    )
}