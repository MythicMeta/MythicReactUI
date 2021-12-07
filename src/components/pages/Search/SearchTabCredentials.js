import {MythicTabPanel, MythicSearchTabLabel} from '../../../components/MythicComponents/MythicTabPanel';
import React from 'react';
import MythicTextField from '../../MythicComponents/MythicTextField';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
import SearchIcon from '@material-ui/icons/Search';
import Tooltip from '@material-ui/core/Tooltip';
import {useTheme} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import { gql, useLazyQuery, useMutation} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import Pagination from '@material-ui/lab/Pagination';
import { Button, Typography } from '@material-ui/core';
import {CredentialTable} from './CredentialTable';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {CredentialTableNewCredentialDialog} from './CredentialTableNewCredentialDialog';

const credentialFragment = gql`
fragment credentialData on credential{
    account
    comment
    credential_text
    id
    realm
    type
    task_id
    timestamp
    deleted
    operator {
        username
    }
}
`;
const fetchLimit = 20;
const accountSearch = gql`
${credentialFragment}
query accountQuery($operation_id: Int!, $account: String!, $offset: Int!, $fetchLimit: Int!) {
    credential_aggregate(distinct_on: id, where: {account: {_ilike: $account}, operation_id: {_eq: $operation_id}}) {
      aggregate {
        count
      }
    }
    credential(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {account: {_ilike: $account}, operation_id: {_eq: $operation_id}}) {
      ...credentialData
    }
  }
`;
const realmSearch = gql`
${credentialFragment}
query accountQuery($operation_id: Int!, $realm: String!, $offset: Int!, $fetchLimit: Int!) {
    credential_aggregate(distinct_on: id, where: {realm: {_ilike: $realm}, operation_id: {_eq: $operation_id}}) {
      aggregate {
        count
      }
    }
    credential(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {realm: {_ilike: $realm}, operation_id: {_eq: $operation_id}}) {
      ...credentialData
    }
  }
`;
const credentialSearch = gql`
${credentialFragment}
query accountQuery($operation_id: Int!, $credential: String!, $offset: Int!, $fetchLimit: Int!) {
    credential_aggregate(distinct_on: id, where: {credential_text: {_ilike: $credential}, operation_id: {_eq: $operation_id}}) {
      aggregate {
        count
      }
    }
    credential(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {credential_text: {_ilike: $credential}, operation_id: {_eq: $operation_id}}) {
      ...credentialData
    }
  }
`;
const commentSearch = gql`
${credentialFragment}
query accountQuery($operation_id: Int!, $comment: String!, $offset: Int!, $fetchLimit: Int!) {
    credential_aggregate(distinct_on: id, where: {comment: {_ilike: $comment}, operation_id: {_eq: $operation_id}}) {
      aggregate {
        count
      }
    }
    credential(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {comment: {_ilike: $comment}, operation_id: {_eq: $operation_id}}) {
      ...credentialData
    }
  }
`;
const createCredentialMutation = gql`
${credentialFragment}
mutation createCredential($comment: String!, $account: String!, $realm: String!, $type: String!, $credential: bytea!) {
    insert_credential_one(object: {account: $account, credential_raw: $credential, comment: $comment, realm: $realm, type: $type}) {
      id
    }
  }
`;

export function SearchTabCredentialsLabel(props){
    return (
        <MythicSearchTabLabel label={"Credentials"} iconComponent={<VpnKeyIcon />} {...props}/>
    )
}

