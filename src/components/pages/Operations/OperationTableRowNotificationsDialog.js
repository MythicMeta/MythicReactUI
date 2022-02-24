import React from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MythicTextField from '../../MythicComponents/MythicTextField';
import {useQuery, gql} from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import Switch from '@mui/material/Switch';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-xcode';
import {useTheme} from '@mui/material/styles';

const GET_OperationData = gql`
query GetOperations($operation_id: Int!) {
  operation_by_pk(id: $operation_id) {
    name
    id
    channel
    display_name
    icon_emoji
    icon_url
    webhook
    webhook_message
    complete
  }
}
`;

export function OperationTableRowNotificationsDialog(props) {
    const [name, setName] = React.useState("");
    const theme = useTheme();
    const [channel, setChannel] = React.useState("");
    const [displayName, setDisplayName] = React.useState("");
    const [iconEmoji, setIconEmoji] = React.useState("");
    const [iconURL, setIconURL] = React.useState("");
    const [webhook, setWebhook] = React.useState("");
    const [webhookMessage, setWebhookMessage] = React.useState("");
    const [complete, setComplete] = React.useState(false);
    
    useQuery(GET_OperationData, {
      fetchPolicy: "no-cache",
      variables: {operation_id: props.id},
      onCompleted: (data) => {
        let webhookMessage = data.operation_by_pk.webhook_message;
        try{
          webhookMessage = JSON.stringify(JSON.parse(webhookMessage), null, 4);
        }catch(error){
          
        }
          setName(data.operation_by_pk.name);
          setChannel(data.operation_by_pk.channel);
          setDisplayName(data.operation_by_pk.display_name);
          setIconEmoji(data.operation_by_pk.icon_emoji);
          setIconURL(data.operation_by_pk.icon_url);
          setWebhook(data.operation_by_pk.webhook);
          setWebhookMessage(webhookMessage);
          setComplete(data.operation_by_pk.complete);
      },
      onError: () => {
        snackActions.error("Failed to fetch data");
      }
    });
    const onTextChange = (name, value, error) => {
      switch(name){
        case "name":
          setName(value);
          break;
        case "Webhook Channel":
          setChannel(value);
          break;
        case "Webhook Display Name":
          setDisplayName(value);
          break;
        case "Webhook Icon Emoji":
          setIconEmoji(value);
          break;
        case "Webhook Icon URL":
          setIconURL(value);
          break;
        case "Webhook URL":
          setWebhook(value);
          break;
        case "Webhook POST Message":
          setWebhookMessage(value);
          break;
        default:
          break;
      }
    }
    const onEditorChange = (value, event) => {
      setWebhookMessage(value);
    }
    const onBoolChange = (event) => {
      setComplete(event.target.checked);
    }
    const onAccept = () =>{
      props.onUpdateOperation({
        operation_id: props.id,
        name: name,
        channel: channel,
        display_name: displayName,
        icon_emoji: iconEmoji,
        icon_url: iconURL,
        webhook: webhook,
        webhook_message: webhookMessage,
        complete: complete
      });
      props.onClose();
    }
  
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Modify {name}</DialogTitle>
        <DialogContent dividers={true} style={{maxHeight: "calc(70vh)"}}>
          <DialogContentText>
            Use this dialog to update some information about an operation.
          </DialogContentText>
          <MythicTextField
            autoFocus
            value={name}
            onChange={onTextChange}
            margin="dense"
            name="name"
          />
          Complete Operation? <Switch checked={complete} onChange={onBoolChange} color="warning" />
          <MythicTextField
            margin="dense"
            value={channel}
            onChange={onTextChange}
            name="Webhook Channel"
          />
          <MythicTextField
            margin="dense"
            value={displayName}
            onChange={onTextChange}
            name="Webhook Display Name"
          />
          <MythicTextField
            margin="dense"
            value={iconEmoji}
            onChange={onTextChange}
            name="Webhook Icon Emoji"
          />
          <MythicTextField
            margin="dense"
            value={iconURL}
            onChange={onTextChange}
            name="Webhook Icon URL"
          />
          <MythicTextField
            margin="dense"
            value={webhook}
            onChange={onTextChange}
            name="Webhook URL"
          />
          <AceEditor 
              mode="json"
              theme={theme.palette.type === "dark" ? "monokai" : "xcode"}
              onChange={onEditorChange}
              fontSize={14}
              showGutter={true}
              maxLines={20}
              highlightActiveLine={true}
              value={webhookMessage}
              width={"100%"}
              setOptions={{
                showLineNumbers: true,
                tabSize: 4,
                useWorker: false
              }}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Cancel
          </Button>
          <Button onClick={onAccept} variant="contained" color="success">
            Update
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

