import React, {useState, useEffect} from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import {TaskParametersDialogRow} from './TaskParametersDialogRow';
import {useQuery, gql, useLazyQuery, useMutation } from '@apollo/client';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import {UploadTaskFile} from '../../MythicComponents/MythicFileUpload';
import { Backdrop } from '@material-ui/core';
import {CircularProgress} from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import {useTheme} from '@material-ui/core/styles';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';

//if we need to get all the loaded commands for the callback and filter, use this
const GetLoadedCommandsQuery = gql`
query GetLoadedCommandsQuery($callback_id: Int!) {
  loadedcommands(where: {callback_id: {_eq: $callback_id}}) {
    id
    command {
      cmd
      attributes
      id
    }
  }
}
`;
//if we need to get all the possible commands for a payload type and filter, use this
const getAllCommandsQuery = gql`
query getAllCommandsQuery($payload_type_id: Int!){
    command(where: {payload_type_id: {_eq: $payload_type_id}, deleted: {_eq: false}}) {
        attributes
        cmd
        id
    }
}
`;
//if we need to get all the possible edges for the callback, use this
const getAllEdgesQuery = gql`
query getAllEdgesQuery($callback_id: Int!){
    callbackgraphedge(where: {_or: [{source_id:{_eq: $callback_id}}, {destination_id: {_eq: $callback_id}}]}) {
        id
        c2profile {
          id
          name
        }
        direction
        destination{
            agent_callback_id
            host
            id
            payload {
              id
              uuid
            }
            c2profileparametersinstances {
              enc_key_base64
              dec_key_base64
              value
              id
              c2_profile_id
              c2profileparameter {
                crypto_type
                name
                id
              }
            }
        }
        source{
            agent_callback_id
            host
            id
            payload {
              uuid
              id
            }
            c2profileparametersinstances {
              enc_key_base64
              dec_key_base64
              c2_profile_id
              value
              id
              c2profileparameter {
                crypto_type
                name
                id
              }
            }
        }
        end_timestamp
      }
    }
`;
// get all payloads query
const getAllPayloadsQuery = gql`
query getAllPayloadsQuery($operation_id: Int!){
    payload(where: {deleted: {_eq: false}, build_phase: {_eq: "success"}, operation_id: {_eq: $operation_id}}) {
    id
    tag
    uuid
    payloadc2profiles {
      id
      c2profile {
        name
        id
        is_p2p
      }
    }
    payloadtype{
        id
        ptype
    }
    filemetum {
        id
        filename_text
    }
    buildparameterinstances {
      parameter
      id
      buildparameter {
        name
        id
      }
    }
  }
}
`;
// get all payloads on hosts
const getAllPayloadsOnHostsQuery = gql`
query getAllPayloadsOnHostsQuery($operation_id: Int!){
    payloadonhost(where: {deleted: {_eq: false}, operation_id: {_eq: $operation_id}, payload: {c2profileparametersinstances: {c2profile: {is_p2p: {_eq: true}}}}}) {
        host
        id
        payload {
            auto_generated
            id
            tag
            filemetum {
                filename_text
                id
            }
            uuid
            c2profileparametersinstances(where: {c2profile: {is_p2p: {_eq: true}}}) {
                c2profile {
                    name
                    id
                }
                c2profileparameter {
                    crypto_type
                    name
                    id
                }
                value
                enc_key_base64
                dec_key_base64
                id
            }
        }
    }
    callback(where: {active: {_eq: true}, operation_id: {_eq: $operation_id}, c2profileparametersinstances: {c2profile: {is_p2p: {_eq: true}}}}){
        agent_callback_id
        host
        id
        description
        crypto_type
        payload {
            auto_generated
            id
            tag
            filemetum {
                filename_text
                id
            }
            uuid
        }
        c2profileparametersinstances(where: {c2profile: {is_p2p: {_eq: true}}}) {
            c2profile {
                name
                id
            }
            c2profileparameter {
                crypto_type
                name
                id
            }
            value
            enc_key_base64
            dec_key_base64
            id
        }
    }
}
`;
// use this to add a payload on a host
const addPayloadOnHostMutation = gql`
    mutation addPayloadOnHostMutation($host: String!, $payload_id: Int!){
        insert_payloadonhost(objects: {host: $host, payload_id: $payload_id}) {
            affected_rows
          }
    }
`;
// use this to remove a payload on a host
const removePayloadOnHostMutation = gql`
    mutation removePayloadOnHostMutation($payloadOnHostID: Int!){
        delete_payloadonhost_by_pk(id: $payloadOnHostID) {
            id
          }
    }
`;
// use this to get all of the parameters and information for the command we're trying to execute
const getCommandQuery = gql`
query getCommandQuery($id: Int!){
  command_by_pk(id: $id) {
    attributes
    author
    cmd
    description
    help_cmd
    id
    needs_admin
    version
    payloadtype{
        ptype
    }
    commandparameters {
      choice_filter_by_command_attributes
      choices
      choices_are_all_commands
      choices_are_loaded_commands
      default_value
      description
      id
      name
      required
      supported_agent_build_parameters
      supported_agents
      type
      dynamic_query_function
      ui_position
      parameter_group_name
      display_name
      cli_name
    }
    commandopsec {
      authentication
      id
      injection_method
      process_creation
    }
  }
}
`;
// use this to get all of the credentials for the command we're trying to execute
const getCredentialsQuery = gql`
query getCredentialsQuery($operation_id: Int!){
    credential(where: {deleted: {_eq: false}, operation_id: {_eq: $operation_id}}){
        account
        comment
        credential_text
        id
        realm
        type
    }
}
`;
export function TaskParametersDialog(props) {
    const theme = useTheme();
    const [backdropOpen, setBackdropOpen] = React.useState(false);
    const [commandInfo, setCommandInfo] = useState({});
    const [parameterGroups, setParameterGroups] = useState([]);
    const [selectedParameterGroup, setSelectedParameterGroup] = useState('Default');
    const [parameters, setParameters] = useState([]);
    const [rawParameters, setRawParameters] = useState(false);
    const [requiredPieces, setRequiredPieces] = useState({all: false, loaded: false, edges: false, credentials: false});
    //get all the data about our command that we can
    const [getAllCommands, { data: allCommandsLoading}] = useLazyQuery(getAllCommandsQuery, {
        fetchPolicy: "no-cache"
    });
    const [getLoadedCommands, { data: loadedCommandsLoading}] = useLazyQuery(GetLoadedCommandsQuery, {
        fetchPolicy: "no-cache"
    });
    const [getAllEdges, { data: loadedAllEdgesLoading}] = useLazyQuery(getAllEdgesQuery, {
        fetchPolicy: "no-cache"
    });
    const [getAllPayloads, { data: loadedAllPayloadsLoading}] = useLazyQuery(getAllPayloadsQuery, {
        fetchPolicy: "no-cache"
    });
    const [getAllPayloadsOnHosts, { data: loadedAllPayloadsOnHostsLoading}] = useLazyQuery(getAllPayloadsOnHostsQuery, {
        fetchPolicy: "no-cache"
    });
    const [getAllCredentials, { data: loadedCredentialsLoading}] = useLazyQuery(getCredentialsQuery, {
        fetchPolicy: "no-cache"
    });
    const [addPayloadOnHost] = useMutation(addPayloadOnHostMutation, {
        onCompleted: data => {
            getAllPayloadsOnHosts({variables: {operation_id: props.operation_id}})
        }
    });
    const [RemovePayloadOnHost] = useMutation(removePayloadOnHostMutation, {
        onCompleted: data => {
            getAllPayloadsOnHosts({variables: {operation_id: props.operation_id}})
        }
    })
    useQuery(getCommandQuery, {
        variables: {id: props.command.id},
        fetchPolicy: "no-cache",
        onCompleted: data => {
            // do an initial pass to see what other quries we need to make
            let requiredPiecesInitial = {all: false, loaded: false, edges: false, credentials: false};
            let groupNames = [];
            data.command_by_pk.commandparameters.forEach( (cmd) => {
                if(!groupNames.includes(cmd.parameter_group_name)){
                    groupNames.push(cmd.parameter_group_name);
                }
                if(cmd.type === "LinkInfo"){
                    requiredPiecesInitial["edges"] = true;
                }else if(cmd.choices_are_all_commands){
                    requiredPiecesInitial["all"] = true;
                }else if(cmd.choices_are_loaded_commands){
                    requiredPiecesInitial["loaded"] = true;
                }else if(cmd.type === "AgentConnect"){
                    requiredPiecesInitial["connect"] = true;
                    //need payloads as well in case the user wants to add a payload to a host
                    requiredPiecesInitial["payloads"] = true;
                }else if(cmd.type === "PayloadList"){
                    requiredPiecesInitial["payloads"] = true;
                }else if(cmd.type.includes("Credential")){
                    requiredPiecesInitial["credentials"] = true;
                }
            });
            groupNames.sort();
            setParameterGroups(groupNames);
            if(props.command.groupName && groupNames.includes(props.command.groupName)){
                setSelectedParameterGroup(props.command.groupName);
            } else if(!groupNames.includes("Default")){
                setSelectedParameterGroup(groupNames[0]);
            }
            setCommandInfo({...data.command_by_pk});
            if(requiredPiecesInitial["edges"]){getAllEdges({variables: {callback_id: props.callback_id} });}
            if(requiredPiecesInitial["all"]){getAllCommands({variables: {payload_type_id: props.payloadtype_id}});}
            if(requiredPiecesInitial["loaded"]){getLoadedCommands({variables: {callback_id: props.callback_id} });}
            if(requiredPiecesInitial["payloads"]){getAllPayloads({variables: {operation_id: props.operation_id} });}
            if(requiredPiecesInitial["connect"]){getAllPayloadsOnHosts({variables: {operation_id: props.operation_id} });}
            if(requiredPiecesInitial["credentials"]){getAllCredentials({variables: {operation_id: props.operation_id}});}
            setRequiredPieces(requiredPiecesInitial);
            setRawParameters({...data});
        }
    });
    const addedCredential = () => {
        getAllCredentials({variables: {operation_id: props.operation_id}});
    }
    const intersect = (a, b) => {
      let setB = new Set(b);
      return [...new Set(a)].filter(x => setB.has(x));
    }
    
    useEffect( () => {
        const getLinkInfoFromAgentConnect = (choices) => {
            if(choices.length > 0){
                const c2profileparameters = choices[0]["payloads"][0]["c2info"][0].parameters.reduce( (prev, opt) => {
                    return {...prev, [opt.name]: opt.value}
                }, {});
                let agentConnectValue = {host: choices[0]["host"], agent_uuid: choices[0]["payloads"][0].uuid,
                c2_profile: {name: choices[0]["payloads"][0]["c2info"][0].name, parameters: c2profileparameters}};
                if(choices[0]["payloads"][0].type === "callback"){
                    agentConnectValue["callback_uuid"] = props.choices[0]["payloads"][0]["agent_callback_id"];
                }
                return agentConnectValue;
            }else{
                return {};
            }
        };
        const getLinkInfoValue = (choices) => {
            let choice;
            if(choices.length > 0){
                if(choices[0]["source"]["id"] === props.callback_id){
                    choice = choices[0]["destination"];
                }else{
                    choice = choices[0]["source"];
                }
                const c2profileparameters = choice["c2profileparametersinstances"].reduce( (prev, opt) => {
                    if(opt.c2_profile_id === choices[0]["c2profile"]["id"]){
                        return {...prev, [opt.c2profileparameter.name]: !opt.c2profileparameter.crypto_type ? opt.value : {crypto_type: opt.c2profileparameter.crypto_type, enc_key: opt.enc_key_base64, dec_key: opt.dec_key_base64} }
                    }else{
                        return {...prev};
                    }
                }, {});
                let agentConnectValue = {host: choice.host, agent_uuid: choice.payload.uuid, callback_uuid: choice.agent_callback_id, c2_profile: {name: choices[0]["c2profile"]["name"], parameters: c2profileparameters} };
                return agentConnectValue;
            }else{
                return {};
            }
        }
        if(rawParameters && (!requiredPieces["loaded"] || loadedCommandsLoading) &&
                       (!requiredPieces["all"] || allCommandsLoading) &&
                       (!requiredPieces["edges"] || loadedAllEdgesLoading) &&
                       (!requiredPieces["payloads"] || loadedAllPayloadsLoading) && 
                       (!requiredPieces["connect"] || loadedAllPayloadsOnHostsLoading) &&
                       (!requiredPieces["credentials"] || loadedCredentialsLoading) ){
            //only process the parameter once we have fetched all of the required pieces
            const params = rawParameters.command_by_pk.commandparameters.reduce( (prev, cmd) => {
                if(cmd.parameter_group_name !== selectedParameterGroup){
                    return [...prev];
                }
                switch(cmd.type){
                    case "Boolean":
                        if(cmd.name in props.command.parsedParameters){
                            return [...prev, {...cmd, value: props.command.parsedParameters[cmd.name]}];
                        }
                        else if(cmd.default_value){
                            return [...prev, {...cmd, value: cmd.default_value.toLowerCase() === "true"}];
                        }else{
                            return [...prev, {...cmd, value: false}];
                        }
                    case "String":
                        if(cmd.name in props.command.parsedParameters){
                            return [...prev, {...cmd, value: props.command.parsedParameters[cmd.name]}];
                        }else{
                            return [...prev, {...cmd, value: cmd.default_value}];
                        }                      
                    case "Number":
                        if(cmd.name in props.command.parsedParameters){
                            return [...prev, {...cmd, value: props.command.parsedParameters[cmd.name]}];
                        }else{
                            return [...prev, {...cmd, value: cmd.default_value === "" ? 0 : parseInt(cmd.default_value)}];
                        }
                    case "Array":
                        if(cmd.name in props.command.parsedParameters){
                            return [...prev, {...cmd, value: props.command.parsedParameters[cmd.name]}];
                        }else if(cmd.default_value.length > 0){
                            return [...prev, {...cmd, value: JSON.parse(cmd.default_value)}];
                        }else{
                            return [...prev, {...cmd, value: []}];
                        }
                    case "Choice":
                    case "ChoiceMultiple":
                        let choices = cmd.choices.split("\n");
                        let defaultV = cmd.default_value;
                        if(cmd.type === "ChoiceMultiple"){
                            if(cmd.default_value !== ""){
                                defaultV = JSON.parse(cmd.default_value);
                            }else{
                                defaultV = [];
                            }
                        }else{
                            if(choices.length > 0){
                                defaultV = cmd.default_value === "" ? choices[0] : cmd.default_value;
                            }
                        }
                        let filter = JSON.parse(cmd.choice_filter_by_command_attributes);
                        if(cmd.choices_are_all_commands){
                            //get all of the latest commands
                            choices = [...allCommandsLoading.command];
                            choices = choices.reduce( (prevn, c) => {
                                let match = true;
                                let cmd_attributes = JSON.parse(c.attributes);
                                for(const [key, value] of Object.entries(filter)){
                                    if(key === "spawn_and_injectable"){
                                        if(value !== cmd_attributes[key]){
                                            match = false;
                                        }
                                    }else if(key === "supported_os" && value.length > 0){
                                        if(intersect(value, cmd_attributes[key]).length === 0){
                                            match = false;
                                        }
                                    }
                                }
                                if(match){
                                    return [...prevn, c.cmd];
                                }else{
                                    return [...prevn];
                                }
                            }, []);
                            choices.sort();
                            if(choices.length > 0){
                                if(cmd.type === "ChoiceMultiple"){defaultV = []}
                                else{defaultV = choices[0];}
                            }
                        }else if(cmd.choices_are_loaded_commands){
                            //get all of the loaded commands
                            choices = [...loadedCommandsLoading.loadedcommands];
                            choices = choices.reduce( (prevn, c) => {
                                let match = true;
                                let cmd_attributes = JSON.parse(c.command.attributes);
                                for(const [key, value] of Object.entries(filter)){
                                    if(key === "spawn_and_injectable"){
                                        if(value !== cmd_attributes[key]){
                                            match = false;
                                        }
                                    }else if(key === "supported_os" && value.length > 0){
                                        if(intersect(value, cmd_attributes[key]).length === 0){
                                            match = false;
                                        }
                                    }
                                }
                                if(match){
                                    return [...prevn, c.command.cmd];
                                }else{
                                    return [...prevn];
                                }
                            }, []);
                            if(choices.length > 0){
                                if(cmd.type === "ChoiceMultiple"){defaultV = []}
                                else{defaultV = choices[0];}
                            }
                        }
                        if(cmd.name in props.command.parsedParameters){
                            return [...prev, {...cmd, choices: choices, value: props.command.parsedParameters[cmd.name]}];
                        }else{
                            return [...prev, {...cmd, choices: choices, default_value: defaultV, value: defaultV}];
                        }
                    case "File":
                        return [...prev, {...cmd, value: {} }];                   
                    case "Credential-JSON":
                        if (loadedCredentialsLoading.credential.length > 0){
                            return [...prev, {...cmd, value: loadedCredentialsLoading.credential[0], choices: loadedCredentialsLoading.credential}];
                        }else{
                            return [...prev, {...cmd, value: {}, choices: []}];
                        }
                    case "Credential-Account":
                        if (loadedCredentialsLoading.credential.length > 0){
                            return [...prev, {...cmd, value: loadedCredentialsLoading.credential[0]["account"], choices: loadedCredentialsLoading.credential}];
                        }else{
                            return [...prev, {...cmd, value: "", choices: []}];
                        }
                    case "Credential-Realm":
                        if (loadedCredentialsLoading.credential.length > 0){
                            return [...prev, {...cmd, value: loadedCredentialsLoading.credential[0]["realm"], choices: loadedCredentialsLoading.credential}];
                        }else{
                            return [...prev, {...cmd, value: "", choices: []}];
                        }
                    case "Credential-Type":
                        if (loadedCredentialsLoading.credential.length > 0){
                            return [...prev, {...cmd, value: loadedCredentialsLoading.credential[0]["type"], choices: loadedCredentialsLoading.credential}];
                        }else{
                            return [...prev, {...cmd, value: "", choices: []}];
                        }
                    case "Credential-Credential":
                        if (loadedCredentialsLoading.credential.length > 0){
                            return [...prev, {...cmd, value: loadedCredentialsLoading.credential[0]["credential_text"], choices: loadedCredentialsLoading.credential}];
                        }else{
                            return [...prev, {...cmd, value: "", choices: []}];
                        }
                    case "AgentConnect":
                        const agentConnectNewPayloads = loadedAllPayloadsLoading.payload.reduce( (prevn, payload) => {
                            let foundP2P = false;
                            const profiles = payload.payloadc2profiles.reduce( (prevn, profile) => {
                                if(profile.c2profile.is_p2p){foundP2P = true;}
                                return [...prevn, profile.c2profile.name];
                            }, []).join(",");
                            if(foundP2P){
                                return [...prevn, {...payload, display: payload.filemetum.filename_text + " - " + profiles + " - " + payload.tag}];
                            }else{
                                return [...prevn];
                            }
                            
                        }, []);
                        const callbacksOrganized = loadedAllPayloadsOnHostsLoading.callback.reduce( (prevn, entry) => {
                            let found = false;
                            const updates = prevn.map( (host) => {
                                if(host.host === entry.host){
                                    found = true;
                                    const c2info = entry.c2profileparametersinstances.reduce( (prevn, cur) => {
                                    const val = !cur.c2profileparameter.crypto_type ? cur.value : {crypto_type: cur.value, enc_key: cur.enc_key_base64, dec_key: cur.dec_key_base64};
                                        if(cur.c2profile.name in prevn){
                                            //we just want to add a new entry to the c2profile.name list
                                            
                                            return {...prevn, [cur.c2profile.name]: [...prevn[cur.c2profile.name], { name: cur.c2profileparameter.name, value:  val } ] }
                                    }else{
                                        return {...prevn, [cur.c2profile.name]: [ { name: cur.c2profileparameter.name, value: val } ] }
                                        }
                                    }, {});
                                    let c2array = [];
                                    for( const [key, value] of Object.entries(c2info)){
                                        c2array.push({name: key, parameters: value});
                                    }
                                    const payloadInfo = {...entry.registered_payload, c2info: c2array, display: "Callback " + entry.id + " - " + entry.description, ...entry, type: "callback", payloadOnHostID:null};
                                    return {...host, payloads: [...host.payloads, payloadInfo]}
                                }else{
                                    return host;
                                }
                            });
                            if(!found){
                                const c2info = entry.c2profileparametersinstances.reduce( (prevn, cur) => {
                                const val = !cur.c2profileparameter.crypto_type ? cur.value : {crypto_type: cur.value, enc_key: cur.enc_key_base64, dec_key: cur.dec_key_base64};
                                    if(cur.c2profile.name in prevn){
                                        //we just want to add a new entry to the c2profile.name list
                                            
                                        return {...prevn, [cur.c2profile.name]: [...prevn[cur.c2profile.name], { name: cur.c2profileparameter.name, value:  val } ] }
                                    }else{
                                        return {...prevn, [cur.c2profile.name]: [ { name: cur.c2profileparameter.name, value: val } ] }
                                    }
                                }, {});
                                let c2array = [];
                                for( const [key, value] of Object.entries(c2info)){
                                    c2array.push({name: key, parameters: value});
                                }
                                const payloadInfo = {...entry.registered_payload, c2info: c2array, display: "Callback " + entry.id + " - " + entry.description, ...entry, type: "callback", payloadOnHostID:null};
                                return [...prevn, {host: entry.host, payloads: [payloadInfo] } ]
                            }else{
                                return updates;
                            }
                        }, []);
                        const organized = loadedAllPayloadsOnHostsLoading.payloadonhost.reduce( (prevn, entry) => {
                            let found = false;
                            const updates = prevn.map( (host) => {
                                if(host.host === entry.host){
                                    found = true;
                                    //now we need to merge this entry with our current payloads/callbacks for the host
                                    let duplicated_payload = false;
                                    host.payloads.forEach( (p) => {
                                        if(p.id === entry.payload.id){duplicated_payload = true}
                                    });
                                    if(duplicated_payload){return host}
                                    const c2info = entry.payload.c2profileparametersinstances.reduce( (prevn, cur) => {
                                    const val = !cur.c2profileparameter.crypto_type ? cur.value : {crypto_type: cur.value, enc_key: cur.enc_key_base64, dec_key: cur.dec_key_base64};
                                        if(cur.c2profile.name in prevn){
                                            //we just want to add a new entry to the c2profile.name list
                                            
                                            return {...prevn, [cur.c2profile.name]: [...prevn[cur.c2profile.name], { name: cur.c2profileparameter.name, value:  val } ] }
                                    }else{
                                        return {...prevn, [cur.c2profile.name]: [ { name: cur.c2profileparameter.name, value: val } ] }
                                        }
                                    }, {});
                                    let c2array = [];
                                    for( const [key, value] of Object.entries(c2info)){
                                        c2array.push({name: key, parameters: value});
                                    }
                                    const payloadInfo = {...entry.payload, c2info: c2array, display: entry.payload.filemetum.filename_text + " - " + entry.payload.tag, type: "payload", payloadOnHostID:entry.id};
                                    return {...host, payloads: [...host.payloads, payloadInfo]}
                                }else{
                                    //this doesn't match our host, so don't modify
                                    return host; 
                                }
                            });
                            if(!found){
                                const c2info = entry.payload.c2profileparametersinstances.reduce( (prevn, cur) => {
                                    const val = !cur.c2profileparameter.crypto_type ? cur.value : {crypto_type: cur.value, enc_key: cur.enc_key_base64, dec_key: cur.dec_key_base64};
                                    if(cur.c2profile.name in prevn){
                                        //we just want to add a new entry to the c2profile.name list
                                        
                                        return {...prevn, [cur.c2profile.name]: [...prevn[cur.c2profile.name], { name: cur.c2profileparameter.name, value:  val } ] }
                                    }else{
                                        return {...prevn, [cur.c2profile.name]: [ { name: cur.c2profileparameter.name, value: val } ] }
                                    }
                                }, {});
                                let c2array = [];
                                for( const [key, value] of Object.entries(c2info)){
                                    c2array.push({name: key, parameters: value});
                                }
                                const payloadInfo = {...entry.payload, c2info: c2array, display: entry.payload.filemetum.filename_text + " - " + entry.payload.tag, type: "payload", payloadOnHostID:entry.id};
                                return [...prevn, {host: entry.host, payloads: [payloadInfo] } ]
                            }else{
                                return updates;
                            }
                        }, []);
                        // callbacksOrganized has all the information for active callbacks to link to
                        // organized has all of the information for payloads on hosts to link to
                        // need to merge the two
                        const allOrganized = callbacksOrganized.reduce( (prevn, cur) => {
                            let hostIndex = prevn.findIndex(o => o.host === cur.host);
                            if(hostIndex > -1){
                                // need to add cur.payloads to the prev[hostIndex].payloads list
                                prevn[hostIndex].payloads = [...prevn[hostIndex].payloads, ...cur.payloads];
                                return [...prevn];
                            }else{
                                return [...prevn, {...cur}];
                            }
                        }, [...organized]);
                        console.log("updating choices and payload choices", allOrganized, agentConnectNewPayloads)
                        return [...prev, {...cmd, choices: allOrganized, payload_choices: agentConnectNewPayloads, value: getLinkInfoFromAgentConnect(organized)}];
                    case "PayloadList":
                        let supported_agents = cmd.supported_agents.split(",");
                        if(supported_agents.indexOf("") !== -1){supported_agents.splice(supported_agents.indexOf(""))}
                        const build_requirements = JSON.parse(cmd.supported_agent_build_parameters);
                        const payloads = loadedAllPayloadsLoading.payload.reduce( (prevn, payload) => {
                            const profiles = payload.payloadc2profiles.reduce( (prevn, profile) => {
                                return [...prevn, profile.c2profile.name];
                            }, []).join(",");
                            if(supported_agents.length > 0 && !supported_agents.includes(payload.payloadtype.ptype)){return prevn};
                            let matched = true;
                            if(payload.payloadtype.ptype in build_requirements){
                                //this means we have a filtering condition on our payload
                                for(const [key, value] of Object.entries(build_requirements[payload.payloadtype.ptype])){
                                    payload.buildparameterinstances.forEach( (build_param) => {
                                        if(build_param.buildparameter.name === key){
                                            if(build_param.parameter !== value){matched = false}
                                        }
                                    });
                                }
                            }
                            if(matched){
                                return [...prevn, {...payload, display: payload.filemetum.filename_text + " - " + profiles + " - " + payload.tag}]
                            }else{
                                return prevn;
                            }
                            
                        }, []);
                        //now filter the payloads based on supported_agents and supported_agent_build_parameters
                        if(payloads.length > 0){
                            return [...prev, {...cmd, choices: payloads, default_value: payloads[0].uuid, value: payloads[0].uuid}];
                        }else{
                            return [...prev, {...cmd, choices: payloads, value: null}];
                        }
                    case "LinkInfo":
                        const edge_choices = loadedAllEdgesLoading.callbackgraphedge.reduce( (prevn, edge) => {
                            if(edge.source.id === edge.destination.id) {return prevn}
                            if(edge.direction === 1){
                                return [...prevn, {...edge, display: "Callback " + edge.source.id + " --" + edge.c2profile.name + "--> Callback " + edge.destination.id + (edge.end_timestamp === null? "(Active)" : "(Dead at " + edge.end_timestamp + ")")}];
                            }else if(edge.direction === 2){
                                return [...prevn, {...edge, display: "Callback " + edge.destination.id + "-> " + edge.c2profile.name + "--> Callback " + edge.source.id + (edge.end_timestamp === null? "(Active)" : "(Dead at " + edge.end_timestamp + ")")}];
                            } else{
                                return prevn;
                            }
                        }, []);
                        if(edge_choices.length > 0){
                            return [...prev, {...cmd, choices: edge_choices, value: getLinkInfoValue(edge_choices)}];
                        }else{
                            return [...prev, {...cmd, choices: edge_choices, value: {}}];
                        }
                    default:
                        return [...prev, {...cmd}];
                }
            }, [] );
            const sorted = params.sort((a, b) => (a.ui_position > b.ui_position) ? 1 : -1)
            if(sorted.length > 0){
                sorted[0]["autoFocus"] = true;
            }
            setParameters(sorted);
        }
    }, [selectedParameterGroup, rawParameters, loadedCommandsLoading, allCommandsLoading, loadedAllEdgesLoading, requiredPieces, loadedAllPayloadsLoading, loadedCredentialsLoading, loadedAllPayloadsOnHostsLoading, props.callback_id, props.choices]);
    const onSubmit = async () => {
        let newFileUUIDs = [];
        let collapsedParameters = {};
        for(const param of parameters){
            switch(param.type){
                case "String":
                case "Boolean":
                case "Number":
                case "Choice":
                case "ChoiceMultiple":
                case "Credential-Account":
                case "Credential-Realm":
                case "Credential-Type":
                case "Credential-Credential":
                case "AgentConnect":
                case "PayloadList":
                case "Array":
                case "LinkInfo":
                    collapsedParameters[param.name] = param.value;
                    break;
                case "File":
                    setBackdropOpen(true);
                    const newUUID = await UploadTaskFile(param.value);
                    if(newUUID){
                        newFileUUIDs.push(newUUID);
                        collapsedParameters[param.name] = newUUID;
                    }else{
                        setBackdropOpen(false);
                        return;
                    }
                    break;
                case "Credential-JSON":
                    collapsedParameters[param.name] = {
                        account: param.value["account"],
                        comment: param.value["comment"],
                        credential: param.value["credential_text"],
                        realm: param.value["realm"],
                        type: param.value["type"]
                    };
                    break;
                default:
                    console.log("Unknown parameter type");
            }
        }
        setBackdropOpen(false);
        props.onSubmit(props.command.cmd, JSON.stringify(collapsedParameters), newFileUUIDs, selectedParameterGroup);
        
    }
    const onAgentConnectAddNewPayloadOnHost = (host, payload) => {
        addPayloadOnHost({variables: {host: host, payload_id: payload} })
    }
    const onAgentConnectRemovePayloadOnHost = (payloadOnHostID) => {
        RemovePayloadOnHost({variables: {payloadOnHostID: payloadOnHostID}})
    }
    const onChange = (name, value, error) => {
        const params = parameters.map( (param) => {
            if(param.name === name){
                return {...param, value: value};
            }else{
                return {...param};
            }
        });
        setParameters(params);
    }
    const onChangeParameterGroup = (event) => {
        setSelectedParameterGroup(event.target.value);
    }
    
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">{commandInfo.cmd}'s Parameters</DialogTitle>
        <DialogContent dividers={true}>
            <Backdrop open={backdropOpen} style={{zIndex: 2, position: "absolute"}}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <Typography component="div" >
                <b>Description</b> <pre style={{margin:0, wordBreak: "break-all", overflow: "word-wrap", whiteSpace: "pre-wrap"}}>{commandInfo.description}</pre><br/>
                <Divider />
                <b>Requires Admin?</b><pre style={{margin:0}}>{commandInfo.needs_admin ? "True": "False"}</pre><br/>
                <Divider />
                {parameterGroups.length > 1 &&
                    <FormControl style={{width: "100%"}} >
                        <TextField
                            select
                            label="Parameter Group"
                            value={selectedParameterGroup}
                            onChange={onChangeParameterGroup}
                            
                            input={<Input />}
                        >
                        {
                            parameterGroups.map((opt, i) => (
                                <MenuItem key={"paramgroup" + i} value={opt} >{opt}</MenuItem>
                            ))
                        }
                        </TextField>
                    </FormControl>
                    
                }
            </Typography>
            <TableContainer component={Paper} elevation={5} className="mythicElement" style={{backgroundColor: theme.tableHover, marginTop: "10px"}}> 
                <Table size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{width: "30%"}}>Parameter</TableCell>
                            <TableCell>Value</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {parameters.map( (op) => (
                            <TaskParametersDialogRow onSubmit={onSubmit} key={"taskparameterrow" + op.id} onChange={onChange} commandInfo={commandInfo} {...op} 
                                callback_id={props.callback_id} onAgentConnectAddNewPayloadOnHost={onAgentConnectAddNewPayloadOnHost}
                                onAgentConnectRemovePayloadOnHost={onAgentConnectRemovePayloadOnHost} addedCredential={addedCredential}
                                />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
          <Button onClick={onSubmit} variant="contained" color="secondary">
            Submit
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

