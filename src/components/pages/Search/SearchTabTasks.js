import {MythicTabPanel, MythicSearchTabLabel} from '../../../components/MythicComponents/MythicTabPanel';
import React from 'react';
import MythicTextField from '../../MythicComponents/MythicTextField';
import {TaskDisplay} from '../Callbacks/TaskDisplay';
import AssignmentIcon from '@material-ui/icons/Assignment';
import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
import SearchIcon from '@material-ui/icons/Search';
import Tooltip from '@material-ui/core/Tooltip';
import {useTheme} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import { gql, useLazyQuery } from '@apollo/client';
import {taskingDataFragment} from '../Callbacks/CallbacksTabsTasking'
import { snackActions } from '../../utilities/Snackbar';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import Pagination from '@material-ui/lab/Pagination';
import { Typography } from '@material-ui/core';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

const fetchLimit = 20;
const responseSearch = gql`
${taskingDataFragment}
query responseQuery($operation_id: Int!, $search: String!, $offset: Int!, $fetchLimit: Int!, $status: String!) {
    task_aggregate(distinct_on: id, order_by: {id: asc}, where: {status: {_ilike: $status}, parent_task_id: {_is_null: true}, responses: {response_escape: {_ilike: $search}}, callback: {operation_id: {_eq: $operation_id}}}) {
      aggregate {
        count(columns: id)
      }
    }
    task(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: asc}, where: {status: {_ilike: $status}, parent_task_id: {_is_null: true}, responses: {response_escape: {_ilike: $search}}, callback: {operation_id: {_eq: $operation_id}}}) {
      ...taskData
    }
  }
`;
const parameterSearch = gql`
${taskingDataFragment}
query parametersQuery($operation_id: Int!, $search: String!, $offset: Int!, $fetchLimit: Int!, $status: String!) {
    task_aggregate(distinct_on: id, order_by: {id: asc}, where: {status: {_ilike: $status}, parent_task_id: {_is_null: true}, original_params: {_ilike: $search}, callback: {operation_id: {_eq: $operation_id}}}) {
      aggregate {
        count(columns: id)
      }
    }
    task(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: asc}, where: {status: {_ilike: $status}, parent_task_id: {_is_null: true}, original_params: {_ilike: $search}, callback: {operation_id: {_eq: $operation_id}}}) {
      ...taskData
    }
  }
`;
const commentSearch = gql`
${taskingDataFragment}
query responseQuery($operation_id: Int!, $search: String!, $offset: Int!, $fetchLimit: Int!, $status: String!) {
    task_aggregate(distinct_on: id, order_by: {id: asc}, where: {status: {_ilike: $status}, parent_task_id: {_is_null: true}, comment: {_ilike: $search}, callback: {operation_id: {_eq: $operation_id}}}) {
      aggregate {
        count(columns: id)
      }
    }
    task(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: asc}, where: {status: {_ilike: $status}, parent_task_id: {_is_null: true}, comment: {_ilike: $search}, callback: {operation_id: {_eq: $operation_id}}}) {
      ...taskData
    }
  }
`;

export function SearchTabTasksLabel(props){
    return (
        <MythicSearchTabLabel label={"Tasks"} iconComponent={<AssignmentIcon />} {...props}/>
    )
}

