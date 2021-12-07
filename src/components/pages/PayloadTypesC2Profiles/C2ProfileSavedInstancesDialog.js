import React, {useState} from 'react';
import {Button, Typography} from '@material-ui/core';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import MythicTextField from '../../MythicComponents/MythicTextField';
import {useQuery, gql, useLazyQuery, useMutation} from '@apollo/client';
import LinearProgress from '@material-ui/core/LinearProgress';
import {CreatePayloadC2ProfileParametersTable} from '../CreatePayload/CreatePayloadC2ProfileParametersTable';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import {useTheme} from '@material-ui/core/styles';
import { snackActions } from '../../utilities/Snackbar';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import * as RandExp from 'randexp';

const getProfileConfigQuery = gql`
query getProfileParameters($id: Int!, $operation_id: Int!) {
  c2profile_by_pk(id: $id) {
    c2profileparameters(where: {deleted: {_eq: false}}, order_by: {name: asc}){
      default_value
      description
      format_string
      id
      name
      parameter_type
      randomize
      required
      verifier_regex
    }
    c2profileparametersinstances(where: {instance_name: {_is_null: false}, operation_id: {_eq: $operation_id}}, distinct_on: instance_name, order_by: {instance_name: asc}){
      instance_name
    }
  }
}
`;
const getProfileInstaceQuery = gql`
query getProfileInstanceQuery($name: String!, $operation_id: Int!) {
  c2profileparametersinstance(where: {instance_name: {_eq: $name}, operation_id: {_eq: $operation_id}}) {
    c2profileparameter {
      default_value
      description
      format_string
      id
      name
      parameter_type
      randomize
      required
      verifier_regex
    }
    id
    value
  }
}
`;
const deleteInstanceMutation = gql`
mutation deleteSavedInstance($name: String!, $operation_id: Int!){
  delete_c2profileparametersinstance(where: {instance_name: {_eq: $name}, operation_id: {_eq: $operation_id}}){
    affected_rows
  }
}
`;
const createInstanceMutation = gql`
mutation createNewC2Instance($instance_name: String!, $c2_instance: String!, $c2profile_id: Int!){
  create_c2_instance(c2_instance: $c2_instance, instance_name: $instance_name, c2profile_id: $c2profile_id){
    status
    error
  }
}
`;

