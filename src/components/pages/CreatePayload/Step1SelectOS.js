import React from 'react';
import {useQuery, gql} from '@apollo/client';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';
import { CreatePayloadNavigationButtons} from './CreatePayloadNavigationButtons';
import Typography from '@material-ui/core/Typography';


const GET_Payload_Types = gql`
query getPayloadTypesQuery {
  payloadtype(where: {deleted: {_eq: false}, wrapper: {_eq: false}}) {
    id
    supported_os
  }
}
 `;

export function Step1SelectOS(props){
    const [os, setOS] = React.useState('');
    const [osOptions, setOSOptions] = React.useState([]);
    const { loading } = useQuery(GET_Payload_Types, {fetchPolicy: "network-only",
    onCompleted: (data) => {
        const optionsReduced= data.payloadtype.reduce((currentOptions, payloadtype) => {
            const adds = payloadtype.supported_os.split(",").reduce( (prev, os) => {
                    if(!currentOptions.includes(os)){
                        return [...prev, os];
                    }
                    return prev;
                }, []);
            return [...currentOptions, ...adds];
        }, []);
        const sortedOptions = optionsReduced.sort();
        console.log(props.prevData);
        if(props.prevData !== undefined){
            setOS(props.prevData);
        }
        else if(os === ""){
            setOS(sortedOptions[0]);
        }
        setOSOptions(sortedOptions);
    },
    onError: (data) => {
        console.error(data);
    }
    });

    if (loading) {
     return <div><CircularProgress /></div>;
    }
    const finished = () => {
        props.finished(os);
    }
    const canceled = () => {
        props.canceled();
    }
    return (
        <div >
        <Typography variant="h3" align="left" id="selectospage" component="div" 
            style={{ "marginLeft": "10px"}}>
              Select Target Operating System
        </Typography> <br/>
        
        <FormControl>
            <Select
              native
              value={os}
              onChange={evt => setOS(evt.target.value)}
            >
            {
                osOptions.map((opt) => (
                    <option key={"step1" + opt} value={opt}>{opt}</option>
                ))
            }
            </Select>
            <FormHelperText>Target Operating System</FormHelperText>
        </FormControl><br/><br/>
        <CreatePayloadNavigationButtons first={props.first} last={props.last} canceled={canceled} finished={finished} />
        </div>
    );
} 
