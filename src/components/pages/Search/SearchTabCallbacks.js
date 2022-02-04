import {MythicTabPanel, MythicSearchTabLabel} from '../../../components/MythicComponents/MythicTabPanel';
import React from 'react';
import MythicTextField from '../../MythicComponents/MythicTextField';
import PhoneCallbackIcon from '@material-ui/icons/PhoneCallback';
import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
import SearchIcon from '@material-ui/icons/Search';
import Tooltip from '@material-ui/core/Tooltip';
import {useTheme} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import { gql, useLazyQuery} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import Pagination from '@material-ui/lab/Pagination';
import { Typography } from '@material-ui/core';
import {CallbackSearchTable} from './CallbackSearchTable';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

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
}
`;
const fetchLimit = 50;
const userSearch = gql`
${callbackFragment}
query userQuery($operation_id: Int!, $user: String!, $offset: Int!, $fetchLimit: Int!) {
    callback_aggregate(distinct_on: id, where: {operation_id: {_eq: $operation_id}, user: {_ilike: $user}}) {
      aggregate {
        count
      }
    }
    callback(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {operation_id: {_eq: $operation_id}, user: {_ilike: $user}}) {
      ...callbackData
    }
}
`;
const hostSearch = gql`
${callbackFragment}
query hostQuery($operation_id: Int!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    callback_aggregate(distinct_on: id, where: {host: {_ilike: $host}, operation_id: {_eq: $operation_id}}) {
      aggregate {
        count
      }
    }
    callback(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, operation_id: {_eq: $operation_id}}) {
      ...callbackData
    }
}
`;
const domainSearch = gql`
${callbackFragment}
query domainQuery($operation_id: Int!, $domain: String!, $offset: Int!, $fetchLimit: Int!) {
    callback_aggregate(distinct_on: id, where: {domain: {_ilike: $domain}, operation_id: {_eq: $operation_id}}){
      aggregate {
        count
      }
    }
    callback(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {domain: {_ilike: $domain}, operation_id: {_eq: $operation_id}}) {
      ...callbackData
    }
}
`;
const descriptionSearch = gql`
${callbackFragment}
query domainQuery($operation_id: Int!, $description: String!, $offset: Int!, $fetchLimit: Int!) {
    callback_aggregate(distinct_on: id, where: {description: {_ilike: $description}, operation_id: {_eq: $operation_id}}){
      aggregate {
        count
      }
    }
    callback(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {description: {_ilike: $description}, operation_id: {_eq: $operation_id}}) {
      ...callbackData
    }
}
`;
const ipSearch = gql`
${callbackFragment}
query domainQuery($operation_id: Int!, $ip: String!, $offset: Int!, $fetchLimit: Int!) {
    callback_aggregate(distinct_on: id, where: {_or: [{ip: {_ilike: $ip}}, {external_ip: {_ilike: $ip}}], operation_id: {_eq: $operation_id}}){
      aggregate {
        count
      }
    }
    callback(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {_or: [{ip: {_ilike: $ip}}, {external_ip: {_ilike: $ip}}], operation_id: {_eq: $operation_id}}) {
      ...callbackData
    }
}
`;

export function SearchTabCallbacksLabel(props){
    return (
        <MythicSearchTabLabel label={"Callbacks"} iconComponent={<PhoneCallbackIcon />} {...props}/>
    )
}

const SearchTabCallbacksSearchPanel = (props) => {
    const theme = useTheme();
    const [search, setSearch] = React.useState("");
    const [searchField, setSearchField] = React.useState("User");
    const searchFieldOptions = ["User", "Domain", "Host", "Description", "IP"];
    const handleSearchFieldChange = (event) => {
        setSearchField(event.target.value);
        props.onChangeSearchField(event.target.value);
        props.changeSearchParam("searchField", event.target.value);
    }
    const handleSearchValueChange = (name, value, error) => {
        setSearch(value);
        
    }
    const submitSearch = (event, querySearch, querySearchField) => {
        let adjustedSearchField = querySearchField ? querySearchField : searchField;
        let adjustedSearch = querySearch ? querySearch : search;
        props.changeSearchParam("search", adjustedSearch);
        switch(adjustedSearchField){
            case "User":
                props.onUserSearch({search:adjustedSearch, offset: 0})
                break;
            case "Domain":
                props.onDomainSearch({search:adjustedSearch, offset: 0})
                break;
            case "Host":
                props.onHostSearch({search:adjustedSearch, offset: 0})
                break;
            case "Description":
                props.onDescriptionSearch({search:adjustedSearch, offset: 0})
                break;
            case "IP":
                props.onIPSearch({search:adjustedSearch, offset: 0})
                break;
            default:
                break;
        }
    }
    React.useEffect(() => {
        if(props.value === props.index){
            let queryParams = new URLSearchParams(window.location.search);
            let adjustedSearch = "";
            let adjustedSearchField = "User";
            if(queryParams.has("search")){
                setSearch(queryParams.get("search"));
                adjustedSearch = queryParams.get("search");
            }
            console.log(queryParams.get("searchField"));
            if(queryParams.has("searchField") && searchFieldOptions.includes(queryParams.get("searchField"))){
                setSearchField(queryParams.get("searchField"));
                props.onChangeSearchField(queryParams.get("searchField"));
                adjustedSearchField = queryParams.get("searchField");
            }else{
                setSearchField("User");
                props.onChangeSearchField("User");
                props.changeSearchParam("searchField", "User");
            }
            submitSearch(null, adjustedSearch,  adjustedSearchField);
        }
    }, [props.value, props.index])
    return (
        <Grid container spacing={2} style={{paddingTop: "10px", paddingLeft: "10px", maxWidth: "100%"}}>
            <Grid item xs={6}>
                <MythicTextField placeholder="Search..." value={search}
                    onChange={handleSearchValueChange} onEnter={submitSearch} name="Search..." InputProps={{
                        endAdornment: 
                        <React.Fragment>
                            <Tooltip title="Search">
                                <IconButton onClick={submitSearch}><SearchIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </Tooltip>
                        </React.Fragment>,
                        style: {padding: 0}
                    }}/>
            </Grid>
            <Grid item xs={6}>
                <FormLabel component="legend">Search Callbacks by</FormLabel>
                <Select
                    style={{marginBottom: "10px", width: "15rem", marginTop: "5px"}}
                    value={searchField}
                    onChange={handleSearchFieldChange}
                >
                    {
                        searchFieldOptions.map((opt, i) => (
                            <MenuItem key={"searchopt" + opt} value={opt}>{opt}</MenuItem>
                        ))
                    }
                </Select>
            </Grid>
        </Grid>
    )
}
export const SearchTabCallbacksPanel = (props) =>{
    const [callbackData, setCallbackData] = React.useState([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const [searchField, setSearchField] = React.useState("User");
    const me = useReactiveVar(meState);

    const onChangeSearchField = (field) => {
        setSearchField(field);
        switch(field){
            case "User":
                onUserSearch({search, offset: 0});
                break;
            case "Domain":
                onDomainSearch({search, offset: 0});
                break;
            case "Description":
                onDescriptionSearch({search, offset: 0});
                break;
            case "Host":
                onHostSearch({search, offset: 0});
                break;
            case "IP":
                onIPSearch({search, offset: 0});
                break;
            default:
                break;
        }
    }
    const handleCallbackSearchResults = (data) => {
        snackActions.dismiss();
        setTotalCount(data.callback_aggregate.aggregate.count);
        setCallbackData(data.callback);
    }
    const handleCallbackSearchFailure = (data) => {
        snackActions.dismiss();
        snackActions.error("Failed to fetch data for search");
        console.log(data);
    }
    const [getUserSearch] = useLazyQuery(userSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCallbackSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getDomainSearch] = useLazyQuery(domainSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCallbackSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getDescriptionSearch] = useLazyQuery(descriptionSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCallbackSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getHostSearch] = useLazyQuery(hostSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCallbackSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getIPSearch] = useLazyQuery(ipSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCallbackSearchResults,
        onError: handleCallbackSearchFailure
    })
    const onUserSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(new_search === ""){
            new_search = "_";
        }
        getUserSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            user: "%" + new_search + "%",
        }})
    }
    const onDomainSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(new_search === ""){
            new_search = "_";
        }
        getDomainSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            domain: "%" + new_search + "%",
        }})
    }
    const onHostSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(new_search === ""){
            new_search = "_";
        }
        getHostSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            host: "%" + new_search + "%",
        }})
    }
    const onDescriptionSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(new_search === ""){
            new_search = "_";
        }
        getDescriptionSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            description: "%" + new_search + "%",
        }})
    }
    const onIPSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(new_search === ""){
            new_search = "_";
        }
        getIPSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            ip: "%" + new_search + "%",
        }})
    }
    const onChangePage = (event, value) => {
        if(value === 1){
            switch(searchField){
                case "User":
                    onUserSearch({search, offset: 0});
                    break;
                case "Domain":
                    onDomainSearch({search, offset: 0});
                    break;
                case "Description":
                    onDescriptionSearch({search, offset: 0});
                    break;
                case "Host":
                    onHostSearch({search, offset: 0});
                    break;
                case "IP":
                    onIPSearch({search, offset: 0});
                    break;
                default:
                    break;
            }
            
        }else{
            switch(searchField){
                case "User":
                    onUserSearch({search, offset: (value - 1) * fetchLimit});
                    break;
                case "Domain":
                    onDomainSearch({search, offset: (value - 1) * fetchLimit});
                    break;
                case "Description":
                    onDescriptionSearch({search, offset: (value - 1) * fetchLimit});
                    break;
                case "Host":
                    onHostSearch({search, offset: (value - 1) * fetchLimit});
                    break;
                case "IP":
                    onIPSearch({search, offset: (value - 1) * fetchLimit});
                    break;
                default:
                    break;
            }
            
        }
    }
    return (
        <MythicTabPanel {...props} >
                <SearchTabCallbacksSearchPanel onChangeSearchField={onChangeSearchField} onUserSearch={onUserSearch} onIPSearch={onIPSearch} value={props.value} index={props.index}
                    onDomainSearch={onDomainSearch} onHostSearch={onHostSearch} onDescriptionSearch={onDescriptionSearch} changeSearchParam={props.changeSearchParam}/>
                <div style={{overflowY: "auto", flexGrow: 1}}>
                    {callbackData.length > 0 ? (
                        <CallbackSearchTable callbacks={callbackData} />) : (
                        <div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", left: "50%", top: "50%"}}>No Search Results</div>
                    )}
                </div>
                <div style={{background: "transparent", display: "flex", justifyContent: "center", alignItems: "center", paddingTop: "5px", paddingBottom: "5px"}}>
                    <Pagination count={Math.ceil(totalCount / fetchLimit)} variant="outlined" color="primary" boundaryCount={1}
                            siblingCount={1} onChange={onChangePage} showFirstButton={true} showLastButton={true} style={{padding: "20px"}}/>
                        <Typography style={{paddingLeft: "10px"}}>Total Results: {totalCount}</Typography>
                </div>
        </MythicTabPanel>
    )
}