const SearchTabTasksSearchPanel = (props) => {
    const theme = useTheme();
    const [search, setSearch] = React.useState("");
    const [searchField, setSearchField] = React.useState("Output");
    const searchFieldOptions = ["Output", "Parameters", "Comment"];
    const [filterTaskStatus, setFilterTaskStatus] = React.useState("");
    const handleSearchFieldChange = (event) => {
        setSearchField(event.target.value);
        props.onChangeSearchField(event.target.value);
        props.changeSearchParam("searchField", event.target.value);
    }
    const handleSearchValueChange = (name, value, error) => {
        setSearch(value);
        props.changeSearchParam("search", value);
    }
    const handleFilterTaskStatusValueChange = (name, value, error) => {
        setFilterTaskStatus(value);
        props.changeSearchParam("taskStatus", value);
    }
    const submitSearch = (event, querySearch, querySearchField, queryTaskStatus) => {
            let adjustedSearchField = querySearchField ? querySearchField : searchField;
            let adjustedSearch = querySearch ? querySearch : search;
            let adjustedTaskStatus = queryTaskStatus ? queryTaskStatus : filterTaskStatus;
            switch(adjustedSearchField){
            case "Output":
                props.onOutputSearch({search:adjustedSearch, offset: 0, taskStatus: adjustedTaskStatus})
                break;
            case "Parameters":
                props.onParameterSearch({search:adjustedSearch, offset: 0, taskStatus: adjustedTaskStatus})
                break;
            case "Comment":
                props.onCommentSearch({search:adjustedSearch, offset: 0, taskStatus: adjustedTaskStatus})
                break;
            default:
                break;
        }
    }
    React.useEffect(() => {
        if(props.value === props.index){
            let queryParams = new URLSearchParams(window.location.search);
            let adjustedSearch = "";
            let adjustedSearchField = "Output";
            let adjustedTaskStatus = "";
            if(queryParams.has("search")){
                setSearch(queryParams.get("search"));
                adjustedSearch = queryParams.get("search");
            }
            if(queryParams.has("searchField") && searchFieldOptions.includes(queryParams.get("searchField"))){
                setSearchField(queryParams.get("searchField"));
                props.onChangeSearchField(queryParams.get("searchField"));
                adjustedSearchField = queryParams.get("searchField");
            }else{
                setSearchField("Output");
                props.onChangeSearchField("Output");
                props.changeSearchParam("searchField", "Output");
            }
            if(queryParams.has("taskStatus")){
                setFilterTaskStatus(queryParams.get("taskStatus"));
                props.onChangeTaskStatus(queryParams.get("taskStatus"));
                adjustedTaskStatus = queryParams.get("taskStatus");
            }
            submitSearch(null, adjustedSearch, adjustedSearchField, adjustedTaskStatus);
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
            <Grid item xs={3}>
                <FormLabel component="legend">Search Task's</FormLabel>
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
            <Grid item xs={2}>
                <MythicTextField placeholder="Filter Task Status..." value={filterTaskStatus}
                        onChange={handleFilterTaskStatusValueChange} onEnter={submitSearch} name="Filter Task Status..."/>
            </Grid>
        </Grid>
    )
}
export const SearchTabTasksPanel = (props) =>{
    const [taskingData, setTaskingData] = React.useState({task: []});
    const [totalCount, setTotalCount] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const [searchField, setSearchField] = React.useState("Output");
    const [taskStatus, setTaskStatus] = React.useState("");
    const me = useReactiveVar(meState);
    const onChangeSearchField = (field) => {
        setSearchField(field);
        switch(field){
            case "Output":
                onOutputSearch({search, offset: 0, taskStatus});
                break;
            case "Parameters":
                onParameterSearch({search, offset: 0, taskStatus});
                break;
            case "Comment":
                onCommentSearch({search, offset: 0, taskStatus});
                break;
            default:
                break;
        }
    }
    const onChangeTaskStatus = (status) => {
        setTaskStatus(status);
    }
    const handleCallbackSearchSuccess = (data) => {
        snackActions.dismiss();
        setTotalCount(data.task_aggregate.aggregate.count);
        setTaskingData({task: data.task});
    }
    const handleCallbackSearchFailure = (data) => {
        snackActions.dismiss();
        snackActions.error("Failed to fetch data for search");
        console.log(data);
    }
    const [getOutputSearch] = useLazyQuery(responseSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCallbackSearchSuccess,
        onError: handleCallbackSearchFailure
    })
    const [getParameterSearch] = useLazyQuery(parameterSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCallbackSearchSuccess,
        onError: handleCallbackSearchFailure
    })
    const [getCommentSearch] = useLazyQuery(commentSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleCallbackSearchSuccess,
        onError: handleCallbackSearchFailure
    })
    const onOutputSearch = ({search, offset, taskStatus}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(search === ""){
            new_search = "_";
        }
        let newTaskStatus = taskStatus;
        if(newTaskStatus === ""){
            newTaskStatus = "_";
        }
        getOutputSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            search: "%" + new_search + "%",
            status: "%" + newTaskStatus + "%"
        }})
    }
    const onParameterSearch = ({search, offset, taskStatus}) => {
        snackActions.info("Searching...", {persist:true});
        setSearch(search);
        let new_search = search;
        if(search === ""){
            new_search = "_";
        }
        let newTaskStatus = taskStatus;
        if(newTaskStatus === ""){
            newTaskStatus = "_";
        }
        getParameterSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            search: "%" + new_search + "%",
            status: "%" + newTaskStatus + "%"
        }})
    }
    const onCommentSearch = ({search, offset, taskStatus}) => {
        snackActions.info("Searching...", {persist:true});
        let new_search = search;
        console.log("search", search);
        if(search === ""){
            new_search = "_";
        }
        let newTaskStatus = taskStatus;
        if(newTaskStatus === ""){
            newTaskStatus = "_";
        }
        setSearch(search);
        getCommentSearch({variables:{
            operation_id: me.user.current_operation_id,
            offset: offset,
            fetchLimit: fetchLimit,
            search: "%" + new_search + "%",
            status: "%" + newTaskStatus + "%"
        }})
    }
    const onChangePage = (event, value) => {
        if(value === 1){
            switch(searchField){
                case "Output":
                    onOutputSearch({search, offset: 0, taskStatus});
                    break;
                case "Parameters":
                    onParameterSearch({search, offset: 0, taskStatus});
                    break;
                case "Comment":
                    onCommentSearch({search, offset: 0, taskStatus});
                    break;
                default:
                    break;
            }
            
        }else{
            switch(searchField){
                case "Output":
                    onOutputSearch({search, offset: (value - 1) * fetchLimit, taskStatus });
                    break;
                case "Parameters":
                    onParameterSearch({search, offset: (value - 1) * fetchLimit, taskStatus });
                    break;
                case "Comment":
                    onCommentSearch({search, offset: (value - 1) * fetchLimit, taskStatus });
                    break;
                default:
                    break;
            }
            
        }
    }
    return (
        <MythicTabPanel {...props} >
            <SearchTabTasksSearchPanel onChangeSearchField={onChangeSearchField} onOutputSearch={onOutputSearch} value={props.value} index={props.index} onChangeTaskStatus={onChangeTaskStatus}
                onParameterSearch={onParameterSearch} onCommentSearch={onCommentSearch} changeSearchParam={props.changeSearchParam}/>
            <div style={{overflowY: "auto", flexGrow: 1}}>
                
                {
                    taskingData.task.length > 0 ? (
                        taskingData.task.map( (task) => (
                            <TaskDisplay key={"taskinteractdisplay" + task.id} task={task} command_id={task.command == null ? 0 : task.command.id} />
                        ))
                    ) : (<div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", left: "50%", top: "50%"}}>No Search Results</div>)
                }
            </div>
            <div style={{background: "transparent", display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Pagination count={Math.ceil(totalCount / fetchLimit)} variant="outlined" color="primary" boundaryCount={1}
                    siblingCount={1} onChange={onChangePage} showFirstButton={true} showLastButton={true} style={{padding: "20px"}}/>
                <Typography style={{paddingLeft: "10px"}}>Total Results: {totalCount}</Typography>
            </div>
        </MythicTabPanel>
    )
}