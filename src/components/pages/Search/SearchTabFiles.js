import {MythicTabPanel, MythicSearchTabLabel} from '../../../components/MythicComponents/MythicTabPanel';
import React from 'react';
import MythicTextField from '../../MythicComponents/MythicTextField';
import AttachmentIcon from '@mui/icons-material/Attachment';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import Tooltip from '@mui/material/Tooltip';
import {useTheme} from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import { gql, useLazyQuery } from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import { MeHook } from '../../../cache';
import Pagination from '@mui/material/Pagination';
import { Button, Typography } from '@mui/material';
import {FileMetaDownloadTable, FileMetaUploadTable, FileMetaScreenshotTable} from './FileMetaTable';
import {FileBrowserTable} from './FileBrowserTable';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

const fileMetaFragment = gql`
fragment filemetaData on filemeta{
    agent_file_id
    chunk_size
    chunks_received
    complete
    deleted
    filename_text
    full_remote_path_text
    host
    id
    is_download_from_agent
    is_payload
    is_screenshot
    md5
    operator {
        id
        username
    }
    comment
    sha1
    timestamp
    total_chunks
    task {
        id
        comment
        callback {
            id
        }
        command {
            cmd
            id
        }
    }
}
`;
const fileBrowserFragment = gql`
fragment filebrowserData on filebrowserobj{
    comment
    deleted
    full_path_text
    host
    id
    is_file
    modify_time
    permissions
    size
    filemeta {
        id
        agent_file_id
        chunks_received
        complete
        total_chunks
        timestamp
        task {
            id
            comment
            callback {
                id
            }
        }
    }
}
`;
const fetchLimit = 20;
const filenameFileMetaUploadSearch = gql`
${fileMetaFragment}
query filenameFileMetaUploadQuery($operation_id: Int!, $filename: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filemeta_aggregate(distinct_on: id, where: {host: {_ilike: $host}, _and: [{_or: [{filename_text: {_ilike: $filename}}, {full_remote_path_text: {_ilike: $filename}}]}, {_or: [{task_id: {_is_null: false}}, {is_payload: {_eq: false}}]}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: false}, is_screenshot: {_eq: false},task_id: {_is_null: false}}) {
      aggregate {
        count
      }
    }
    filemeta(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, _and: [{_or: [{filename_text: {_ilike: $filename}}, {full_remote_path_text: {_ilike: $filename}}]}, {_or: [{task_id: {_is_null: false}}, {is_payload: {_eq: false}}]}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: false}, is_screenshot: {_eq: false}}) {
      ...filemetaData
    }
  }
`;
const filenameFileMetaDownloadSearch = gql`
${fileMetaFragment}
query filenameFileMetaDownloadQuery($operation_id: Int!, $filename: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filemeta_aggregate(distinct_on: id, where: {host: {_ilike: $host}, _or: [{filename_text: {_ilike: $filename}}, {full_remote_path_text: {_ilike: $filename}}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: false}}) {
      aggregate {
        count
      }
    }
    filemeta(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, _or: [{filename_text: {_ilike: $filename}}, {full_remote_path_text: {_ilike: $filename}}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: false}}) {
      ...filemetaData
    }
  }
`;
const filenameFileBrowserSearch = gql`
${fileBrowserFragment}
query filenameFileBrowserQuery($operation_id: Int!, $filename: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filebrowserobj_aggregate(distinct_on: id, where: {full_path_text: {_ilike: $filename}, host: {_ilike: $host}, operation_id: {_eq: $operation_id}}) {
      aggregate {
        count
      }
    }
    filebrowserobj(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, full_path_text: {_ilike: $filename}, operation_id: {_eq: $operation_id}}) {
      ...filebrowserData
    }
  }
`;
const hashFileMetaUploadSearch = gql`
${fileMetaFragment}
query hashFileMetaUploadQuery($operation_id: Int!, $hash: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filemeta_aggregate(distinct_on: id, where: {host: {_ilike: $host}, _and: [{_or: [{md5: {_ilike: $hash}}, {sha1: {_ilike: $hash}}]}, {_or: [{task_id: {_is_null: false}}, {is_payload: {_eq: false}}]}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: false}, is_screenshot: {_eq: false}}) {
      aggregate {
        count
      }
    }
    filemeta(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, _and: [{_or: [{md5: {_ilike: $hash}}, {sha1: {_ilike: $hash}}]}, {_or: [{task_id: {_is_null: false}}, {is_payload: {_eq: false}}]}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: false}, is_screenshot: {_eq: false}}) {
      ...filemetaData
    }
  }
`;
const hashFileMetaDownloadSearch = gql`
${fileMetaFragment}
query hashFileMetaDownloadQuery($operation_id: Int!, $hash: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filemeta_aggregate(distinct_on: id, where: {host: {_ilike: $host}, _or: [{md5: {_ilike: $hash}}, {sha1: {_ilike: $hash}}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: false}}) {
      aggregate {
        count
      }
    }
    filemeta(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, _or: [{md5: {_ilike: $hash}}, {sha1: {_ilike: $hash}}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: false}}) {
      ...filemetaData
    }
  }
`;
const commentFileMetaUploadSearch = gql`
${fileMetaFragment}
query commentFileMetaUploadQuery($operation_id: Int!, $comment: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filemeta_aggregate(distinct_on: id, where: {host: {_ilike: $host}, comment: {_ilike: $comment}, operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: false}, is_screenshot: {_eq: false}}) {
      aggregate {
        count
      }
    }
    filemeta(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, comment: {_ilike: $comment}, operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: false}, is_screenshot: {_eq: false}}) {
      ...filemetaData
    }
  }
`;
const commentFileMetaDownloadSearch = gql`
${fileMetaFragment}
query hashFileMetaDownloadQuery($operation_id: Int!, $comment: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filemeta_aggregate(distinct_on: id, where: {host: {_ilike: $host}, comment: {_ilike: $comment}, operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: false}}) {
      aggregate {
        count
      }
    }
    filemeta(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, comment: {_ilike: $comment}, operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: false}}) {
      ...filemetaData
    }
  }
`;
const commentFileBrowserSearch = gql`
${fileBrowserFragment}
query filenameFileBrowserQuery($operation_id: Int!, $comment: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filebrowserobj_aggregate(distinct_on: id, where: {comment: {_ilike: $comment}, host: {_ilike: $host}, operation_id: {_eq: $operation_id}}) {
      aggregate {
        count
      }
    }
    filebrowserobj(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, comment: {_ilike: $comment}, operation_id: {_eq: $operation_id}}) {
      ...filebrowserData
    }
  }
`;
const filenameFileMetaScreenshotSearch = gql`
${fileMetaFragment}
query filenameFileMetaScreenshotQuery($operation_id: Int!, $filename: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filemeta_aggregate(distinct_on: id, where: {host: {_ilike: $host}, _and: [{_or: [{filename_text: {_ilike: $filename}}, {full_remote_path_text: {_ilike: $filename}}]}, {_or: [{task_id: {_is_null: false}}, {is_payload: {_eq: false}}]}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: true},task_id: {_is_null: false}}) {
      aggregate {
        count
      }
    }
    filemeta(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, _and: [{_or: [{filename_text: {_ilike: $filename}}, {full_remote_path_text: {_ilike: $filename}}]}, {_or: [{task_id: {_is_null: false}}, {is_payload: {_eq: false}}]}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: true}}) {
      ...filemetaData
    }
  }
`;
const hashFileMetaScreenshotSearch = gql`
${fileMetaFragment}
query hashFileMetaScreenshotQuery($operation_id: Int!, $hash: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filemeta_aggregate(distinct_on: id, where: {host: {_ilike: $host}, _and: [{_or: [{md5: {_ilike: $hash}}, {sha1: {_ilike: $hash}}]}, {_or: [{task_id: {_is_null: false}}, {is_payload: {_eq: false}}]}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: true}}) {
      aggregate {
        count
      }
    }
    filemeta(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, _and: [{_or: [{md5: {_ilike: $hash}}, {sha1: {_ilike: $hash}}]}, {_or: [{task_id: {_is_null: false}}, {is_payload: {_eq: false}}]}], operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: true}}) {
      ...filemetaData
    }
  }
`;
const commentFileMetaScreenshotSearch = gql`
${fileMetaFragment}
query commentFileMetaScreenshotQuery($operation_id: Int!, $comment: String!, $host: String!, $offset: Int!, $fetchLimit: Int!) {
    filemeta_aggregate(distinct_on: id, where: {host: {_ilike: $host}, comment: {_ilike: $comment}, operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: true}}) {
      aggregate {
        count
      }
    }
    filemeta(limit: $fetchLimit, distinct_on: id, offset: $offset, order_by: {id: desc}, where: {host: {_ilike: $host}, comment: {_ilike: $comment}, operation_id: {_eq: $operation_id}, is_download_from_agent: {_eq: true}, is_screenshot: {_eq: true}}) {
      ...filemetaData
    }
  }
`;
export function SearchTabFilesLabel(props){
    return (
        <MythicSearchTabLabel label={"Files"} iconComponent={<AttachmentIcon />} {...props}/>
    )
}

