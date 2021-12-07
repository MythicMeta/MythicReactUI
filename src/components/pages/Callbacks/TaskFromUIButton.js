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
        payload {
            payloadtype {
                id
                commands(where: {script_only: {_eq: true}, deleted: {_eq: false}, supported_ui_features: {_ilike: $ui_feature }}){
                    id
                    cmd
                    help_cmd
                    description
                    needs_admin
                    attributes
                    payload_type_id
                    commandparameters {
                        id
                        type
                    }
                    supported_ui_features
                  }
            }
        }
    }
}
`;

export const TaskFromUIButton = ({callback_id, ui_feature, parameters, onTasked}) =>{
    const [fileBrowserCommands, setFileBrowserCommands] = React.useState([]);
    const [openSelectCommandDialog, setOpenSelectCommandDialog] = React.useState(false);
    const [openParametersDialog, setOpenParametersDialog] = React.useState(false);
    const [selectedCommand, setSelectedCommand] = React.useState({});
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
            const finalCommands = data.callback_by_pk.payload.payloadtype.commands.reduce( (prev, cur) => {
                return [...prev, cur];
            }, [...availableCommands]);
            setFileBrowserCommands(finalCommands);
            if(finalCommands.length === 0){
                snackActions.warning("No commands currently loaded that support the " + ui_feature + " feature");
            }else if(finalCommands.length === 1){
                setSelectedCommand({...finalCommands[0]});
            }else{
                setSelectedCommand({});
                setOpenSelectCommandDialog(true);
            }
        },
        fetchPolicy: "network-only"
    });
    const onSubmitSelectedCommand = (cmd) => {
        setSelectedCommand(cmd);
    }
    const submitParametersDialog = (cmd, parameters, files) => {
        setOpenParametersDialog(false);
        createTask({variables: {callback_id: callback_id, command: cmd, params: parameters, files, tasking_location: "modal"}});
    }
    useEffect( () => {
        if(selectedCommand.commandparameters === undefined){
            return;
        }
        if(selectedCommand.commandparameters.length > 0){
            if(parameters === undefined || parameters === null){
                setOpenParametersDialog(true);
            }else{
                if(typeof(parameters) === "string"){
                    createTask({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: parameters}});
                }else{
                    createTask({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: JSON.stringify(parameters), tasking_location: "browserscript"}});
                }
                
            }
        }else{
            if(parameters === undefined || parameters === null){
                createTask({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: ""}});
            }else{
                if(typeof(parameters) === "string"){
                    createTask({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: parameters}});
                }else{
                    createTask({variables: {callback_id: callback_id, command: selectedCommand.cmd, params: JSON.stringify(parameters), tasking_location: "browserscript"}});
                }
            }
            
        }
    }, [selectedCommand])
    return (
        <div>
            {openSelectCommandDialog && 
                <MythicDialog fullWidth={true} maxWidth="sm" open={openSelectCommandDialog}
                        onClose={()=>{setOpenSelectCommandDialog(false);}} 
                        innerDialog={<MythicSelectFromListDialog onClose={()=>{setOpenSelectCommandDialog(false);}}
                                            onSubmit={onSubmitSelectedCommand} options={fileBrowserCommands} title={"Select Command"} 
                                            action={"select"} identifier={"id"} display={"cmd"}/>}
                    />
            }
            {openParametersDialog &&
            <MythicDialog fullWidth={true} maxWidth="md" open={openParametersDialog} 
                onClose={()=>{setOpenParametersDialog(false);}} 
                innerDialog={<TaskParametersDialog command={selectedCommand} callback_id={callback_id} payloadtype_id={callbackData.callback_by_pk.payload.payloadtype.id}
                    operation_id={callbackData.callback_by_pk.operation_id} 
                    onSubmit={submitParametersDialog} onClose={()=>{setOpenParametersDialog(false);}} />}
            />
            }
        </div>
    )
}
