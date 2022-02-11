import React from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import {muiTheme} from '../../../themes/Themes.js';
import {useQuery, gql } from '@apollo/client';
import LinearProgress from '@mui/material/LinearProgress';
import makeStyles from '@mui/styles/makeStyles';

const getPayloadTypes = gql`
query getAllPayloadTypes{
  payloadtype(where: {wrapper: {_eq: false}}, order_by: {ptype: asc}) {
    ptype
  }
}
`;
const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
    width: "97%"
  },
}));
export function SelectPayloadTypeDialog(props) {
    const classes = useStyles();
    const [payloadtypeOptions, setPayloadtypeOptions] = React.useState([]);
    const [selectedPayloadType, setSelectedPayloadType] = React.useState('');
    const handleSubmit = () => {
        if(selectedPayloadType === ""){
          props.onClose();
          return;
        }
        props.onSubmit(selectedPayloadType);
        props.onClose();
    }
    const handleChange = (event) => {
      setSelectedPayloadType(event.target.value);
    }
    const { loading, error } = useQuery(getPayloadTypes, {
        onCompleted: data => {
            const options = data.payloadtype.map( p => p.ptype);
            if(options.length > 0){
              setSelectedPayloadType(options[0]);
            }
            setPayloadtypeOptions(options);
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
        <DialogTitle >Select a Payload Type to Filter On</DialogTitle>
        <DialogContent dividers={true}>
            <React.Fragment>
                <FormControl className={classes.formControl}>
                  <Select
                    labelId="demo-dialog-select-label-profile"
                    id="demo-dialog-select"
                    
                    value={selectedPayloadType}
                    onChange={handleChange}
                    style={{minWidth: "30%"}}
                  >
                    <MenuItem value="">
                      None
                    </MenuItem>
                    {payloadtypeOptions.map( (opt) => (
                        <MenuItem value={opt} key={opt}>{opt}</MenuItem>
                    ) )}
                  </Select>
                </FormControl>
            </React.Fragment>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
          <Button onClick={handleSubmit} variant="contained" style={{backgroundColor: muiTheme.palette.success.main}}>
            Select
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