const SearchTabFilesSearchPanel = (props) => {
    const theme = useTheme();
    const [searchHost, setSearchHost] = React.useState("");
    const [search, setSearch] = React.useState("");
    const [searchField, setSearchField] = React.useState("Filename");
    const searchFieldOptions = ["Filename", "Hash", "Comment"];
    const [searchLocation, setSearchLocation] = React.useState("Downloads");
    const searchLocationOptions = ["Uploads", "Downloads", "FileBrowser", "Screenshots"];
    const [parsedSearch, setParsedSearch] = React.useState(false);
    const handleSearchFieldChange = (event) => {
        setSearchField(event.target.value);
        props.onChangeSearchField(event.target.value);
        props.changeSearchParam("searchField", event.target.value);
    }
    const handleSearchLocationChange = (event) => {
        setSearchLocation(event.target.value);
        props.onChangeSearchLocation(event.target.value);
        props.changeSearchParam("location", event.target.value);
    }
    const handleSearchValueChange = (name, value, error) => {
        setSearch(value);
    }
    const handleSearchHostValueChange = (name, value, error) => {
        setSearchHost(value);
    }
    const submitSearch = (event, querySearch, querySearchHost, querySearchField, querySearchLocation) => {
        let adjustedSearchField = querySearchField ? querySearchField : searchField;
        let adjustedSearch = querySearch ? querySearch : search;
        let adjustedSearchHost = querySearchHost ? querySearchHost : searchHost;
        let adjustedSearchLocation = querySearchLocation ? querySearchLocation : searchLocation;
        props.changeSearchParam("host", adjustedSearchHost);
        props.changeSearchParam("search", adjustedSearch);
        switch(adjustedSearchField){
            case "Filename":
                props.onFilenameSearch({search:adjustedSearch, searchHost:adjustedSearchHost, offset: 0, adjustedSearchLocation})
                break;
            case "Hash":
                props.onHashSearch({search:adjustedSearch, searchHost:adjustedSearchHost, offset: 0, adjustedSearchLocation})
                break;
            case "Comment":
                props.onCommentSearch({search:adjustedSearch, searchHost:adjustedSearchHost, offset: 0, adjustedSearchLocation})
                break;
            default:
                break;
        }
    }
    const uploadFile = (file) => {
        try {
            let xhr = new XMLHttpRequest();
            let fd = new FormData();
            xhr.open("POST", window.location.origin + "/api/v1.4/files/manual", true);
            //xhr.withCredentials = true;
            xhr.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("access_token"));
            //xhr.setRequestHeader("refresh_token", localStorage.getItem("refresh_token"));
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try{
                        let response = JSON.parse(xhr.responseText);
                        if(response["status"] === "success"){
                            snackActions.success("Successfuly hosted file! Now searchable on the 'Uploads' search");
                        }else{
                            snackActions.error("Failed to host file! " + response["error"]);
                        }
                    }catch(error){
                        snackActions.error("Failed to process response from upload: " + error);
                        console.log(error);
                    }
                } else if (xhr.readyState === 4 && (xhr.status === 302 || xhr.status === 405)) {
                    // either got redirected or try to post/put to a bad path
                    console.log("httpGetAsync was 302 or 405 from url ");
                    snackActions.error("Got HTTP 302 or 405 when trying to host file");
                } else if (xhr.readyState === 4) {
                    console.log("httpGetAsync Error with data: " + fd);
                    snackActions.error("Mythic hit an error trying to hos the file: " + xhr.status + ": " + xhr.statusText);
                }
            };
            fd.append("upload_file", file);
            xhr.send(fd);
        } catch (error) {
            snackActions.error("HTTP Browser error trying to upload file: " + error.toString());
            console.error("HTTP Browser error: " + error.toString());
        }
    
    }
    const onFileChange = (evt) => {  
        uploadFile(evt.target.files[0]);
    }
    React.useEffect(() => {
        if(props.value === props.index){
            let queryParams = new URLSearchParams(window.location.search);
            let adjustedSearch = "";
            let adjustedSearchHost = "";
            let adjustedSearchField = "Filename";
            let adjustedSearchLocation = "Downloads";
            if(queryParams.has("search")){
                setSearch(queryParams.get("search"));
                adjustedSearch = queryParams.get("search");
            }
            if(queryParams.has("searchField") && searchFieldOptions.includes(queryParams.get("searchField"))){
                setSearchField(queryParams.get("searchField"));
                props.onChangeSearchField(queryParams.get("searchField"));
                adjustedSearchField = queryParams.get("searchField");
            }else{
                setSearchField("Filename");
                props.onChangeSearchField("Filename");
                props.changeSearchParam("searchField", "Filename");
            }
            if(queryParams.has("location") && searchLocationOptions.includes(queryParams.get("location"))){
                setSearchLocation(queryParams.get("location"));
                adjustedSearchLocation = queryParams.get("location");
                props.onChangeSearchLocation(queryParams.get("location"));
            }
            if(queryParams.has("host")){
                setSearchHost(queryParams.get("host"));
                adjustedSearchHost = queryParams.get("host")
            }
            setParsedSearch(!parsedSearch);
            submitSearch(null, adjustedSearch, adjustedSearchHost, adjustedSearchField, adjustedSearchLocation);
        }
    }, [props.value, props.index]);
    return (
        <Grid container spacing={1} style={{paddingTop: "10px", paddingLeft: "10px", maxWidth: "100%"}}>
            <Grid item xs={2}>
                <MythicTextField placeholder="Host Name Search..." value={searchHost}
                    onChange={handleSearchHostValueChange} onEnter={submitSearch} name="Host Name Search..." />
            </Grid>
            <Grid item xs={3}>
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
                    style={{marginBottom: "10px", width: "100%"}}
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
                <Select
                    style={{marginBottom: "10px", width: "100%"}}
                    value={searchLocation}
                    onChange={handleSearchLocationChange}
                >
                    {
                        searchLocationOptions.map((opt, i) => (
                            <MenuItem key={"searchlocopt" + opt} value={opt}>{opt}</MenuItem>
                        ))
                    }
                </Select>
            </Grid>
            <Grid item xs={2}>
                <Button variant="contained" color="primary" component="label">Host File in Mythic <input onChange={onFileChange} type="file" hidden /></Button>
            </Grid>
        </Grid>
    );
}

