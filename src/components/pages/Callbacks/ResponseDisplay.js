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
import SearchIcon from '@material-ui/icons/Search';
import {useTheme} from '@material-ui/core/styles';
import { IconButton } from '@material-ui/core';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';


const subResponsesQuery = gql`
subscription subResponsesQuery($task_id: Int!, $fetchLimit: Int!) {
  response(where: {task_id: {_eq: $task_id}}, limit: $fetchLimit, order_by: {id: desc}) {
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

export const ResponseDisplay = (props) =>{
    const theme = useTheme();
    const [viewBrowserScript, setViewBrowserScript] = React.useState(true);
    const [output, setOutput] = React.useState("");
    const [rawResponses, setRawResponses] = React.useState([]);
    const [browserScriptData, setBrowserScriptData] = React.useState({});
    const script = React.useRef();
    const me = useReactiveVar(meState);
    const [highestFetched, setHighestFetched] = React.useState(0);
    const [totalFetched, setTotalFetched] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const [selectAllOutput, setSelectAllOutput] = React.useState(false);
    useSubscription(subResponsesQuery, {variables: {task_id: props.task.id, fetchLimit: props.fetchLimit}, fetchPolicy: "network_only",
    onSubscriptionData: ({subscriptionData}) => {
      if(totalFetched === 0 && subscriptionData.data.response.length === props.fetchLimit){
        fetchMoreResponses({variables: {task_id: props.task.id, fetchLimit: props.fetchLimit, offset: 0, search: "%_%"}});
        return;
      }else if(totalFetched >= props.fetchLimit){
        // we won't display it
        console.log("got more than we can see currently");
        return;
      }else 
      // we still have some room to view more, but only room for fetchLimit - totalFetched 
      if(subscriptionData.data.response.length > 0){
        const newResponses = subscriptionData.data.response.filter( r => r.id > highestFetched);
        const newerResponses = newResponses.map( (r) => { return {...r, response: String(Buffer.from(r.response,"base64"))}});
        newerResponses.sort( (a,b) => a.id > b.id ? 1 : -1);
        let outputResponses = output;
        let rawResponseArray = [...rawResponses];
        let highestFetchedId = highestFetched;
        let totalFetchedSoFar = totalFetched;
        for(let i = 0; i < newerResponses.length; i++){
          if(totalFetchedSoFar < props.fetchLimit){
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
        setHighestFetched(highestFetchedId);
        setTotalFetched(totalFetchedSoFar);
      }
    }
    });
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
        setViewBrowserScript(props.viewBrowserScript);
        if(props.viewBrowserScript && script.current !== undefined){
          try{
            let res = script.current(props.task, rawResponses);
            setBrowserScriptData(filterOutput(res));
          }catch(error){
            setViewBrowserScript(false);
          }
            
        }
      }
    }, [props.viewBrowserScript]);
    const [fetchScripts] = useLazyQuery(taskScript, {
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        if(data.browserscriptoperation.length > 0){
          try{
            let unb64script = Buffer.from(data.browserscriptoperation[0]["script"], "base64");
            let fun = Function('"use strict";return(' + unb64script + ')')();
            script.current = fun;
            setViewBrowserScript(true);
            let res = script.current(props.task, rawResponses);
            setBrowserScriptData(filterOutput(res));
          }catch(error){
            snackActions.error(error.toString());
            console.log(error);
            setViewBrowserScript(false);
          }
          
        }else if(data.browserscript.length > 0){
          try{
            let unb64script = Buffer.from(data.browserscript[0]["script"], "base64");
            let fun = Function('"use strict";return(' + unb64script + ')')();
            script.current = fun;
            setViewBrowserScript(true);
            console.log(rawResponses);
            let res = script.current(props.task, rawResponses);
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
    const [fetchMoreResponses] = useLazyQuery(getResponsesLazyQuery, {
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        const responses = data.response.reduce( (prev, cur) => {
          return prev + Buffer.from(cur.response, "base64");
        }, "");
        const maxID = data.response.reduce( (prev, cur) => {
          if(cur.id > prev){
            return cur.id;
          }
          return prev;
        }, highestFetched);
        setHighestFetched(maxID);
        setOutput(responses);
        const responseArray = data.response.map( r => String(Buffer.from(r.response, "base64")));
        setRawResponses(responseArray);
        if(viewBrowserScript && script.current !== undefined){
          try{
            let res = script.current(props.task, responseArray);
            setBrowserScriptData(filterOutput(res));
          }catch(error){
            console.log(error);
            setViewBrowserScript(false);
          }
          
        }
        setTotalFetched(data.response.length);
        if(props.searchText !== "" || selectAllOutput){
          setSelectAllOutput(false);
          props.changeTotalCount(data.response_aggregate.aggregate.count);
        }
      },
      onError: (data) => {
        snackActions.error("Failed to fetch more responses: " + data)
      }
    })
    const [fetchAllResponses] = useLazyQuery(getAllResponsesLazyQuery, {
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        const responses = data.response.reduce( (prev, cur) => {
          return prev + Buffer.from(cur.response, "base64");
        }, "");
        const maxID = data.response.reduce( (prev, cur) => {
          if(cur.id > prev){
            return cur.id;
          }
          return prev;
        }, highestFetched);
        setHighestFetched(maxID);
        setOutput(responses);
        const responseArray = data.response.map( r => String(Buffer.from(r.response, "base64")));
        setRawResponses(responseArray);
        if(viewBrowserScript && script.current !== undefined){
          try{
            let res = script.current(props.task, responseArray);
            setBrowserScriptData(filterOutput(res));  
          }
          catch(error){
            setViewBrowserScript(false);
            console.log(error);
          }
        }
        setTotalFetched(data.response.length);
        props.changeTotalCount(0);
      },
      onError: (data) => {

      }
    })
    useEffect( () => {
      if(props.command_id !== undefined){
        fetchScripts({variables: {command_id: props.command_id, operator_id: me.user.user_id, operation_id: me.user.current_operation_id}});
      }
    }, [props.command_id]);
    useEffect( () => {
      if(script.current !== undefined){
        try{
          let res = script.current(props.task, rawResponses);
          setBrowserScriptData(filterOutput(res));
        }catch(error){
          setViewBrowserScript(false);
          console.log(error);
        }
        
      }
    }, [rawResponses]);
    useEffect( () => {
      if(props.searchText === undefined || props.searchText === ""){
        fetchMoreResponses({variables: {task_id: props.task.id, 
          fetchLimit: props.fetchLimit, 
          offset: props.fetchLimit * (props.currentPage - 1),
          search: "%_%"
        }})
      }else{  
        fetchMoreResponses({variables: {task_id: props.task.id, 
          fetchLimit: props.fetchLimit, 
          offset: props.fetchLimit * (props.currentPage - 1),
          search: "%" +  props.searchText + "%"
        }})
      }
      
    }, [props.currentPage]);
    useEffect( () => {
      if(props.searchText === undefined || props.searchText === ""){
        fetchMoreResponses({variables: {task_id: props.task.id, 
          fetchLimit: props.fetchLimit, 
          offset: 0,
          search: "%_%"
        }})
      }else{  
        fetchMoreResponses({variables: {task_id: props.task.id, 
          fetchLimit: props.fetchLimit, 
          offset: 0,
          search: "%" + props.searchText + "%"
        }})
      }
    }, [props.searchText]);
    useEffect( () => {
      if(props.selectAllOutput){
        setSelectAllOutput(true);
        fetchAllResponses({variables: {task_id: props.task.id, search: "%" + props.searchText + "%"}})
      }else{
        setHighestFetched(0);
        setTotalFetched(0);
        fetchMoreResponses({variables: {task_id: props.task.id, fetchLimit: props.fetchLimit, offset: 0, search: "%" + props.searchText + "%"}})
      }
    }, [props.selectAllOutput]);
    const onSubmitSearch = React.useCallback( () => {
      props.onSubmitSearch(search)
    }, [search]);

  return (
    <React.Fragment>
      {props.searchOutput &&
        <MythicTextField value={search} autoFocus onEnter={onSubmitSearch} onChange={(n,v,e) => setSearch(v)} placeholder="Search Output of This Task" name="Search..."
          InputProps={{
            endAdornment: 
            <React.Fragment>
                <MythicStyledTooltip title="Search">
                    <IconButton onClick={onSubmitSearch}><SearchIcon style={{color: theme.palette.info.main}}/></IconButton>
                </MythicStyledTooltip>
            </React.Fragment>,
            style: {padding: 0}
        }}
        ></MythicTextField>
      }
      <div style={{overflow: "auto", maxWidth: "100%", width: "100%"}}>
        {viewBrowserScript && browserScriptData ? (
          <React.Fragment>
              {browserScriptData?.screenshot?.map( (scr, index) => (
                  <ResponseDisplayScreenshot key={"screenshot" + index + 'fortask' + props.task.id} {...scr} />
                )) || null
              }
              {browserScriptData?.plaintext &&
                <ResponseDisplayPlaintext plaintext={browserScriptData["plaintext"]} />
              }
              {browserScriptData?.table?.map( (table, index) => (
                  <ResponseDisplayTable callback_id={props.task.callback_id} table={table} key={"tablefortask" + props.task.id + "table" + index} />
                )) || null
              }
              {browserScriptData?.download?.map( (dl, index) => (
                  <ResponseDisplayDownload download={dl} key={"download" + index + "fortask" + props.task.id} />
                )) || null
              }
              {browserScriptData?.search?.map( (s, index) => (
                  <ResponseDisplaySearch search={s} key={"searchlink" + index + "fortask" + props.task.id} />
              )) || null
              }
          </React.Fragment>
        ) : (
          <ResponseDisplayPlaintext plaintext={output} />
        )}
      </div>
  </React.Fragment>
  )
      
}
