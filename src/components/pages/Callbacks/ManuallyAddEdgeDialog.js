import React, {useRef} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';
import {useQuery, useReactiveVar, gql } from '@apollo/client';
import { meState } from '../../../cache';
import LinearProgress from '@mui/material/LinearProgress';
import makeStyles from '@mui/styles/makeStyles';

const getP2PProfilesAndCallbacks = gql`
query getP2PProfilesAndCallbacks($operation_id: Int!){
  c2profile(where: {is_p2p: {_eq: true}}) {
    callbackc2profiles(where: {callback: {operation_id: {_eq: $operation_id}}}) {
      id
      callback {
        id
        description
      }
    }
    name
    id
  }
}
`;
const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
    width: "97%"
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}));
export function ManuallyAddEdgeDialog(props) {
    const classes = useStyles();
    const [callbackOptions, setCallbackOptions] = React.useState([]);
    const [profileOptions, setProfileOptions] = React.useState([]);
    const [selectedDestination, setSelectedDestination] = React.useState('');
    const [selectedProfile, setSelectedProfile] = React.useState('');
    const inputRefDestination = useRef(null); 
      const handleChangeProfile = (event) => {
        setSelectedProfile(event.target.value);
      };
      const handleChangeDestination = (event) => {
        setSelectedDestination(event.target.value);
      };
    const handleSubmit = () => {
        props.onSubmit(props.source.id, selectedProfile, selectedDestination.callback);
        props.onClose();
    }
    const me = useReactiveVar(meState);
    const { loading, error } = useQuery(getP2PProfilesAndCallbacks, {
        variables: {operation_id: me.user.current_operation_id},
        onCompleted: data => {
            const filteredProfileOptions = data.c2profile.filter( (profile) => {
                let found = false;
                props.source.callbackc2profiles.forEach( (source_profile) => {
                    if(source_profile.c2profile.name === profile.name){found = true};
                });
                return found;
            } );
            setProfileOptions(filteredProfileOptions);
            if(filteredProfileOptions.length > 0){
                setSelectedProfile(filteredProfileOptions[0]);
                const cbopts = filteredProfileOptions[0]["callbackc2profiles"].filter( (cb) => cb.callback.id !== props.source.id );
                setCallbackOptions(cbopts);
                if(cbopts.length > 0){
                    setSelectedDestination(cbopts[0]);
                }
            }
        },
        fetchPolicy: "network-only"
    });
    if (loading) {
     return <LinearProgress style={{marginTop: "10px"}} />;
    }
    if (error) {
     console.error(error);
     return <div>Error!</div>;
    }
  return (
    <React.Fragment>
        <DialogTitle >Manually Add Edge From Callback {props.source.id}</DialogTitle>
        <DialogContent dividers={true}>
            <React.Fragment>
                Manually add an edge from Callback {props.source.id} to another callback via a P2P C2 Profile they both share.<br/>
                <FormControl className={classes.formControl}>
                  <InputLabel id="demo-dialog-select-label-profile">Profile</InputLabel>
                  <Select
                    labelId="demo-dialog-select-label-profile"
                    id="demo-dialog-select"
                    
                    value={selectedProfile}
                    onChange={handleChangeProfile}
                    style={{minWidth: "30%"}}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {profileOptions.map( (opt) => (
                        <MenuItem value={opt} key={"profile:" + opt.id}>{opt.name}</MenuItem>
                    ) )}
                  </Select>
                </FormControl><br/>
                <FormControl className={classes.formControl}>
                  <InputLabel ref={inputRefDestination}>Destination</InputLabel>
                  <Select
                    labelId="demo-dialog-select-label-destination"
                    id="demo-dialog-select-destination"
                    value={selectedDestination}
                    
                    onChange={handleChangeDestination}
                    input={<Input />}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {callbackOptions.map( (opt) => (
                        <MenuItem value={opt} key={"callback:" + opt.callback.id}>{opt.callback.id} ({opt.callback.description})</MenuItem>
                    ) )}
                  </Select>
                </FormControl>
            </React.Fragment>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="success">
            Add
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