export const SearchTabFilesPanel = (props) =>{
    const [fileMetaData, setFileMetaData] = React.useState([]);
    const [fileBrowserData, setFileBrowserData] = React.useState([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const [searchHost, setSearchHost] = React.useState("");
    const [searchField, setSearchField] = React.useState("Filename");
    const [searchLocation, setSearchLocation] = React.useState("Downloads");
    const me = MeHook();
    const onChangeSearchField = (field) => {
        setSearchField(field);
        switch(field){
            case "Filename":
                onFilenameSearch({search, searchHost, offset: 0, adjustedSearchLocation: searchLocation});
                break;
            case "Hash":
                onHashSearch({search, searchHost, offset: 0, adjustedSearchLocation: searchLocation});
                break;
            case "Comments":
                onCommentSearch({search, searchHost, offset: 0, adjustedSearchLocation: searchLocation});
                break;
            default:
                break;
        }
    }
    const onChangeSearchLocation = (field) => {
        setSearchLocation(field);
        switch(searchField){
            case "Filename":
                onFilenameSearch({search, searchHost, offset: 0, adjustedSearchLocation: field});
                break;
            case "Hash":
                onHashSearch({search, searchHost, offset: 0, adjustedSearchLocation: field});
                break;
            case "Comments":
                onCommentSearch({search, searchHost, offset: 0, adjustedSearchLocation: field});
                break;
            default:
                break;
        }
    }
    const handleFileMetaSearchResults = (data) => {
        snackActions.dismiss();
        setTotalCount(data.filemeta_aggregate.aggregate.count);
        setFileBrowserData([]);
        setFileMetaData(data.filemeta);
    }
    const handleFileBrowserSearchResults = (data) => {
        snackActions.dismiss();
        setTotalCount(data.filebrowserobj_aggregate.aggregate.count);
        setFileBrowserData(data.filebrowserobj);
        setFileMetaData([]);
    }
    const handleCallbackSearchFailure = (data) => {
        snackActions.dismiss();
        snackActions.error("Failed to fetch data for search");
        console.log(data);
    }
    const [getfilenameFileMetaUploadSearch] = useLazyQuery(filenameFileMetaUploadSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileMetaSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getfilenameFileMetaDownloadSearch] = useLazyQuery(filenameFileMetaDownloadSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileMetaSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getfilenameFileBrowserSearch] = useLazyQuery(filenameFileBrowserSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileBrowserSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getfilenameFileMetaScreenshotSearch] = useLazyQuery(filenameFileMetaScreenshotSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileMetaSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [gethashFileMetaUploadSearch] = useLazyQuery(hashFileMetaUploadSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileMetaSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [gethashFileMetaDownloadSearch] = useLazyQuery(hashFileMetaDownloadSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileMetaSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [gethashFileMetaScreenshotSearch] = useLazyQuery(hashFileMetaScreenshotSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileMetaSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getcommentFileMetaUploadSearch] = useLazyQuery(commentFileMetaUploadSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileMetaSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getcommentFileMetaDownloadSearch] = useLazyQuery(commentFileMetaDownloadSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileMetaSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getcommentFileBrowserSearch] = useLazyQuery(commentFileBrowserSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileBrowserSearchResults,
        onError: handleCallbackSearchFailure
    })
    const [getcommentFileMetaScreenshotSearch] = useLazyQuery(commentFileMetaScreenshotSearch, {
        fetchPolicy: "no-cache",
        onCompleted: handleFileMetaSearchResults,
        onError: handleCallbackSearchFailure
    })
    const onFilenameSearch = ({search, searchHost, offset, adjustedSearchLocation}) => {
        //snackActions.info("Searching...", {persist:true});
        setSearch(search);
        setSearchHost(searchHost);
        if(adjustedSearchLocation === "FileBrowser"){
            getfilenameFileBrowserSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                filename: "%" + search + "%",
                host: "%" + searchHost + "%"
            }})
        }else if(adjustedSearchLocation === "Uploads"){
            getfilenameFileMetaUploadSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                filename: "%" + search + "%",
                host: "%" + searchHost + "%"
            }})
        }else if(adjustedSearchLocation === "Downloads"){
            getfilenameFileMetaDownloadSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                filename: "%" + search + "%",
                host: "%" + searchHost + "%"
            }})
        }else{
            getfilenameFileMetaScreenshotSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                filename: "%" + search + "%",
                host: "%" + searchHost + "%"
            }})
        }
    }
    const onHashSearch = ({search, searchHost, offset, adjustedSearchLocation}) => {
        //snackActions.info("Searching...", {persist:true});
        setSearch(search);
        setSearchHost(searchHost);
        if(adjustedSearchLocation === "FileBrowser"){
            snackActions.dismiss();
            snackActions.warning("FileBrowser doesn't currently track file hashes");
            setTotalCount(0);
            setFileBrowserData([]);
            setFileMetaData([]);
        }else if(adjustedSearchLocation === "Uploads"){
            gethashFileMetaUploadSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                hash: "%" + search + "%",
                host: "%" + searchHost + "%"
            }})
        }else if(adjustedSearchLocation === "Downloads"){
            gethashFileMetaDownloadSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                hash: "%" + search + "%",
                host: "%" + searchHost + "%"
            }})
        }else{
            gethashFileMetaScreenshotSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                hash: "%" + search + "%",
                host: "%" + searchHost + "%"
            }})
        }
    }
    const onCommentSearch = ({search, searchHost, offset, adjustedSearchLocation}) => {
        //snackActions.info("Searching...", {persist:true});
        let new_search = search;
        if(search === ""){
            new_search = "_";
        }
        setSearch(new_search);
        setSearchHost(searchHost);
        if(adjustedSearchLocation === "FileBrowser"){
            getcommentFileBrowserSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                comment: "%" + new_search + "%",
                host: "%" + searchHost + "%"
            }})
        }else if(adjustedSearchLocation === "Uploads"){
            getcommentFileMetaUploadSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                comment: "%" + new_search + "%",
                host: "%" + searchHost + "%"
            }})
        }else if(adjustedSearchLocation === "Downloads"){
            getcommentFileMetaDownloadSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                comment: "%" + new_search + "%",
                host: "%" + searchHost + "%"
            }})
        }else{
            getcommentFileMetaScreenshotSearch({variables:{
                operation_id: me?.user?.current_operation_id || 0,
                offset: offset,
                fetchLimit: fetchLimit,
                comment: "%" + new_search + "%",
                host: "%" + searchHost + "%"
            }})
        }
    }
    const onChangePage = (event, value) => {

        switch(searchField){
            case "Filename":
                onFilenameSearch({search: search, searchHost:searchHost, offset: (value - 1) * fetchLimit, adjustedSearchLocation: searchLocation});
                break;
            case "Hash":
                onHashSearch({search: search, searchHost:searchHost, offset: (value - 1) * fetchLimit, adjustedSearchLocation: searchLocation });
                break;
            case "Comments":
                onCommentSearch({search: search, searchHost:searchHost, offset: (value - 1) * fetchLimit, adjustedSearchLocation: searchLocation });
                break;
            default:
                break;
        }
    }
    
    return (
        <MythicTabPanel {...props} >
            <SearchTabFilesSearchPanel onChangeSearchField={onChangeSearchField} onFilenameSearch={onFilenameSearch} value={props.value} index={props.index} queryParams={props.queryParams}
                onHashSearch={onHashSearch} onCommentSearch={onCommentSearch} onChangeSearchLocation={onChangeSearchLocation} changeSearchParam={props.changeSearchParam}/>
            <div style={{overflowY: "auto", flexGrow: 1}}>
                {fileMetaData.length > 0 ? (
                    searchLocation === "Uploads" ? (<FileMetaUploadTable files={fileMetaData} />) : (searchLocation === "Downloads" ? (<FileMetaDownloadTable files={fileMetaData} />) : (<FileMetaScreenshotTable files={fileMetaData} />))
                ) : (fileBrowserData.length > 0 ? (<FileBrowserTable files={fileBrowserData} />) : (
                    <div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", left: "50%", top: "50%"}}>No Search Results</div>
                ))}
            </div>
            <div style={{background: "transparent", display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Pagination count={Math.ceil(totalCount / fetchLimit)} variant="outlined" color="primary" boundaryCount={1}
                    siblingCount={1} onChange={onChangePage} showFirstButton={true} showLastButton={true} style={{padding: "20px"}}/>
                <Typography style={{paddingLeft: "10px"}}>Total Results: {totalCount}</Typography>
            </div>
        </MythicTabPanel>
    )
}