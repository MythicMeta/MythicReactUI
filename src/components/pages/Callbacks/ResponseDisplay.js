import React, {useEffect} from 'react';
import {useSubscription, gql, useLazyQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import { meState } from '../../../cache';
import { snackActions } from '../../utilities/Snackbar';
import {ResponseDisplayScreenshot} from './ResponseDisplayScreenshot';
import {ResponseDisplayPlaintext} from './ResponseDisplayPlaintext';
import {ResponseDisplayTable} from './ResponseDisplayTable';
import {ResponseDisplayDownload} from './ResponseDisplayDownload';
import {ResponseDisplaySearch} from './ResponseDisplaySearch';
import MythicTextField from '../../MythicComponents/MythicTextField';
import SearchIcon from '@mui/icons-material/Search';
import {useTheme} from '@mui/material/styles';
import { IconButton } from '@mui/material';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import Pagination from '@mui/material/Pagination';
import { Typography } from '@mui/material';
import { Backdrop } from '@mui/material';
import { CircularProgress } from '@mui/material';


const subResponsesQuery = gql`
subscription subResponsesQuery($task_id: Int!, $fetchLimit: Int!) {
  response(where: {task_id: {_eq: $task_id}}, limit: $fetchLimit, order_by: {id: asc}) {
    id
    response: response_text
  }
}`;
const getResponsesLazyQuery = gql`
query subResponsesQuery($task_id: Int!, $fetchLimit: Int!, $offset: Int!, $search: String!) {
  response(where: {task_id: {_eq: $task_id}, response_escape: {_ilike: $search}}, limit: $fetchLimit, offset: $offset, order_by: {id: asc}) {
    id
    response: response_text
  }
  response_aggregate(where: {task_id: {_eq: $task_id}, response_escape: {_ilike: $search}}){
    aggregate{
      count
    }
  }
}`;
const getMaxCountQuery = gql`
subscription responseTotalCountSubscription($task_id: Int!){
  response_aggregate(where: {task_id: {_eq: $task_id}}){
    aggregate{
      count
    }
  }
}
`;
const getAllResponsesLazyQuery = gql`
query subResponsesQuery($task_id: Int!, $search: String!) {
  response(where: {task_id: {_eq: $task_id}, response_escape: {_ilike: $search}}, order_by: {id: asc}) {
    id
    response: response_text
  }
  response_aggregate(where: {task_id: {_eq: $task_id}, response_escape: {_ilike: $search}}){
    aggregate{
      count
    }
  }
}`;
const taskScript = gql`
query getBrowserScriptsQuery($command_id: Int!, $operator_id: Int!, $operation_id: Int!){
  browserscript(where: {active: {_eq: true}, command_id: {_eq: $command_id}, for_new_ui: {_eq: true}, operator_id: {_eq: $operator_id}}) {
    script
    id
  }
  browserscriptoperation(where: {operation_id: {_eq: $operation_id}, browserscript: {active: {_eq: true}, command_id: {_eq: $command_id}, for_new_ui: {_eq: true}}}) {
    browserscript {
      script
      id
    }
  }
}

`;
const fetchLimit = 10;
// the base64 decode function to handle unicode was pulled from the following stack overflow post
// https://stackoverflow.com/a/30106551
function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}
export const ResponseDisplay = (props) =>{
    const [output, setOutput] = React.useState("");
    const [rawResponses, setRawResponses] = React.useState([]);
    const highestFetched = React.useRef(0);
    const [search, setSearch] = React.useState("");
    const [totalCount, setTotalCount] = React.useState(0);
    const oldSelectAllOutput = React.useRef(props.selectAllOutput);
    const [openBackdrop, setOpenBackdrop] = React.useState(true);
    const mountedRef = React.useRef(true);
    const [fetchMoreResponses] = useLazyQuery(getResponsesLazyQuery, {
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        const responses = data.response.reduce( (prev, cur) => {
          return prev + b64DecodeUnicode(cur.response);
        }, b64DecodeUnicode(""));
        const maxID = data.response.reduce( (prev, cur) => {
          if(cur.id > prev){
            return cur.id;
          }
          return prev;
        }, highestFetched.current);
        highestFetched.current = maxID;
        setOutput(responses);
        const responseArray = data.response.map( r =>b64DecodeUnicode(r.response));
        setRawResponses(responseArray);
        if(!props.selectAllOutput){
          setTotalCount(data.response_aggregate.aggregate.count);
        }
        setOpenBackdrop(false);
      },
      onError: (data) => {
        snackActions.error("Failed to fetch more responses: " + data)
      }
    });
    const [fetchAllResponses] = useLazyQuery(getAllResponsesLazyQuery, {
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        const responses = data.response.reduce( (prev, cur) => {
          return prev + b64DecodeUnicode(cur.response);
        }, b64DecodeUnicode(""));
        const maxID = data.response.reduce( (prev, cur) => {
          if(cur.id > prev){
            return cur.id;
          }
          return prev;
        }, highestFetched.current);
        highestFetched.current = maxID;
        setOutput(responses);
        const responseArray = data.response.map( r => b64DecodeUnicode(r.response));
        setRawResponses(responseArray);
        setTotalCount(1);
        setOpenBackdrop(false);
      },
      onError: (data) => {

      }
    });
    React.useEffect( () => {
      return() => {
        mountedRef.current = false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    React.useEffect( () => {
      if(props.selectAllOutput !== oldSelectAllOutput.current){
        if(props.selectAllOutput){
          setOpenBackdrop(true);
          if(search === ""){
            fetchAllResponses({variables: {task_id: props.task.id, search: "%%"}})
          }else{
            fetchAllResponses({variables: {task_id: props.task.id, search: "%" + search + "%"}})
          }
        }
      }
    }, [props.selectAllOutput, oldSelectAllOutput]);
    
    const subscriptionDataCallback = React.useCallback( ({subscriptionData}) => {
      console.log("fetchLimit", fetchLimit, "totalCount", totalCount);
      if(!mountedRef.current){
        return null; // we're unmounted, so just exit
      }
      if(totalCount >= fetchLimit){
        // we won't display it   
        console.log("got more than we can see currently", totalCount);
        return;
      }
      // we still have some room to view more, but only room for fetchLimit - totalFetched.current
      setOpenBackdrop(false);
      if(subscriptionData.data.response.length > 0){
        const newResponses = subscriptionData.data.response.filter( r => r.id > highestFetched.current);
        const newerResponses = newResponses.map( (r) => { return {...r, response: b64DecodeUnicode(r.response)}});
        newerResponses.sort( (a,b) => a.id > b.id ? 1 : -1);
        let outputResponses = output;
        let rawResponseArray = [...rawResponses];
        let highestFetchedId = highestFetched.current;
        let totalFetchedSoFar = totalCount;
        for(let i = 0; i < newerResponses.length; i++){
          if(totalFetchedSoFar < fetchLimit){
            outputResponses += newerResponses[i]["response"];
            rawResponseArray.push(newerResponses[i]["response"]);
            highestFetchedId = newerResponses[i]["id"];
            totalFetchedSoFar += 1;
          }else{
            break;
          }
        }
        setOutput(outputResponses);
        setRawResponses(rawResponseArray);
        highestFetched.current = highestFetchedId;
      } 
    }, [setOutput, output, setRawResponses, highestFetched.current, rawResponses, totalCount]);
    
    useSubscription(subResponsesQuery, {variables: {task_id: props.task.id, fetchLimit: fetchLimit}, fetchPolicy: "network_only",
      onSubscriptionData: subscriptionDataCallback
    });
    
    const onSubmitPageChange = (currentPage) => {
      if(!props.selectAllOutput){
        setOpenBackdrop(true);
        if(search === undefined || search === ""){
          fetchMoreResponses({variables: {task_id: props.task.id, 
            fetchLimit: fetchLimit, 
            offset: fetchLimit * (currentPage - 1),
            search: "%_%"
          }})
        }else{  
          fetchMoreResponses({variables: {task_id: props.task.id, 
            fetchLimit: fetchLimit, 
            offset: fetchLimit * (currentPage - 1),
            search: "%" +  search + "%"
          }})
        }  
      }
      
    }
    const onSubmitSearch = React.useCallback( (newSearch) => {
      setSearch(newSearch);
      setOpenBackdrop(true);
      if(newSearch === undefined || newSearch === ""){
        if(props.selectAllOutput){
          fetchAllResponses({variables: {task_id: props.task.id, search: "%%"}})
        }else{
          fetchMoreResponses({variables: {task_id: props.task.id, 
            fetchLimit: fetchLimit, 
            offset: 0,
            search: "%_%"
          }})
        }
        
      }else{  
        if(props.selectAllOutput){
          fetchAllResponses({variables: {task_id: props.task.id, search: "%" + newSearch + "%"}})
        }else{
          fetchMoreResponses({variables: {task_id: props.task.id, 
            fetchLimit: fetchLimit, 
            offset: 0,
            search: "%" + newSearch + "%"
          }})
        }
        
      }
    }, []);
    
  return (
    <React.Fragment>
      <Backdrop open={openBackdrop} onClick={()=>{setOpenBackdrop(false);}} style={{zIndex: 2, position: "absolute"}}>
        <CircularProgress color="inherit" disableShrink  />
      </Backdrop>
      {props.searchOutput &&
       <SearchBar onSubmitSearch={onSubmitSearch} />
      }
      <div style={{overflow: "auto", maxWidth: "100%", width: "100%"}}>
        <ResponseDisplayComponent rawResponses={rawResponses} viewBrowserScript={props.viewBrowserScript} output={output} command_id={props.command_id} task={props.task} search={search}/>
      </div>
      <PaginationBar selectAllOutput={props.selectAllOutput} totalCount={totalCount} onSubmitPageChange={onSubmitPageChange} task={props.task} search={search} parentMountedRef={mountedRef} />
  </React.Fragment>
  )
      
}

const PaginationBar = ({selectAllOutput, totalCount, onSubmitPageChange, task, search, parentMountedRef}) => {
  const [localTotalCount, setTotalcount] = React.useState(0);
  const [maxCount, setMaxCount] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const mountedRef = React.useRef(true);
  const subscriptionMaxCountCallback = React.useCallback( ({subscriptionData}) => {
    if(!mountedRef.current || !parentMountedRef.current){
      return;
    }
    setMaxCount(subscriptionData.data.response_aggregate.aggregate.count);
  }, [maxCount]);
  useSubscription(getMaxCountQuery, {variables: {task_id: task.id},
    onSubscriptionData: subscriptionMaxCountCallback
  })
  const onChangePage =  (event, value) => {
    if(!mountedRef.current){
      return;
    }
    setCurrentPage(value);
    onSubmitPageChange(value);
  };
  React.useEffect( () => {
    return() => {
      mountedRef.current = false;
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])
  React.useEffect( () => {
    if(!mountedRef.current || !parentMountedRef.current){
      return;
    }
    if(selectAllOutput){
      setTotalcount(1);
      setCurrentPage(1);
    }else if(search === ""){
      setTotalcount(maxCount);
    }else{
      setTotalcount(totalCount);
    }
  }, [totalCount, maxCount, search, selectAllOutput]);
  
  return (
    <div style={{background: "transparent", display: "flex", justifyContent: "center", alignItems: "center", paddingBottom: "10px"}} >
      <Pagination count={Math.ceil(localTotalCount / fetchLimit)} page={currentPage} variant="outlined" color="primary" boundaryCount={2} onChange={onChangePage} style={{margin: "10px"}}/>
      <Typography style={{paddingLeft: "10px"}}>Total Results: {localTotalCount}</Typography>
    </div>
  )
}

const SearchBar = ({onSubmitSearch}) => {
  const theme = useTheme();
  const [search, setSearch] = React.useState("");
  const onSubmitLocalSearch = () => {
    onSubmitSearch(search);
  }
  return (
    <div style={{marginTop: "5px"}}>
      <MythicTextField value={search} autoFocus onEnter={onSubmitLocalSearch} onChange={(n,v,e) => setSearch(v)} placeholder="Search Output of This Task" name="Search..."
        InputProps={{
          endAdornment: 
          <React.Fragment>
              <MythicStyledTooltip title="Search">
                  <IconButton onClick={onSubmitLocalSearch} size="large"><SearchIcon style={{color: theme.palette.info.main}}/></IconButton>
              </MythicStyledTooltip>
          </React.Fragment>,
          style: {padding: 0}
      }}
      ></MythicTextField>
    </div>
  );
}

const ResponseDisplayComponent = ({rawResponses, viewBrowserScript, output, command_id, task, search}) => {
  const [localViewBrowserScript, setViewBrowserScript] = React.useState(true);
  const [browserScriptData, setBrowserScriptData] = React.useState({});
  const script = React.useRef();
  const me = useReactiveVar(meState);
  useEffect( () => {
    if(script.current !== undefined){
      try{
        let res = script.current(task, rawResponses);
        setBrowserScriptData(filterOutput(res));
      }catch(error){
        setViewBrowserScript(false);
        console.log(error);
      }
      
    }
  }, [rawResponses]);
  const filterOutput = (scriptData) => {
    let copied = {...scriptData};
    if(search === ""){
      return scriptData;
    }
    if(scriptData["plaintext"] !== undefined){
      if(!scriptData["plaintext"].includes(search)){
        copied["plaintext"] = "";
      }
    }
    if(scriptData["table"] !== undefined){
      if(scriptData["table"].length > 0){
        const tableUpdates = scriptData.table.map( t => {
          const filteredRows = t.rows.filter( r => {
            let foundMatch = false;
            for (const entry of Object.values(r)) {
              if(entry["plaintext"] !== undefined){
                if(String(entry["plaintext"]).includes(search)){foundMatch = true;}
              }
              if(entry["button"] !== undefined && entry["button"]["value"] !== undefined){
                if(JSON.stringify(entry["button"]["value"]).includes(search)){foundMatch = true;}
              }
            }
            return foundMatch;
          });
          return {...t, rows: filteredRows};
        });
        copied["table"] = tableUpdates;
      }
    }
    return copied;
  }
  useEffect( () => {
    if(script.current === undefined){
      setViewBrowserScript(false);
    }else{
      setViewBrowserScript(viewBrowserScript);
      if(viewBrowserScript && script.current !== undefined){
        try{
          let res = script.current(task, rawResponses);
          setBrowserScriptData(filterOutput(res));
        }catch(error){
          setViewBrowserScript(false);
        }
          
      }
    }
  }, [viewBrowserScript]);
  const [fetchScripts] = useLazyQuery(taskScript, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if(data.browserscriptoperation.length > 0){
        try{
          let unb64script = b64DecodeUnicode(data.browserscriptoperation[0]["script"]);
          let fun = Function('"use strict";return(' + unb64script + ')')();
          script.current = fun;
          setViewBrowserScript(true);
          let res = script.current(task, rawResponses);
          setBrowserScriptData(filterOutput(res));
        }catch(error){
          snackActions.error(error.toString());
          console.log(error);
          setViewBrowserScript(false);
        }
        
      }else if(data.browserscript.length > 0){
        try{
          let unb64script = b64DecodeUnicode(data.browserscript[0]["script"]);
          let fun = Function('"use strict";return(' + unb64script + ')')();
          script.current = fun;
          setViewBrowserScript(true);
          //console.log(rawResponses);
          let res = script.current(task, rawResponses);
          setBrowserScriptData(filterOutput(res));
        }catch(error){
          snackActions.error(error.toString());
          console.log(error);
          setViewBrowserScript(false);
        }
      }else{
        setViewBrowserScript(false);
      }
    },
    onError: (data) => {
      console.log(data);
    }
  });
  useEffect( () => {
    if(command_id !== undefined){
      fetchScripts({variables: {command_id: command_id, operator_id: me.user.user_id, operation_id: me.user.current_operation_id}});
    }
  }, [command_id]);
  return (
    localViewBrowserScript && browserScriptData ? (
      <React.Fragment>
          {browserScriptData?.screenshot?.map( (scr, index) => (
              <ResponseDisplayScreenshot key={"screenshot" + index + 'fortask' + task.id} {...scr} />
            )) || null
          }
          {browserScriptData?.plaintext &&
            <ResponseDisplayPlaintext plaintext={browserScriptData["plaintext"]} />
          }
          {browserScriptData?.table?.map( (table, index) => (
              <ResponseDisplayTable callback_id={task.callback_id} table={table} key={"tablefortask" + task.id + "table" + index} />
            )) || null
          }
          {browserScriptData?.download?.map( (dl, index) => (
              <ResponseDisplayDownload download={dl} key={"download" + index + "fortask" + task.id} />
            )) || null
          }
          {browserScriptData?.search?.map( (s, index) => (
              <ResponseDisplaySearch search={s} key={"searchlink" + index + "fortask" + task.id} />
          )) || null
          }
      </React.Fragment>
    ) : (
      <ResponseDisplayPlaintext plaintext={output} />
    )
  )
}