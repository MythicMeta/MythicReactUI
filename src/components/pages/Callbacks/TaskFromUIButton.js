import React, { useEffect } from 'react';
import {gql, useMutation, useQuery } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {MythicSelectFromListDialog} from '../../MythicComponents/MythicSelectFromListDialog';
import {createTaskingMutation} from './CallbacksTabsTasking';
import {TaskParametersDialog} from './TaskParametersDialog';

const getLoadedCommandsQuery = gql`
query GetLoadedCommandsQuery($callback_id: Int!, $ui_feature: String!) {
    callback_by_pk(id: $callback_id){
        operation_id
        loadedcommands(where: {command: {supported_ui_features: {_ilike: $ui_feature}}}) {
            id
            command {
              cmd
              help_cmd
              description
              id
              needs_admin
              payload_type_id
              attributes
              commandparameters {
                id
                type 
              }
              supported_ui_features
            }
        }
        callbacktokens(where: {deleted: {_eq: false}}) {
            token {
              TokenId
              id
              User
              description
            }
            id
        }
    }
}
`;

export const TaskFromUIButton = ({callback_id, ui_feature, parameters, onTasked}) =>{
    const [fileBrowserCommands, setFileBrowserCommands] = React.useState([]);
    const [openSelectCommandDialog, setOpenSelectCommandDialog] = React.useState(false);
    const [openParametersDialog, setOpenParametersDialog] = React.useState(false);
    const [selectedCommand, setSelectedCommand] = React.useState({});
    const [callbackTokenOptions, setCallbackTokenOptions] = React.useState([]);
    const [selectedCallbackToken, setSelectedCallbackToken] = React.useState({});
    const [openCallbackTokenSelectDialog, setOpenCallbackTokenSelectDialog] = React.useState(false);
    const [taskingVariables, setTaskingVariables] = React.useState({});
    const [createTask] = useMutation(createTaskingMutation, {
        update: (cache, {data}) => {
            if(data.createTask.status === "error"){
                snackActions.error(data.createTask.error);
            }else{
                snackActions.success("Issued \"" + selectedCommand["cmd"] + "\" to Callback " + callback_id);
            }
            onTasked();
        },
        onError: data => {
            console.error(data);
            onTasked();
        }
    });
    const {data: callbackData} = useQuery(getLoadedCommandsQuery, {
        variables: {callback_id: callback_id, ui_feature: "%" + ui_feature + "%"},
        onCompleted: (data) => {
            const availableCommands = data.callback_by_pk.loadedcommands.reduce( (prev, cur) => {
                return [...prev, cur.command];
            }, []);
            const availableTokens = data.callback_by_pk.callbacktokens.reduce( (prev, cur) => {
                return [...prev, {...cur.token, "display": cur.token.User === null ? cur.token.TokenId + " - " + cur.token.description : cur.token.User + " - " + cur.token.description}]
            }, []);
            setCallbackTokenOptions(availableTokens);
            setFileBrowserCommands(availableCommands);
            if(availableCommands.length === 0){
                snackActions.warning("No commands currently loaded that support the " + ui_feature + " feature");
            }else if(availableCommands.length === 1){
                setSelectedCommand({...availableCommands[0]});
            }else{
                setSelectedCommand({});
                setOpenSelectCommandDialog(true);
            }
        },
        fetchPolicy: "no-cache"
    });
    const onSubmitSelectedCommand = (cmd) => {
        setSelectedCommand(cmd);
    }
    const onSubmitTasking = ({variables}) => {
        if(callbackTokenOptions.length > 0){
            setOpenCallbackTokenSelectDialog(true);
            setTaskingVariables(variables);
        }else{
            createTask({variables})
        }
    }
    const submitParametersDialog = (cmd, parameters, files) => {
        setOpenParametersDialog(false);
        onSubmitTasking({variables: {callback_id: callback_id, command: cmd, params: parameters, files, tasking_location: "modal"}});
    }
    const onSubmitSelectedToken = (token) => {
        setSelectedCallbackToken(token);
    }
    useEffect( () => {
        if(selectedCallbackToken === ""){
            // we selected the default token to use
            createTask({variables: taskingVariables})
        }
        if(selectedCallbackToken.TokenId){
            createTask({variables: {...taskingVariables, token_id: selectedCallbackToken.TokenId}})
        }else{
            return;
        }
        
    }, [selectedCallbackToken])
    useEffect( () => {
        if(selectedCommand.commandparameters === undefined){
            return;
        }
        if(selectedCommand.commandparameters.length > 0){
            if(parameters === undefined || parameters === null){
                setOpenParametersDialog(true);
            }else{
                if(typeof(parameters) === "string"){
                    onSubmitTasking({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: parameters}});
                }else{
                    onSubmitTasking({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: JSON.stringify(parameters), tasking_location: "browserscript"}});
                }
                
            }
        }else{
            if(parameters === undefined || parameters === null){
                onSubmitTasking({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: ""}});
            }else{
                if(typeof(parameters) === "string"){
                    onSubmitTasking({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: parameters}});
                }else{
                    onSubmitTasking({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: JSON.stringify(parameters), tasking_location: "browserscript"}});
                }
            }
            
        }
    }, [selectedCommand])
    return (
        <div>
            {openSelectCommandDialog && 
                <MythicDialog fullWidth={true} maxWidth="sm" open={openSelectCommandDialog}
                        onClose={()=>{setOpenSelectCommandDialog(false);onTasked();}} 
                        innerDialog={<MythicSelectFromListDialog onClose={()=>{setOpenSelectCommandDialog(false);}}
                                            onSubmit={onSubmitSelectedCommand} options={fileBrowserCommands} title={"Select Command"} 
                                            action={"select"} identifier={"id"} display={"cmd"}/>}
                    />
            }
            {openParametersDialog &&
                <MythicDialog fullWidth={true} maxWidth="lg" open={openParametersDialog} 
                    onClose={()=>{setOpenParametersDialog(false);onTasked();}} 
                    innerDialog={<TaskParametersDialog command={selectedCommand} callback_id={callback_id} payloadtype_id={callbackData.callback_by_pk.payload.payloadtype.id}
                        operation_id={callbackData.callback_by_pk.operation_id} 
                        onSubmit={submitParametersDialog} onClose={()=>{setOpenParametersDialog(false);}} />}
                />
            }
            {openCallbackTokenSelectDialog &&
                <MythicDialog fullWidth={true} maxWidth="sm" open={openCallbackTokenSelectDialog}
                    onClose={()=>{setOpenCallbackTokenSelectDialog(false);onTasked();}} 
                    innerDialog={<MythicSelectFromListDialog onClose={()=>{setOpenCallbackTokenSelectDialog(false);onTasked();}}
                                        onSubmit={onSubmitSelectedToken} dontCloseOnSubmit={true} options={callbackTokenOptions} title={"Select Token"} 
                                        action={"select"} identifier={"id"} display={"display"}/>}
                />
            }
        </div>
    )
}
