import React, {useEffect} from 'react';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MythicTextField from '../../MythicComponents/MythicTextField';
import DeleteIcon from '@mui/icons-material/Delete';
import {IconButton, Input, Button, MenuItem, Grid} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import DesktopDatePicker from '@mui/lab/DesktopDatePicker';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import 'date-fns';
import {useTheme} from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import Paper from '@mui/material/Paper';

export function CreatePayloadParameter({onChange, parameter_type, default_value, name, required, verifier_regex, id, description, value: passedValue, returnAllDictValues}){
    const [value, setValue] = React.useState("");
    const [multiValue, setMultiValue] = React.useState([]);
    const theme = useTheme();
    const [dictValue, setDictValue] = React.useState([]);
    const [dictOptions, setDictOptions] = React.useState([]);
    const [dictSelectOptions, setDictSelectOptions] = React.useState([]);
    const [dictSelectOptionsChoice, setDictSelectOptionsChoice] = React.useState("");
    const [chooseOptions, setChooseOptions] = React.useState([]);
    const [dateValue, setDateValue] = React.useState(new Date());
    const [arrayValue, setArrayValue] = React.useState([""]);
    const submitDictChange = (list) => {
        const condensed = list.map( (opt) => {
            if(returnAllDictValues){
                return{
                    custom: opt.name === "*" ? true : false,
                    ...opt
                }
            }
            return {[opt.key]: opt.value};
        });
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
        }else if(parameter_type === "ChooseMultiple"){
            if(default_value){
                const options = default_value.split("\n");
                setMultiValue([options[0]]);
                setChooseOptions(options); 
            }
            if(passedValue !== "" && passedValue !== undefined){
                //console.log("setting passed value", passedValue);
                if(typeof passedValue === "string"){
                    const options = default_value.split("\n");
                    setMultiValue([options[0]]);
                    setChooseOptions(options); 
                } else {
                    setMultiValue(passedValue);
                    onChange(name, passedValue, "");
                }
                
            }
        }else if(parameter_type === "Array"){
            if(default_value !== ""){
                setArrayValue(JSON.parse(default_value));
            }
            if(passedValue !== "" && passedValue !== undefined){
                if(typeof passedValue === "string"){
                    setArrayValue(JSON.parse(passedValue))
                }else{
                    setArrayValue(passedValue);
                }
                
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
                setDateValue(new Date(passedValue));
                setValue(-1);
                onChange(name, (new Date(passedValue)).toISOString().slice(0,10), "");
            }
        }else if(parameter_type === "Dictionary" ){
            if(passedValue !== "" && passedValue !== undefined && typeof passedValue === "object"){
                let initial = passedValue.reduce( (prev, op) => {
                    // find all the options that have a default_show of true
                    if(op.default_show || op.value !== ""){
                        return [...prev, {...op} ];
                    }else{
                        return [...prev];
                    }
                }, [] );
                submitDictChange(initial);
                setDictValue(initial);
                setDictOptions(passedValue);
                let originalOptions = JSON.parse(default_value);
                let dictSelectOptionsInitial = [];
                originalOptions.forEach( (v, i, a) => {
                    // loop through all of the original values and see if we need to add any to the bottom options to add
                    if(v.max === -1){
                        dictSelectOptionsInitial.push(v);
                    }else{
                        const count = initial.reduce( (preCount, cur) => {
                            if(cur.name === v.name){return preCount + 1}
                            return preCount;
                        }, 0);
                        if(v.max > count){
                            dictSelectOptionsInitial.push(v);
                        }
                    }
                });
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
            console.log(default_value, passedValue)
            if(default_value !== undefined){
                setValue( default_value.toLowerCase() === "true" ? true : false);
            }else{
                setValue(true);
            }
            if(passedValue !== "" && passedValue !== undefined){
                if(typeof(passedValue) === "string"){
                    setValue(passedValue.toLowerCase() === "true" ? true : false)
                }else{
                    setValue(passedValue);
                }
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
    const onChangeMultValue = (evt) => {
        const { options } = evt.target;
        const tmpValue = [];
        for (let i = 0, l = options.length; i < l; i += 1) {
          if (options[i].selected) {
            tmpValue.push(options[i].value);
          }
        }
        setMultiValue(tmpValue);
        setValue(tmpValue);
        onChange(name, tmpValue, false);
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
        const choice = dictSelectOptionsChoice;
        setDictValue([...dictValue, choice]);
        // updated the dict array to the new set of options
        let dictSelectOptionsInitial = dictSelectOptions.reduce( (prev, op) => {
            //for each option, check how many instances of it are allowed
            // then check how many we have currently
            let count = dictValue.reduce( (preCount, cur) => {
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
        submitDictChange(dictSelectOptionsInitial);
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
                return [...prev, {...op, value: op.default_value, key: op.name === "*" ? "": op.name}];    
            }else{
                return [...prev]
            }
        }, []);
        submitDictChange(dictSelectOptionsInitial);
        setDictSelectOptions(dictSelectOptionsInitial);
        if (dictSelectOptionsInitial.length > 0){
            setDictSelectOptionsChoice(dictSelectOptionsInitial[0]);
        }
    }
    const onChangeDate = (date) => {
        setDateValue(date)
        onChange(name, date.toISOString().slice(0,10), "");
    }
    const addNewArrayValue = () => {
        const newArray = [...arrayValue, ""];
        setArrayValue(newArray);
        onChange(name, newArray, false);
    }
    const removeArrayValue = (index) => {
        let removed = [...arrayValue];
        removed.splice(index, 1);
        setArrayValue(removed);
        onChange(name, removed, false);
    }
    const onChangeArrayText = (value, error, index) => {
        let values = [...arrayValue];
        if(value.includes("\n")){
            let new_values = value.split("\n");
            values = [...values, ...new_values.slice(1)];
            values[index] = values[index] + new_values[0];
        }else{
            values[index] = value;
        }
        
        setArrayValue(values);
        onChange(name, values, false);
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
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container justifyContent="flex-start">
                            <DesktopDatePicker
                            disableToolbar
                            variant="inline"
                            inputFormat="MM/dd/yyyy"
                            margin="normal"
                            value={dateValue}
                            onChange={onChangeDate}
                            renderInput={(params) => <TextField {...params} />}
                            />
                        </Grid>
                    </LocalizationProvider>
                );
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
                );
            case "ChooseMultiple":
                return (
                    <FormControl>
                        <Select
                            native
                            value={multiValue}
                            multiple={true}
                            onChange={onChangeMultValue}
                        >
                        {
                            chooseOptions.map((opt, i) => (
                                <option key={"buildparamopt" + i} value={opt}>{opt}</option>
                            ))
                        }
                        </Select>
                    </FormControl>
                );
            case "Array":
                return (
                    <TableContainer component={Paper} className="mythicElement">
                        <Table size="small" style={{tableLayout: "fixed", maxWidth: "100%", "overflow": "auto"}}>
                            <TableBody>
                                {arrayValue.map( (a, i) => (
                                    <TableRow key={'array' + name + i} hover>
                                        <TableCell style={{width: "4rem"}}>
                                            <IconButton onClick={(e) => {removeArrayValue(i)}} size="large"><DeleteIcon color="error" /> </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <MythicTextField required={required} fullWidth={true} placeholder={""} value={a} multiline={true}
                                                onChange={(n,v,e) => onChangeArrayText(v, e, i)} display="inline-block"
                                                validate={testParameterValues} errorText={"Must match: " + verifier_regex}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow hover>
                                    <TableCell style={{width: "5rem"}}>
                                        <IconButton onClick={addNewArrayValue} size="large"> <AddCircleIcon color="success"  /> </IconButton>
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            case "Dictionary":
                return (
                    <React.Fragment>
                        {dictValue.map( (opt, i) => (
                            <div key={"dictval" + i}>
                                <IconButton onClick={(e) => {removeDictEntry(i)}} size="large"><DeleteIcon style={{color: theme.palette.error.main}} /> </IconButton>
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
                                <IconButton onClick={addDictValEntry} size="large"> <AddCircleIcon style={{color: theme.palette.success.main}}  /> </IconButton>
                                <Select size="small" value={dictSelectOptionsChoice} onChange={(e) => setDictSelectOptionsChoice(e.target.value)}>
                                    {dictSelectOptions.map( (selectOpt, i) => (
                                        <MenuItem key={"selectopt" + name + "i"} value={selectOpt}>{selectOpt.name === "*" ? "Custom Key": selectOpt.name}</MenuItem>
                                    ) )}
                                </Select>
                                
                            </div>
                        ) : (null) 
                        }
                    </React.Fragment>
                );
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
                        checked={Boolean(value)}
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

