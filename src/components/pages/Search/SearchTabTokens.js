import {MythicTabPanel, MythicSearchTabLabel} from '../../../components/MythicComponents/MythicTabPanel';
import React from 'react';
import MythicTextField from '../../MythicComponents/MythicTextField';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import Tooltip from '@mui/material/Tooltip';
import {useTheme} from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import { gql, useLazyQuery} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import Pagination from '@mui/material/Pagination';
import { Typography } from '@mui/material';
import {TokenTable} from './TokenTable';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

const tokenFragment = gql`
fragment tokenData on token{
    id
    User
    Groups
    TokenId
    logonsession {
        LogonType
        UserName
        LogonDomain
        id
        LogonId
        authenticationpackages(where: {deleted: {_eq: false}}) {
            Name
            id
        }
    }
    task {
        id
    }
    host
    deleted
    description
    callbacktokens(where: {deleted: {_eq: false}}) {
        callback_id
        id
    }
}
`;
const fetchLimit = 20;
const userGroupSearch = gql`
${tokenFragment}
query usergroupQuery($operation_id: Int!, $name: String!, $offset: Int!, $fetchLimit: Int!) {
    token_aggregate(distinct_on: id, where: {task: {callback: {operation_id: {_eq: $operation_id}}}, _or: [{Groups: {_ilike: $name}}, {User: {_ilike: $name}}, {logonsession: {UserName: {_ilike: $name}}}]}) {
      aggregate {
        count
      }
    }
    token(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {task: {callback: {operation_id: {_eq: $operation_id}}}, _or: [{Groups: {_ilike: $name}}, {User: {_ilike: $name}}, {logonsession: {UserName: {_ilike: $name}}}]}) {
      ...tokenData
    }
}
`;
const SIDSearch = gql`
${tokenFragment}
query sidQuery($operation_id: Int!, $sid: String!, $offset: Int!, $fetchLimit: Int!) {
    token_aggregate(distinct_on: id, where: {task: {callback: {operation_id: {_eq: $operation_id}}}, _or: [{AppContainerSid: {_ilike: $sid}}, {LogonSid: {_ilike: $sid}}, {Owner: {_ilike: sid}}, {PrimaryGroup: {_ilike: sid}}, {DefaultDacl: {_ilike: sid}}]}) {
      aggregate {
        count
      }
    }
    token(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {task: {callback: {operation_id: {_eq: $operation_id}}}, _or: [{AppContainerSid: {_ilike: $sid}}, {LogonSid: {_ilike: $sid}}, {Owner: {_ilike: sid}}, {PrimaryGroup: {_ilike: sid}}, {DefaultDacl: {_ilike: sid}}]}) {
      ...tokenData
    }
}
`;
const logonTypeSearch = gql`
${tokenFragment}
query logontypeQuery($operation_id: Int!, $logontype: String!, $offset: Int!, $fetchLimit: Int!) {
    token_aggregate(distinct_on: id, where: {logonsession: {LogonType: { _ilike: $logontype}}, task: {callback: {operation_id: {_eq: $operation_id}}}}) {
      aggregate {
        count
      }
    }
    token(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {logonsession: {LogonType: { _ilike: $logontype}}, task: {callback: {operation_id: {_eq: $operation_id}}}}) {
      ...tokenData
    }
  }
`;
const hostSearch = gql`
${tokenFragment}
query hostQuery($operation_id: Int!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    token_aggregate(distinct_on: id, where: {host: {_ilike: $host}, task: {callback: {operation_id: {_eq: $operation_id}}}}) {
      aggregate {
        count
      }
    }
    token(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, task: {callback: {operation_id: {_eq: $operation_id}}}}) {
      ...tokenData
    }
}
`;
export function SearchTabTokensLabel(props){
    return (
        <MythicSearchTabLabel label={"Tokens"} iconComponent={<ConfirmationNumberIcon />} {...props}/>
    )
}

