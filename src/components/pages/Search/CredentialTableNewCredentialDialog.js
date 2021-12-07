import React from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import MythicTextField from '../../MythicComponents/MythicTextField';
import Select from '@material-ui/core/Select';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
  variant: "menu",
  getContentAnchorEl: () => null
};
const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    width: "100%",
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
  noLabel: {
    marginTop: theme.spacing(2),
  },
}));

export function CredentialTableNewCredentialDialog(props) {
  const [credentialType, setCredentialType] = React.useState("plaintext");
  const credentialOptions = [
    "plaintext", "ticket", "hash", "certificate", "key", "hex"
  ];
  const [account, setAccount] = React.useState("");
  const [realm, setRealm] = React.useState("");
  const [credential, setCredential] = React.useState("");
  const [comment, setComment] = React.useState("");
  const classes = useStyles();

  const onSubmit = () => {
    props.onSubmit({
      realm,
      account,
      comment,
      credential,
      "type": credentialType
    });
    props.onClose();
  }
  const onAccountChange = (name, value, error) => {
    setAccount(value);
  }
  const onCommentChange = (name, value, error) => {
    setComment(value);
  }
  const onRealmChange = (name, value, error) => {
    setRealm(value);
  }
  const onCredentialChange = (name, value, error) => {
    setCredential(value);
  }
  const handleCredentialTypeChange = (event) => {
    setCredentialType(event.target.value);
  }
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Register New Credential</DialogTitle>
        <DialogContent dividers={true}>
            <React.Fragment>
                <FormControl className={classes.formControl}>
                <InputLabel id="operator-chip-label">Which Type of Credential</InputLabel>
                <Select
                  labelId="operator-chip-label"
                  id="operator-chip"
                  value={credentialType}
                  onChange={handleCredentialTypeChange}
                  input={<Input />}
                  MenuProps={MenuProps}
                >
                  {credentialOptions.map((name) => (
                    <MenuItem key={name} value={name}>
                      <ListItemText primary={name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <MythicTextField value={account} onChange={onAccountChange} name="Account Name"/>
              <MythicTextField value={realm} onChange={onRealmChange} name="Realm or Domain"/>
              <MythicTextField value={comment} onChange={onCommentChange} name="Comment"/>
              <MythicTextField multiline value={credential} onChange={onCredentialChange} name="Credential"/>
            </React.Fragment>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" >
            Close
          </Button>
          <Button onClick={onSubmit} color="primary" variant="contained" >
            Create
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