export function C2ProfileSavedInstancesDialog(props) {
    const theme = useTheme();
    const me = useReactiveVar(meState);
    const [instanceName, setInstanceName] = useState("");
    const [selectedInstance, setSelectedInstance] = useState("");
    const [createdInstances, setCreatedInstances] = useState([]);
    const [baseParameters, setBaseParameters] = useState([]);
    const [currentParameters, setCurrentParameters] = useState([]);
    const { loading } = useQuery(getProfileConfigQuery, {
        variables: {id: props.id, operation_id: me.user.current_operation_id},
        onCompleted: data => {
            const parameters = data.c2profile_by_pk.c2profileparameters.map( (param) => {
              if(param.format_string !== ""){
                  const random = new RandExp(param.format_string).gen();
                  return {...param, default_value: random, value: random}
              }else if(param.default_value !== ""){
                  if(param.parameter_type === "ChooseOne"){
                      return {...param, value: param.default_value.split("\n")[0]}
                  }else if(param.parameter_type === "Dictionary"){
                      let tmp = JSON.parse(param.default_value);
                      let initial = tmp.reduce( (prev, op) => {
                          // find all the options that have a default_show of true
                          if(op.default_show){
                              return [...prev, {value: op.default_value, key: op.name === "*" ? "": op.name, name: op.name, custom: op.name === "*" ? true : false} ];
                          }else{
                              return [...prev];
                          }
                      }, [] );
                      return {...param, value: initial}
                  }else if(param.parameter_type === "Date"){
                    let tmpDate = new Date();
                    tmpDate.setDate(tmpDate.getDate() + parseInt(param.default_value));
                    return {...param, value: tmpDate.toISOString().slice(0,10)}
                  }else{
                      return {...param, value: param.default_value}
                  }
              }else{
                return {...param, error: param.required, value: param.default_value}
              }
          });
          parameters.sort((a,b) => -b.description.localeCompare(a.description));
          setBaseParameters([...parameters]);
          setCurrentParameters([...parameters]);
          setCreatedInstances(data.c2profile_by_pk.c2profileparametersinstances);
        },
        onError: data => {
          
        },
        fetchPolicy: "network-only"
    });
    const [getInstanceValues] = useLazyQuery(getProfileInstaceQuery, {
      onCompleted: (data) => {
        const updates = data.c2profileparametersinstance.map( (cur) => {
          let inst = {...cur, ...cur.c2profileparameter};
          if(inst.parameter_type === "Dictionary" || inst.parameter_type === "Array"){
            inst["value"] = JSON.parse(inst["value"]);
        }
          return inst;
        })
        updates.sort( (a, b) => a.name < b.name ? -1 : 1);
        setCurrentParameters(updates);
      },
      onError: (data) => {
        snackActions.error("Failed to fetch instance data: " + data);
        console.log(data);
      },
      fetchPolicy: "no-cache"
    })
    const [deleteInstance] = useMutation(deleteInstanceMutation, {
      onCompleted: (data) => {
        setSelectedInstance("")
        setInstanceName("");
        setCurrentParameters([...baseParameters]);
        const updatedInstances = createdInstances.filter( (cur) => cur.instance_name !== selectedInstance);
        setCreatedInstances(updatedInstances);
        snackActions.success("Sucessfully deleted instance");
      },
      onError: (data) => {
        snackActions.error("Failed to delete instance: " + data);
      }
    });
    const [createInstance] = useMutation(createInstanceMutation, {
      onCompleted: (data) => {
        if(data.create_c2_instance.status === "success"){
          snackActions.success("Successfully created instance");
        }else{
          snackActions.error("Failed to create instance: " + data.create_c2_instance.error);
        }
        props.onClose();
        
      },
      onError: (data) => {
        snackActions.error("Failed to create instance: " + data);
      }
    })
    if (loading) {
     return <LinearProgress />;
    }
    const onConfigSubmit = () => {
      if(instanceName.length === 0){
        snackActions.warning("Must supply an instance name");
        return;
      }
        const config = currentParameters.reduce( (prev, cur) => {
          return {...prev, [cur.name]: cur.value}
        }, {});
        createInstance({variables: {operation_id: me.user.current_operation_id, instance_name: instanceName, c2profile_id: props.id, c2_instance: JSON.stringify(config)}})
    }
    const onChange = (name, value, error) => {
      setInstanceName(value);
    }
    const updateC2Parameter = (c2Name, parameterName, value, error) => {
      const c2params = currentParameters.map( (param) => {
        if (param.name === parameterName){
            return {...param, error, value}
        }
        return param;
      });
      console.log(c2params);
      setCurrentParameters(c2params);
    }
    const onChangeCreatedInstanceName = (evt) => {
      setSelectedInstance(evt.target.value);
      setInstanceName(evt.target.value);
      if(evt.target.value === ""){
        setCurrentParameters([...baseParameters]);
      }else{
        setCurrentParameters([]);
        getInstanceValues({variables: {name: evt.target.value, operation_id: me.user.current_operation_id}});
      }
    }
    const deleteInstanceButton = () => {
      setCurrentParameters([]);
      deleteInstance({variables: {name: selectedInstance, operation_id: me.user.current_operation_id}})
    }
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Save an Instance of {props.name}'s Parameters</DialogTitle>
        <DialogContent dividers={true}>
          <Typography style={{paddingBottom: "10px"}}>
            Saving an instance of the parameters allows you to select them from a dropdown when creating agents later, saving time and typos.
          </Typography>
            {createdInstances.length > 0 ? (
              <Grid container spacing={2} style={{paddingTop: "10px"}}>
                <Grid item xs={6}>
                  <FormControl style={{width: "100%"}}>
                  <InputLabel >Select an Existing Instance</InputLabel>
                      <Select
                        style={{width: "100%", marginBottom: "10px"}}
                        value={selectedInstance}
                        label="Select an Existing Instance"
                        onChange={onChangeCreatedInstanceName}
                      >
                        <MenuItem value="">New Instance</MenuItem>
                      {
                          createdInstances.map((opt, i) => (
                              <MenuItem key={"buildparamopt" + i} value={opt.instance_name}>{opt.instance_name}</MenuItem>
                          ))
                      }
                      </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  {selectedInstance.length > 0 ? (
                    <Button style={{backgroundColor: theme.palette.error.main, color: "white"}} variant="contained" onClick={deleteInstanceButton}> Delete Instance</Button>
                  ) : (null)}
                </Grid>
            </Grid>
            ) : (null)}
            <MythicTextField name="Instance Name" onChange={onChange} value={instanceName} style={{paddingTop: "10px"}}/>
            <CreatePayloadC2ProfileParametersTable {...props} returnAllDictValues={true} c2profileparameters={currentParameters} onChange={updateC2Parameter} />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={props.onClose} color="primary">
            Close
          </Button>
          <Button variant="contained" onClick={onConfigSubmit} color="secondary">
            {selectedInstance.length > 0 ? ("Update") : ("Create")}
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

