import React, {useEffect} from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MythicTextField from '../../MythicComponents/MythicTextField';
import DeleteIcon from '@material-ui/icons/Delete';
import {IconButton, Input, Button, MenuItem, Grid} from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import {
    MuiPickersUtilsProvider,
    KeyboardDatePicker,
  } from '@material-ui/pickers';
import 'date-fns';
import Switch from '@material-ui/core/Switch';
import DateFnsUtils from '@date-io/date-fns';
import {useTheme} from '@material-ui/core/styles';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';

export function CreatePayloadParameter({onChange, parameter_type, default_value, name, required, verifier_regex, id, description, value: passedValue, returnAllDictValues}){
    const [value, setValue] = React.useState("");
    const theme = useTheme();
    const [dictValue, setDictValue] = React.useState([]);
    const [dictOptions, setDictOptions] = React.useState([]);
    const [dictSelectOptions, setDictSelectOptions] = React.useState([]);
    const [dictSelectOptionsChoice, setDictSelectOptionsChoice] = React.useState("");
    const [chooseOptions, setChooseOptions] = React.useState([]);
    const [dateValue, setDateValue] = React.useState(new Date());
    const submitDictChange = (list) => {
        const condensed = list.reduce( (prev, opt) => {
            if(opt.value !== ""){
                return [...prev, {
                    custom: opt.name === "*" ? true : false,
                    key: opt.key,
                    name: opt.name,
                    value: opt.value
                }];
            }else{
                return [...prev];
            }
        }, []);
        onChange(name, condensed, false);
    };
    useEffect( () => {
        if(parameter_type === "ChooseOne"){
            if(default_value){
                const options = default_value.split("\n");
                setValue(options[0]);
                setChooseOptions(options); 
            }
            if(passedValue !== "" && passedValue !== undefined){
                setValue(passedValue);
                onChange(name, passedValue, "");
            }
        }else if(parameter_type === "Date"){
            if(default_value !== ""){
                var tmpDate = new Date();
                tmpDate.setDate(tmpDate.getDate() + parseInt(default_value));
                onChangeDate(tmpDate);
                setValue(-1);
            }
            if(passedValue !== "" && passedValue !== undefined && passedValue.includes("-")){
                console.log("passed date value: ", passedValue)
                setDateValue(new Date(passedValue));
                setValue(-1);
                onChange(name, (new Date(passedValue)).toISOString().slice(0,10), "");
            }
        }else if(parameter_type === "Dictionary" ){
            if(passedValue !== "" && passedValue !== undefined && typeof passedValue === "object"){
                console.log("passed dictionaryvalue", passedValue);
                let initial = passedValue.reduce( (prev, op) => {
                    // find all the options that have a default_show of true
                    if(op.default_show){
                        return [...prev, {...op} ];
                    }else{
                        return [...prev];
                    }
                }, [] );
                submitDictChange(initial);
                setDictValue(initial);
                setDictOptions(passedValue);
                let dictSelectOptionsInitial = passedValue.reduce( (prev, op) => {
                    //for each option, check how many instances of it are allowed
                    // then check how many we have currently
                    const count = initial.reduce( (preCount, cur) => {
                        if(cur.name === op.name){return preCount + 1}
                        return preCount;
                    }, 0);
                    if(op.max === -1 || op.max > count){
                        return [...prev, {...op} ];  
                    }else{
                        return [...prev]
                    }
                }, []);
                setDictSelectOptions(dictSelectOptionsInitial);
                if (dictSelectOptionsInitial.length > 0){
                    setDictSelectOptionsChoice(dictSelectOptionsInitial[0]);
                }
            }else{
                const options = JSON.parse(default_value);
                setDictOptions(options);
                let initial = options.reduce( (prev, op) => {
                    // find all the options that have a default_show of true
                    if(op.default_show){
                        return [...prev, {...op, value: op.default_value, key: op.name === "*" ? "": op.name} ];
                    }else{
                        return [...prev];
                    }
                }, [] );
                submitDictChange(initial);
                setDictValue(initial);
                let dictSelectOptionsInitial = options.reduce( (prev, op) => {
                    //for each option, check how many instances of it are allowed
                    // then check how many we have currently
                    const count = initial.reduce( (preCount, cur) => {
                        if(cur.name === op.name){return preCount + 1}
                        return preCount;
                    }, 0);
                    if(op.max === -1 || op.max > count){
                        return [...prev, {...op, value: op.default_value, key: op.name === "*" ? "": op.name} ];  
                    }else{
                        return [...prev]
                    }
                }, []);
                setDictSelectOptions(dictSelectOptionsInitial);
                if (dictSelectOptionsInitial.length > 0){
                    setDictSelectOptionsChoice(dictSelectOptionsInitial[0]);
                }
            }
        }else if(parameter_type === "Boolean"){
            if(default_value !== undefined){
                setValue( default_value.toLowerCase() === "true" ? true : false);
            }else{
                setValue(true);
            }
            if(passedValue !== "" && passedValue !== undefined){
                console.log(passedValue, true);
                setValue(passedValue);
            }
        }else{
            
            if(default_value !== undefined){
                setValue(default_value);
            }
            if(passedValue !== "" && passedValue !== undefined){
                setValue(passedValue);
                onChange(name, passedValue, "");
            }
            
        }
    }, [default_value, parameter_type, name]);
    
    const onChangeValue = (evt) => {
        setValue(evt.target.value);
        onChange(name, evt.target.value, false);
    }
    const onChangeText = (name, value, error) => {
        setValue(value);
        onChange(name, value, error);
    }
    const testParameterValues = (curVal) => {
        if( required && verifier_regex !== ""){
            return !RegExp(verifier_regex).test(curVal);
        }else if(verifier_regex !== "" && curVal !== ""){
            return !RegExp(verifier_regex).test(curVal);
        }else{
            return false;
        }
    }
    const onChangeDictVal = (evt, opt) => {
        const updated = dictValue.map( (op, i) => {
            if(i === opt){
                return {...op, value: evt.target.value};
            }else{
                return {...op}
            }
        } );
        submitDictChange(updated);
        setDictValue(updated);
    }
    const onChangeDictKey = (evt, index) => {
        const updated = dictValue.map( (op, i) => {
            if(i === index){
                return {...op, key: evt.target.value};
            }else{
                return {...op}
            }
        } );
        submitDictChange(updated);
        setDictValue(updated);
    }
    const addDictValEntry = () => {
        // add the selected value to our dict array
        let choice = {...dictSelectOptionsChoice};
        if(choice.name === "*"){
            choice.key = "";
            choice.value = "";
        }
        const newDictValue = [...dictValue, {...choice, default_show: true}]
        setDictValue(newDictValue);
        // updated the dict array to the new set of options
        let dictSelectOptionsInitial = dictSelectOptions.reduce( (prev, op) => {
            //for each option, check how many instances of it are allowed
            // then check how many we have currently
            let count = newDictValue.reduce( (preCount, cur) => {
                if(cur.name === op.name){return preCount + 1}
                return preCount;
            }, 0);
            if(choice.name === op.name){count += 1}
            if(op.max === -1 || op.max > count){
                return [...prev, {...op}];    
            }else{
                return [...prev]
            }
        }, []);
        submitDictChange(newDictValue);
        setDictSelectOptions(dictSelectOptionsInitial);
        if (dictSelectOptionsInitial.length > 0){
            setDictSelectOptionsChoice(dictSelectOptionsInitial[0]);
        }
    }
    const removeDictEntry = (i) => {
        const choice = dictValue[i];
        const newValues = dictValue.filter( (opt, index) => {
            if(i === index){return false};
            return true;
        });
        setDictValue(newValues);
        // updated the dict array to the new set of options
        let dictSelectOptionsInitial = dictOptions.reduce( (prev, op) => {
            //for each option, check how many instances of it are allowed
            // then check how many we have currently
            let count = newValues.reduce( (preCount, cur) => {
                if(cur.name === op.name){return preCount + 1}
                return preCount;
            }, 0);
            if(choice.name === op.name){count -= 1}
            if(op.max === -1 || op.max > count){
                return [...prev, {...op}];    
            }else{
                return [...prev]
            }
        }, []);
        submitDictChange(newValues);
        setDictSelectOptions(dictSelectOptionsInitial);
        if (dictSelectOptionsInitial.length > 0){
            setDictSelectOptionsChoice(dictSelectOptionsInitial[0]);
        }
    }
    const onChangeDate = (date) => {
        setDateValue(date)
        onChange(name, date.toISOString().slice(0,10), "");
    }
    const toggleSwitchValue = (evt) => {
        let newVal = !value;
        setValue(newVal);
        onChange(name, newVal, false);
    }
    const getParameterObject = () => {
        switch(parameter_type){
            case "Date":
                return (
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <Grid container justify="flex-start">
                            <KeyboardDatePicker
                            disableToolbar
                            variant="inline"
                            format="MM/dd/yyyy"
                            margin="normal"
                            value={dateValue}
                            onChange={onChangeDate}
                            KeyboardButtonProps={{
                                'aria-label': 'change date',
                            }}
                            />
                        </Grid>
                    </MuiPickersUtilsProvider>
                )
            case "ChooseOne":
                return (
                    <FormControl>
                        <Select
                          native
                          value={value}
                          onChange={onChangeValue}
                        >
                        {
                            chooseOptions.map((opt, i) => (
                                <option key={"buildparamopt" + i} value={opt}>{opt}</option>
                            ))
                        }
                        </Select>
                    </FormControl>
                )
            case "Dictionary":
                return (
                    <React.Fragment>
                        {dictValue.map( (opt, i) => (
                            <div key={"dictval" + i}>
                                <IconButton onClick={(e) => {removeDictEntry(i)}}><DeleteIcon style={{color: theme.palette.error.main}} /> </IconButton>
                                {opt.name === "*" ? 
                                    (
                                        <Input style={{width:"20%"}} startAdornment={<Button disabled>Key</Button>} size="small" value={opt.key} onChange={(e) => onChangeDictKey(e, i)}></Input>
                                    ) : (
                                        <Input variant="outlined" size="small" style={{width:"20%"}} startAdornment={<Button disabled>key</Button>} value={opt.key} ></Input>
                                    ) 
                                }
                                <Input style={{width:"75%"}} startAdornment={<Button disabled>value</Button>} size="small" value={opt.value} onChange={(e) => onChangeDictVal(e, i)}></Input>
                            </div>
                        )
                        )}
                        {dictSelectOptions.length > 0 ? (
                            <div>
                                <IconButton onClick={addDictValEntry}> <AddCircleIcon style={{color: theme.palette.success.main}}  /> </IconButton>
                                <Select size="small" value={dictSelectOptionsChoice} onChange={(e) => setDictSelectOptionsChoice(e.target.value)}>
                                    {dictSelectOptions.map( (selectOpt, i) => (
                                        <MenuItem key={"selectopt" + name + i} value={selectOpt}>{selectOpt.name === "*" ? "Custom Key": selectOpt.name}</MenuItem>
                                    ) )}
                                </Select>
                                
                            </div>
                        ) : (null) 
                        }
                    </React.Fragment>
                )
            case "String":
                return (
                    <MythicTextField required={required} value={value} multiline={true}
                        onChange={onChangeText} display="inline-block" name={name}
                        validate={testParameterValues} errorText={"Must match: " + verifier_regex}
                    />
                )
            case "Boolean":
                return (
                      <Switch
                        checked={value}
                        onChange={toggleSwitchValue}
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                      />
                )
           default:
            return null
        }
    }
    
    return (
            <TableRow key={"buildparam" + id}>
                <TableCell>
                    <MythicStyledTooltip title={name.length > 0 ? name : "No Description"}>
                        {description}
                    </MythicStyledTooltip>
                 </TableCell>
                <TableCell>
                    {getParameterObject()}
                </TableCell>
            </TableRow>
        )
}

