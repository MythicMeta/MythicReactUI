import React, {  } from 'react';
import {useQuery, gql} from '@apollo/client';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import { CreatePayloadNavigationButtons} from './CreatePayloadNavigationButtons';
import {CreatePayloadBuildParametersTable} from './CreatePayloadBuildParametersTable';
import Typography from '@mui/material/Typography';

const GET_Payload_Types = gql`
query getPayloadTypesBuildParametersQuery($os: String!) {
  payloadtype(where: {supported_os: {_ilike: $os}, deleted: {_eq: false}, wrapper: {_eq: false}}) {
    ptype
    file_extension
    supports_dynamic_loading
    buildparameters(where: {deleted: {_eq: false} }) {
      id
      name
      description
      default_value: parameter
      parameter_type
      required
      verifier_regex
    }
  }
}
 `;

export function Step2SelectPayloadType(props){
    const [selectedPayloadType, setSelectedPayloadType] = React.useState('');
    const [fileExtension, setFileExtension] = React.useState('');
    const [supportsDynamicLoading, setSupportsDynamicLoading] = React.useState(false);
    const [payloadTypeParameters, setSelectedPayloadTypeParameters] = React.useState([]);
    const { loading, error, data } = useQuery(GET_Payload_Types, {variables:{os: "%" + props.buildOptions + "%"},
        onCompleted: data => {
            if(data.payloadtype.length > 0){
                if(props.prevData !== undefined && props.prevData.os === props.buildOptions){
                    console.log(props.prevData);
                    setSelectedPayloadType(props.prevData.payload_type);
                    setFileExtension(props.prevData.file_extension);
                    setSupportsDynamicLoading(props.prevData.supports_dynamic_loading);
                    const payloadtypedata = data.payloadtype.reduce( (prev, payload) => {
                        if(payload.ptype === props.prevData.payload_type){
                            const params = payload.buildparameters.map( (param) => {
                                for(let p = 0; p < props.prevData.parameters.length; p++){
                                    if(props.prevData.parameters[p]["name"] === param.name){
                                        return {...param, error: param.required, value: props.prevData.parameters[p]["value"]}
                                    }
                                }
                            });
                            return [...prev, ...params];
                        }
                        return [...prev];
                    }, []);
                    payloadtypedata.sort((a,b) => -b.description.localeCompare(a.description));
                    setSelectedPayloadTypeParameters(payloadtypedata);
                }else{
                    setSelectedPayloadType(data.payloadtype[0].ptype);
                    setFileExtension(data.payloadtype[0].file_extension);
                    setSupportsDynamicLoading(data.payloadtype[0].supports_dynamic_loading);
                    const payloadtypedata = data.payloadtype.reduce( (prev, payload) => {
                        if(payload.ptype === data.payloadtype[0].ptype){
                            const params = payload.buildparameters.map( (param) => {
                                if(param.parameter_type === "ChooseOne"){
                                    return {...param, error: param.required, value: param.default_value.split("\n")[0]}
                                }else if(param.parameter_type === "Boolean"){
                                    return {...param, error: param.required, value: param.default_value.toLowerCase() === "true" ? true : false}
                                }else{
                                    return {...param, error: param.required, value: param.default_value}
                                }
                            });
                            return [...prev, ...params];
                        }
                        return [...prev];
                    }, []);
                    payloadtypedata.sort((a,b) => -b.description.localeCompare(a.description));
                    setSelectedPayloadTypeParameters(payloadtypedata);
                    console.log(payloadtypedata);
                }
                
                
            }
        }
    });

    
    const finished = () => {
        const finishedParams = payloadTypeParameters.map( (param) => {
            return {"name": param.name, "value": param.value}
        });
        props.finished({"payload_type": selectedPayloadType, 
                        "parameters": finishedParams, 
                        "file_extension": fileExtension, 
                        "supports_dynamic_loading": supportsDynamicLoading,
                        "os": props.buildOptions});
    }
    const canceled = () => {
        props.canceled();
    }
    const changePayloadType = (evt) => {
        setSelectedPayloadType(evt.target.value);
        const payloadtypedata = data.payloadtype.reduce( (prev, payload) => {
            if(payload.ptype === evt.target.value){
                setFileExtension(payload.file_extension);
                setSupportsDynamicLoading(payload.supports_dynamic_loading);
                const params = payload.buildparameters.map( (param) => {
                    console.log(param);
                    if(param.parameter_type === "ChooseOne"){
                        return {...param, error: param.required, value: param.default_value.split("\n")[0]}
                    }else if(param.parameter_type === "Boolean"){
                        return {...param, error: param.required, value: param.default_value.toLowerCase() === "true" ? true : false}
                    }else{
                        return {...param, error: param.required, value: param.default_value}
                    }
                    
                });
                return [...prev, ...params];
            }
            return [...prev];
        }, []);
        payloadtypedata.sort((a,b) => -b.description.localeCompare(a.description));
        setSelectedPayloadTypeParameters(payloadtypedata);
    }
    const onChange = (name, value, error) => {
        const newParams = payloadTypeParameters.map( (param) => {
            if(param.name === name){
                return {...param, value, error}
            }
            return {...param};
        });
        setSelectedPayloadTypeParameters(newParams);
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
            <Typography variant="h3" align="left" id="selectospage" component="div" 
                style={{"marginLeft": "10px"}}>
                  Select Target Payload Type
            </Typography>
            <Select
              native
              value={selectedPayloadType}
              onChange={changePayloadType}
            >
            {
                data.payloadtype.map((opt) => (
                    <option key={"step2" + opt.ptype} value={opt.ptype}>{opt.ptype}</option>
                ))
            }
            </Select><br/>
            <CreatePayloadBuildParametersTable onChange={onChange} buildParameters={payloadTypeParameters} />
            <CreatePayloadNavigationButtons first={props.first} last={props.last} canceled={canceled} finished={finished} />
        </div>
    );
} 