const SearchTabCredentialsSearchPanel = (props) => {
    const theme = useTheme();
    const [search, setSearch] = React.useState("");
    const [searchField, setSearchField] = React.useState("Account");
    const searchFieldOptions = ["Account", "Realm", "Comment", "Credential"];
    const [createCredentialDialogOpen, setCreateCredentialDialogOpen] = React.useState(false);
    const handleSearchFieldChange = (event) => {
        setSearchField(event.target.value);
        props.onChangeSearchField(event.target.value);
        props.changeSearchParam("searchField", event.target.value);
    }
    const [createCredential] = useMutation(createCredentialMutation, {
        fetchPolicy: "no-cache",
        onCompleted: (data) => {
            snackActions.success("Successfully created new credential");
        },
        onError: (data) => {
            snackActions.error("Failed to create credential");
            console.log(data);
        }
    })
    const handleSearchValueChange = (name, value, error) => {
        setSearch(value);
        props.changeSearchParam("search", value);
    }
    const submitSearch = (event, querySearch, querySearchField) => {
        let adjustedSearchField = querySearchField ? querySearchField : searchField;
        let adjustedSearch = querySearch ? querySearch : search;
        switch(adjustedSearchField){
            case "Account":
                props.onAccountSearch({search:adjustedSearch, offset: 0})
                break;
            case "Realm":
                props.onRealmSearch({search:adjustedSearch, offset: 0})
                break;
            case "Comment":
                props.onCommentSearch({search:adjustedSearch, offset: 0})
                break;
            case "Credential":
                props.onCredentialSearch({search:adjustedSearch, offset: 0})
                break;
            case "Type":
                props.OnTypeSearch({search:adjustedSearch, offset: 0})
                break;
            default:
                break;
        }
    }
    const onCreateCredential = ({type, account, realm, comment, credential}) => {
        createCredential({variables: {type, account, realm, comment, credential}})
    }
    React.useEffect(() => {
        if(props.value === props.index){
            let queryParams = new URLSearchParams(window.location.search);
            let adjustedSearch = "";
            let adjustedSearchField = "Account";
            if(queryParams.has("search")){
                setSearch(queryParams.get("search"));
                adjustedSearch = queryParams.get("search");
            }
            if(queryParams.has("searchField") && searchFieldOptions.includes(queryParams.get("searchField"))){
                setSearchField(queryParams.get("searchField"));
                props.onChangeSearchField(queryParams.get("searchField"));
                adjustedSearchField = queryParams.get("searchField");
            }else{
                setSearchField("Account");
                props.onChangeSearchField("Account");
                props.changeSearchParam("searchField", "Account");
            }
            submitSearch(null, adjustedSearch, adjustedSearchField);
        }
    }, [props.value, props.index])
    return (
        <Grid container spacing={2} style={{paddingTop: "10px", paddingLeft: "10px", maxWidth: "100%"}}>
            <Grid item xs={5}>
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
            <Grid item xs={5}>
                <FormLabel component="legend">Search Credential's</FormLabel>
                <FormControl component="fieldset">
                    <RadioGroup row aria-label="file_component" name="searchField" value={searchField} onChange={handleSearchFieldChange}>
                        {searchFieldOptions.map( (opt) => (
                            <FormControlLabel value={opt} key={"searchopt" + opt} control={<Radio />} label={opt} />
                        ))}
                    </RadioGroup>
                </FormControl>
            </Grid>
            <Grid item xs={2}>
                <MythicDialog fullWidth={true} maxWidth="md" open={createCredentialDialogOpen} 
                    onClose={()=>{setCreateCredentialDialogOpen(false);}} 
                    innerDialog={<CredentialTableNewCredentialDialog onSubmit={onCreateCredential} onClose={()=>{setCreateCredentialDialogOpen(false);}} />}
                />
                <Button size="small" color="primary" onClick={ () => {setCreateCredentialDialogOpen(true);}} variant="contained">New Credential</Button>
            </Grid>
        </Grid>
    )
}
export const SearchTabCredentialsPanel = (props) =>{
    const [credentialaData, setCredentialData] = React.useState([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const [searchField, setSearchField] = React.useState("Account");
    const me = useReactiveVar(meState);

    const onChangeSearchField = (field) => {
        setSearchField(field);
        setCredentialData([]);
    }
    const handleCredentialSearchResults = (data) => {
        snackActions.dismiss();
        setTotalCount(data.credential_aggregate.aggregate.count);
        setCredentialData(data.credential);
    }
    const handleCallbackSearchFailure = (data) => {
        snackActions.dismiss();
        snackActions.error("Failed to fetch data for search");
        console.log(data);
    }
    const [getAccountSearch] = useLazyQuery(accountSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCredentialSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getRealmSearch] = useLazyQuery(realmSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCredentialSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getCredentialSearch] = useLazyQuery(credentialSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCredentialSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getCommentSearch] = useLazyQuery(commentSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCredentialSearchResults,
        onError: handleCallbackSearchFailure
    })
    const onAccountSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        getAccountSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            account: "%" + search + "%",
        }})
    }
    const onRealmSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        getRealmSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            realm: "%" + search + "%",
        }})
    }
    const onCredentialSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        getCredentialSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            credential: "%" + search + "%",
        }})
    }
    const onCommentSearch = ({search, offset}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(new_search === ""){
            new_search = "_";
        }
        getCommentSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            comment: "%" + new_search + "%",
        }})
    }
    const onChangePage = (event, value) => {
        if(value === 1){
            switch(searchField){
                case "Account":
                    onAccountSearch({search, offset: 0});
                    break;
                case "Realm":
                    onRealmSearch({search, offset: 0});
                    break;
                case "Credential":
                    onCredentialSearch({search, offset: 0});
                    break;
                case "Comment":
                    onCommentSearch({search, offset: 0});
                    break;
                default:
                    break;
            }
            
        }else{
            switch(searchField){
                case "Account":
                    onAccountSearch({search, offset: (value - 1) * fetchLimit});
                    break;
                case "Realm":
                    onRealmSearch({search, offset: (value - 1) * fetchLimit});
                    break;
                case "Credential":
                    onCredentialSearch({search, offset: (value - 1) * fetchLimit});
                    break;
                case "Comment":
                    onCommentSearch({search, offset: (value - 1) * fetchLimit});
                    break;
                default:
                    break;
            }
            
        }
    }
    return (
        <MythicTabPanel {...props} >
            <SearchTabCredentialsSearchPanel onChangeSearchField={onChangeSearchField} onAccountSearch={onAccountSearch} value={props.value} index={props.index}
                onRealmSearch={onRealmSearch} onCredentialSearch={onCredentialSearch} onCommentSearch={onCommentSearch} changeSearchParam={props.changeSearchParam}/>
            <div style={{overflowY: "auto", flexGrow: 1}}>
                {credentialaData.length > 0 ? (
                    <CredentialTable credentials={credentialaData} />) : (
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