import React from 'react';
import {useQuery, gql, useLazyQuery} from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import CircularProgress from '@material-ui/core/CircularProgress';
import { CreatePayloadNavigationButtons} from './CreatePayloadNavigationButtons';
import {CreatePayloadC2ProfileParametersTable} from './CreatePayloadC2ProfileParametersTable';
import Typography from '@material-ui/core/Typography';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import * as RandExp from 'randexp';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';


const GET_Payload_Types = gql`
query getPayloadTypesC2ProfilesQuery($payloadType: String!, $operation_id: Int!) {
  c2profile(where: {payloadtypec2profiles: {payloadtype: {ptype: {_eq: $payloadType}}}, deleted: {_eq: false}}) {
    name
    is_p2p
    description
    id
    c2profileparameters(where: {deleted: {_eq: false}}) {
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
      c2profile {
          name
      }
    }
    id
    value
  }
}
`;

export function Step4C2Profiles(props){
    const me = useReactiveVar(meState);
    const [c2Profiles, setC2Profiles] = React.useState([]);
    const [selectedInstance, setSelectedInstance] = React.useState("");
    const { loading, error } = useQuery(GET_Payload_Types, {variables:{payloadType: props.buildOptions["payload_type"], operation_id: me.user.current_operation_id},
        onCompleted: data => {
            const profiles = data.c2profile.map( (c2) => {
                if(props.prevData !== undefined){
                    //console.log(props.prevData);
                    for(let p = 0; p < props.prevData.length; p++){
                        if(props.prevData[p]["name"] === c2.name){
                            // we selected this c2 profile before and clicked back, so re-fill it out
                            const parameters = props.prevData[p]["c2profileparameters"].map( (c) => {
                                if(c.parameter_type === 'Dictionary'){
                                    const original = JSON.parse(c.default_value);
                                    const fixedArray = c.value.map( (p) => {
                                        // p looks like {"name": "something", "key": "something", "value": "something", "custom": true/false}
                                        // we're missing the "max" limiter from the original that we need to add back in
                                        const originalPiece = original.find( o => o["name"] === p["name"]);
                                        if(originalPiece !== undefined){
                                            return {...originalPiece, ...p, "default_show": p.value === "" ? false : true}
                                        }
                                        return {...p, "default_show": false}
                                    });
                                    // now that we've added in the `max` value for each of the keys we had, we need to add back in the original possibilities that we didn't select
                                    const final = original.reduce( (prev, cur) => {
                                        //console.log("looking for", cur, "in", prev)
                                        if(prev.findIndex( o => o["name"] === cur["name"]) > -1 ){
                                            return [...prev]
                                        }
                                        return [...prev, {...cur, default_show: false, "key": cur.name === "*" ? "": cur.name, value: cur.default_value}]
                                    }, [...fixedArray])
                                    return {...c, value: final};
                                    
                                }
                                return c;
                            })
                            
                            parameters.sort((a,b) => -b.description.localeCompare(a.description));
                            return {...c2, "selected": props.prevData[p]["selected"], c2profileparameters: parameters};
                        }
                    }
                }
                
                const parameters = c2.c2profileparameters.map( (param) => {
                    if(param.format_string !== ""){
                        const random = new RandExp(param.format_string).gen();
                        return {...param, default_value: random, value: random}
                    }else if(param.default_value !== ""){
                        if(param.parameter_type === "ChooseOne"){
                            return {...param, value: param.default_value.split("\n")[0]}
                        }else if(param.parameter_type === "Dictionary"){
                            let tmp = JSON.parse(param.default_value);
                            let initial = tmp.reduce( (prev, op) => {
                                return [...prev, {...op, value: op.default_value, key: op.name === "*" ? "": op.name, default_show: op.default_show} ];
                            }, [] );
                            return {...param, value: initial}
                        }else if(param.parameter_type === "Date"){
                            var tmpDate = new Date();
                            if(param.default_value !== ""){
                                tmpDate.setDate(tmpDate.getDate() + parseInt(param.default_value));
                            }
                            return {...param, value: tmpDate.toISOString().slice(0,10)}
                        }else{
                            return {...param, value: param.default_value}
                        }
                    }else{
                        return {...param, error: param.required, value: param.default_value}
                    }
                    
                });
                parameters.sort((a,b) => -b.description.localeCompare(a.description));
                return {...c2, "selected": false, c2profileparameters: parameters};
            });
            profiles.sort((a, b) => -b.name.localeCompare(a.name))
            //console.log(profiles);
            setC2Profiles(profiles);
        },
        fetchPolicy: "no-cache"
    });
    const finished = () => {
        let allValid = true;
        let includedC2 = false;
        const adjustedC2 = c2Profiles.reduce( (prev, c2) => {
            if(c2.selected){
                const params = c2.c2profileparameters.map( (p) => {
                    if(p.parameter_type === "Dictionary"){
                        const values = p.value.filter(v => v.value !== "");
                        return {...p, value: values};
                    }else{
                        return {...p};
                    }
                })
                return [...prev, {...c2, c2profileparameters: params}];
            }else{
                return [...prev, {...c2}];
            }
        }, []);
        c2Profiles.forEach( (c2) => {
            if(c2.selected){
                includedC2 = true;
                c2.c2profileparameters.forEach( (param) => {
                    if(param.error){
                        snackActions.warning(c2.name + "'s parameter " + param.name + " is invalid");
                        allValid = false;
                    }
                });
            }
        });
        if(allValid){
            //console.log(c2Profiles);
            if(!includedC2){
                snackActions.warning("Must select at least one C2 to include");
                return;
            }
            props.finished(adjustedC2);
        }
    }
    const canceled = () => {
        props.canceled();
    }
    const toggleC2Selection = (evt, c2) => {
        const updatedc2 = c2Profiles.map( (curc2) => {
            if(c2.name === curc2.name){
                return {...curc2, selected: !curc2.selected}
            }
            return curc2;
        });
        setC2Profiles(updatedc2);
    }
    const updateC2Parameter = (c2Name, parameterName, value, error) => {
        const updatedc2 = c2Profiles.map( (curC2) => {
            if(curC2.name === c2Name){
                const c2params = curC2.c2profileparameters.map( (param) => {
                    if (param.name === parameterName){
                        return {...param, error, value}
                    }
                    return param;
                });
                return {...curC2, c2profileparameters: c2params};
            }
            return curC2;
        });
        setC2Profiles(updatedc2);
    }
    const [getInstanceValues] = useLazyQuery(getProfileInstaceQuery, {
        onCompleted: (data) => {
          const updates = data.c2profileparametersinstance.map( (cur) => {
            let inst = {...cur, ...cur.c2profileparameter};
            if(inst.parameter_type === "Dictionary" || inst.parameter_type === "Array"){
                inst["value"] = JSON.parse(inst["value"]);
                const original = JSON.parse(inst.default_value);
                const fixedArray = inst.value.map( (p) => {
                    // p looks like {"name": "something", "key": "something", "value": "something", "custom": true/false}
                    // we're missing the "max" limiter from the original that we need to add back in
                    const originalPiece = original.find( o => o["name"] === p["name"]);
                    if(originalPiece !== undefined){
                        return {...originalPiece, ...p, "default_show": p.value === "" ? false : true}
                    }
                    return {...p, "default_show": false}
                });
                // now that we've added in the `max` value for each of the keys we had, we need to add back in the original possibilities that we didn't select
                const final = original.reduce( (prev, current) => {
                    //console.log("looking for", cur, "in", prev)
                    if(prev.findIndex( o => o["name"] === current["name"]) > -1 ){
                        return [...prev]
                    }
                    return [...prev, {...current, default_show: false, "key": current.name === "*" ? "": current.name, value: current.default_value}]
                }, [...fixedArray])
                return {...inst, value: final};
            }
            return inst;
          })
          updates.sort( (a, b) => a.name < b.name ? -1 : 1);
          const updatedc2 = c2Profiles.map( (curc2) => {
            if(updates[0].c2profile.name === curc2.name){
                return {...curc2, c2profileparameters: updates};
            }
            return curc2;
        });
        setC2Profiles(updatedc2);
        },
        onError: (data) => {
          snackActions.error("Failed to fetch instance data: " + data);
          console.log(data);
        },
        fetchPolicy: "no-cache"
      })
    const onChangeCreatedInstanceName = (evt, c2) => {
        setSelectedInstance(evt.target.value);
        if(evt.target.value !== ""){
            const updatedc2 = c2Profiles.map( (curc2) => {
                if(c2.name === curc2.name){
                    curc2.c2profileparameters = [];
                }
                return curc2;
            });
            setC2Profiles(updatedc2);
            getInstanceValues({variables: {name: evt.target.value, operation_id: me.user.current_operation_id}});
        }
      }
      if (loading) {
        return <div><CircularProgress /></div>;
       }
       if (error) {
        console.error(error);
        return <div>Error!</div>;
       }
    return (
        <div >
            <Typography variant="h3" align="left" id="selectc2profiles" component="div" 
                style={{"marginLeft": "10px"}}>
                  Select C2 Profiles
            </Typography>
            {
                c2Profiles.map( (c2) => (
                <React.Fragment key={"step4c2switch" + c2.id}>
                    <FormControlLabel
                      value="top"
                      control={
                      <Switch
                        checked={c2.selected}
                        onChange={evt => toggleC2Selection(evt, c2)}
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                        name="active"
                      />}
                      label={c2.name}
                      labelPlacement="top"
                      style={{display: "inline"}}
                    />
                    {c2.c2profileparametersinstances.length > 0 && c2.selected ? (
                        <FormControl style={{width: "100%"}}>
                        <InputLabel >Select an Existing Instance</InputLabel>
                            <Select
                              style={{width: "100%", marginBottom: "10px"}}
                              value={selectedInstance}
                              label="Select an Existing Instance"
                              onChange={evt => onChangeCreatedInstanceName(evt, c2)}
                            >
                              <MenuItem value="">New Instance</MenuItem>
                            {
                                c2.c2profileparametersinstances.map((opt, i) => (
                                    <MenuItem key={"buildparamopt" + i} value={opt.instance_name}>{opt.instance_name}</MenuItem>
                                ))
                            }
                            </Select>
                        </FormControl>
                    ) : (null)}
                    <Typography variant="body1" align="left" id="selectc2profiles" component="div" key={"step4desc" + c2.id}
                        style={{"marginLeft": "10px"}}>
                          {c2.description}
                    </Typography>
                    { c2.selected ? ( 
                        <CreatePayloadC2ProfileParametersTable key={"step4table" + c2.id} returnAllDictValues={false} {...c2} onChange={updateC2Parameter} />
                        ):(null)
                    }
                </React.Fragment>
                ))
            }
<br/>
            <CreatePayloadNavigationButtons first={props.first} last={props.last} canceled={canceled} finished={finished} />
            <br/><br/>
        </div>
    );
} 