const SearchTabTokensSearchPanel = (props) => {
    const theme = useTheme();
    const [search, setSearch] = React.useState("");
    const [searchField, setSearchField] = React.useState("User/Group");
    const searchFieldOptions = ["User/Group", "SID", "LogonType", "Host"];
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
            case "User/Group":
                props.onUserGroupSearch({search:adjustedSearch, offset: 0})
                break;
            case "SID":
                props.onSIDSearch({search:adjustedSearch, offset: 0})
                break;
            case "LogonType":
                props.onLogonTypeSearch({search:adjustedSearch, offset: 0})
                break;
            case "Host":
                props.onHostSearch({search:adjustedSearch, offset: 0})
                break;
            default:
                break;
        }
    }
    React.useEffect(() => {
        if(props.value === props.index){
            let queryParams = new URLSearchParams(window.location.search);
            let adjustedSearch = "";
            let adjustedSearchField = "User/Group";
            if(queryParams.has("search")){
                setSearch(queryParams.get("search"));
                adjustedSearch = queryParams.get("search");
            }
            if(queryParams.has("searchField") && searchFieldOptions.includes(queryParams.get("searchField"))){
                setSearchField(queryParams.get("searchField"));
                props.onChangeSearchField(queryParams.get("searchField"));
                adjustedSearchField = queryParams.get("searchField");
            }else{
                setSearchField("User/Group");
                props.onChangeSearchField("User/Group");
                props.changeSearchParam("searchField", "User/Group");
            }
            submitSearch(null, adjustedSearch, adjustedSearchField);
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
                                <IconButton onClick={submitSearch} size="large"><SearchIcon style={{color: theme.palette.info.main}}/></IconButton>
                            </Tooltip>
                        </React.Fragment>,
                        style: {padding: 0}
                    }}/>
            </Grid>
            <Grid item xs={2}>
                <Select
                    style={{marginBottom: "10px", width: "15rem"}}
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
    );
}
export const SearchTabTokensPanel = (props) =>{
    const [tokenData, setTokenData] = React.useState([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const [searchField, setSearchField] = React.useState("User/Group");
    const me = useReactiveVar(meState);

    const onChangeSearchField = (field) => {
        setSearchField(field);
        setTokenData([]);
        switch(field){
            case "User/Group":
                onUserGroupSearch({search, offset: 0});
                break;
            case "SID":
                onSIDSearch({search, offset: 0});
                break;
            case "LogonType":
                onLogonTypeSearch({search, offset: 0});
                break;
            case "Host":
                onHostSearch({search, offset: 0});
                break;
            default:
                break;
        }
    }
    const handleTokenSearchResults = (data) => {
        snackActions.dismiss();
        setTotalCount(data.token_aggregate.aggregate.count);
        setTokenData(data.token);
    }
    const handleCallbackSearchFailure = (data) => {
        snackActions.dismiss();
        snackActions.error("Failed to fetch data for search");
        console.log(data);
    }
    const [getUserGroupSearch] = useLazyQuery(userGroupSearch, {
        fetchPolicy: "network-only",
        onCompleted: handleTokenSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getSIDSearch] = useLazyQuery(SIDSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleTokenSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getLogonTypeSearch] = useLazyQuery(logonTypeSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleTokenSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getHostSearch] = useLazyQuery(hostSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleTokenSearchResults,
        onError: handleCallbackSearchFailure
    })
    const onUserGroupSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(new_search === ""){
            new_search = "_";
        }
        getUserGroupSearch({variables:{
            operation_id: me?.user?.current_operation_id || 0,
            offset: offset,
            fetchLimit: fetchLimit,
            name: "%" + new_search + "%",
        }})
    }
    const onLogonTypeSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(new_search === ""){
            new_search = "_";
        }
        getLogonTypeSearch({variables:{
            operation_id: me?.user?.current_operation_id || 0,
            offset: offset,
            fetchLimit: fetchLimit,
            logontype: "%" + new_search + "%",
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
            operation_id: me?.user?.current_operation_id || 0,
            offset: offset,
            fetchLimit: fetchLimit,
            host: "%" + new_search + "%",
        }})
    }
    const onSIDSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(new_search === ""){
            new_search = "_";
        }
        getSIDSearch({variables:{
            operation_id: me?.user?.current_operation_id || 0,
            offset: offset,
            fetchLimit: fetchLimit,
            sid: "%" + new_search + "%",
        }})
    }
    const onChangePage = (event, value) => {
        switch(searchField){
            case "User/Group":
                onUserGroupSearch({search, offset: (value - 1) * fetchLimit});
                break;
            case "SID":
                onSIDSearch({search, offset: (value - 1) * fetchLimit});
                break;
            case "LogonType":
                onLogonTypeSearch({search, offset: (value - 1) * fetchLimit});
                break;
            case "Host":
                onHostSearch({search, offset: (value - 1) * fetchLimit});
                break;
            default:
                break;
        }
    }
    return (
        <MythicTabPanel {...props} >
            <SearchTabTokensSearchPanel onChangeSearchField={onChangeSearchField} onUserGroupSearch={onUserGroupSearch} value={props.value} index={props.index}
                onLogonTypeSearch={onLogonTypeSearch} onHostSearch={onHostSearch} onSIDSearch={onSIDSearch} changeSearchParam={props.changeSearchParam} />
            <div style={{overflowY: "auto", flexGrow: 1}}>
                {tokenData.length > 0 ? (
                    <TokenTable tokens={tokenData} />) : (
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