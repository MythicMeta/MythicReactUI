import React, {useRef, useEffect} from 'react';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';

export function CallbacksTabsTaskingInputTokenSelect(props) {
    const [options, setOptions] = React.useState([]);
    const [selected, setSelected] = React.useState('');
    const inputRef = useRef(null); 
    const handleChange = (event) => {
        setSelected(event.target.value);
        props.changeSelectedToken(event.target.value);
      };
    useEffect( () => {
        const opts = [...props.options];
        setOptions(opts);
        if(opts.length > 0){
            setSelected("Default Token");
            props.changeSelectedToken("Default Token");
        }else{
            setSelected("Default Token");
            props.changeSelectedToken("Default Token");
        }
    }, [props.options]);
    const renderValue = (value) => {
      if(value === "Default Token"){
        return "Default Token";
      }
      if(value.User === null){
        if(value.description === null){
          return value.TokenId + " - No Description";
        }else{
          return value.TokenId + " - " + value.description;
        }
      }else{
        if(value.description === null){
          return value.TokenId + " - " + value.User;
        }else{
          return value.TokenId + " - " + value.User + " - " + value.description;
        }
        
      }
    }
  return (
      <FormControl style={{width: "20%"}}>
        <InputLabel ref={inputRef}>Tokens</InputLabel>
        <Select
          labelId="demo-dialog-select-label"
          id="demo-dialog-select"
          value={selected}
          onChange={handleChange}
          variant="filled"
          renderValue={renderValue}
          input={<Input style={{width: "100%"}}/>}
        >
          <MenuItem value={"Default Token"} key={0}>Default Token</MenuItem>
          {options.map( (opt) => (
              <MenuItem value={opt.token} key={opt.token.id}>{opt.token.User === null ? opt.token.TokenId + (opt.token.description === null ? " - No Description" : " - " + opt.token.description) : opt.token.User + " - " + opt.token.description}</MenuItem>
          ) )}
        </Select>
      </FormControl>
  );
}

