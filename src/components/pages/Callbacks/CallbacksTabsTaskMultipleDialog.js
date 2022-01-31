import React, {useEffect} from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';
import {useQuery, gql } from '@apollo/client';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import MenuItem from '@material-ui/core/MenuItem';
import {TaskFromUIButton} from './TaskFromUIButton';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';


const callbacksAndFeaturesQuery = gql`
query callbacksAndFeatures($operation_id: Int!) {
  callback(where: {operation_id: {_eq: $operation_id}, active: {_eq: true}}, order_by: {id: asc}) {
    loadedcommands(where: {command: {supported_ui_features: {_ilike: "%callback_table%"}}}) {
      command {
        supported_ui_features
      }
    }
    id
    host
    user
    process_name
    pid
  }
}`;

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 'auto',
  },
  paper: {
    width: 200,
    height: 500,
  },
  button: {
    margin: theme.spacing(0.5, 0),
  },
  divider: {
    backgroundColor: "rgb(100, 170, 204)",
    border: "2px solid rgba(100, 170, 204)"
  }
}));

function not(a, b) {
  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(a, b) {
  return a.filter((value) => b.indexOf(value) !== -1);
}

export function CallbacksTabsTaskMultipleDialog({onClose}) {
    const me = useReactiveVar(meState);
    const [featureOptions, setFeatureOptions] = React.useState([]);
    const [selectedFeature, setSelectedFeature] = React.useState("");
    const classes = useStyles();
    const [checked, setChecked] = React.useState([]);
    const [left, setLeft] = React.useState([]);
    const [right, setRight] = React.useState([]);
    const leftChecked = intersection(checked, left);
    const rightChecked = intersection(checked, right);
    const inputRef = React.useRef(null); 
    const [openTaskingButton, setOpenTaskingButton] = React.useState(false);
    const taskingData = React.useRef({});
    const leftToTask = React.useRef([]);
    const startTasking = React.useRef(false);
    const finalTaskedParameters = React.useRef(null);
    useQuery(callbacksAndFeaturesQuery, {variables: {operation_id: me?.user?.current_operation_id || 0},
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
        const callbackData = data.callback.map( c => {
          // for each callback, get a unique set of supported features
          const features = c.loadedcommands.reduce( (prev, cur) => {
            // for each command, get their set of supported features
            const featureList = cur.command.supported_ui_features.split("\n");
            // iterate over those supported features in the command and add them to the running list for the callback
            // if the callback doesn't currently have it listed
            let runningSet = [...prev];
            featureList.forEach( feature => {
              // for each new feature in this current command, see if we have it before, if not, push it
              if(!runningSet.includes(feature) && feature.startsWith("callback_table")){
                runningSet.push(feature);
              }
            });
            return [...runningSet];
          }, []);
          const display = `${c.id} - ${c.user}@${c.host} (${c.pid})`
          return {...c, features: features, display};
        });
        setLeft(callbackData);
      }
    });
    React.useEffect( () =>{
      //based on what's in the `right` variable, we can update the featureOptions to be the intersection of those values
      let allFeatures = [];
      if(right.length >= 1){
        allFeatures = [...right[0].features];
        for(let i = 1; i < right.length; i++){
          let intersection = [];
          for(let j = 0; j < allFeatures.length; j++){
            if(right[i].features.includes(allFeatures[j])){
              intersection.push(allFeatures[j]);
            }
          }
          allFeatures = [...intersection];
        }
      }
      setFeatureOptions(allFeatures);
      if(allFeatures.length > 0){
        setSelectedFeature(allFeatures[0]);
      }else{
        setSelectedFeature('');
      }
    }, [right]);
    const handleToggle = (value) => () => {
      const currentIndex = checked.indexOf(value);
      const newChecked = [...checked];

      if (currentIndex === -1) {
        newChecked.push(value);
      } else {
        newChecked.splice(currentIndex, 1);
      }

      setChecked(newChecked);
    };

    const handleAllRight = () => {
      setRight(right.concat(left));
      setLeft([]);
    };

    const handleCheckedRight = () => {
      setRight(right.concat(leftChecked));
      setLeft(not(left, leftChecked));
      setChecked(not(checked, leftChecked));
    };

    const handleCheckedLeft = () => {
      setLeft(left.concat(rightChecked));
      setRight(not(right, rightChecked));
      setChecked(not(checked, rightChecked));
    };

    const handleAllLeft = () => {
      setLeft(left.concat(right));
      setRight([]);
    };
    const issueNextTasking = () => {
      let callback = leftToTask.current.shift(1);
      if(callback){
        if(finalTaskedParameters.current){
          taskingData.current = {ui_feature: selectedFeature, callback_id: callback.id, openDialog: false, parameters: finalTaskedParameters.current, tasking_location: "modal"};
        }else{
          taskingData.current = {ui_feature: selectedFeature, callback_id: callback.id, openDialog: true, parameters: "", tasking_location: "modal"};
        }
        setOpenTaskingButton(true);
      }else{
        onClose();
        return;
      }
    }
    const submitTasking = () => {
      if(right.length === 0 || selectedFeature === ""){
        onClose();
        return;
      }
      startTasking.current = true;
      leftToTask.current = [...right];
      issueNextTasking();
    }
    const onTasked = ({tasked, variables}) => {
      if(tasked){
        console.log("setting finalTaskedParameters to", variables);
        finalTaskedParameters.current = variables;
        setOpenTaskingButton(false);
      }else{
        onClose()
        return;
      }
      
    }
    React.useEffect( () => {
      if(startTasking.current){
        if(!openTaskingButton){
          issueNextTasking();
        }
      }
    }, [openTaskingButton, startTasking])
    const customList = (title, items) => (
      <Paper className={classes.paper} style={{width:"100%"}}>
        <Card>
          <CardHeader
            className={classes.cardHeader}
            title={title}
          />
          <Divider classes={{root: classes.divider}}/>
          <div style={{overflow: "auto"}}>
            <List dense component="div" role="list" style={{padding:0}}>
              {items.map((value) => {
                const labelId = `transfer-list-item-${value.id}-label`;
                return (
                  <ListItem style={{padding:0}} key={value.id} role="listitem" button onClick={handleToggle(value)}>
                    <ListItemIcon>
                      <Checkbox
                        checked={checked.indexOf(value) !== -1}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </ListItemIcon>
                    <ListItemText id={labelId} primary={value.display} />
                  </ListItem>
                );
              })}
              <ListItem />
            </List>
          </div>
          
          </Card>
      </Paper>
    );
    const handleChange = (event) => {
      setSelectedFeature(event.target.value);
    };
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Task Multiple Callbacks at Once</DialogTitle>
        <DialogContent dividers={true}>
        <Grid container spacing={0} justify="center" alignItems="center" className={classes.root}>
          <Grid item xs={5}>{customList("Callbacks Not Being Tasked", left)}</Grid>
          <Grid item xs={1}>
            <Grid container direction="column" alignItems="center">
              <Button
                variant="outlined"
                size="small"
                className={classes.button}
                onClick={handleAllRight}
                disabled={left.length === 0}
                aria-label="move all right"
              >
                ≫
              </Button>
              <Button
                variant="outlined"
                size="small"
                className={classes.button}
                onClick={handleCheckedRight}
                disabled={leftChecked.length === 0}
                aria-label="move selected right"
              >
                &gt;
              </Button>
              <Button
                variant="outlined"
                size="small"
                className={classes.button}
                onClick={handleCheckedLeft}
                disabled={rightChecked.length === 0}
                aria-label="move selected left"
              >
                &lt;
              </Button>
              <Button
                variant="outlined"
                size="small"
                className={classes.button}
                onClick={handleAllLeft}
                disabled={right.length === 0}
                aria-label="move all left"
              >
                ≪
              </Button>
            </Grid>
          </Grid>
          <Grid item xs={5}>{customList("Callbacks To Task", right)}</Grid>
          <Grid item xs={12}>
            <pre>
              {"The following capabilities are loaded into all of the selected callbacks. Select one to issue mass tasking."}
            </pre>
            <InputLabel ref={inputRef}>Supported UI Features</InputLabel>
            <Select
              labelId="demo-dialog-select-label"
              id="demo-dialog-select"
              value={selectedFeature}
              onChange={handleChange}
              disabled={featureOptions.length === 0}
              variant="filled"
              input={<Input style={{width: "100%"}}/>}
            >
              {featureOptions.map( (opt) => (
                  <MenuItem value={opt} key={opt}>{opt.split(":")[1]}</MenuItem>
              ) )}
            </Select>
          </Grid>
        </Grid>
        </DialogContent>
        {openTaskingButton && 
            <TaskFromUIButton ui_feature={taskingData.current?.ui_feature || " "} 
                callback_id={taskingData?.current?.callback_id || 0} 
                parameters={taskingData.current?.parameters || ""}
                openDialog={taskingData.current?.openDialog || false}
                tasking_location={taskingData.current?.tasking_location || "command_line"}
                onTasked={onTasked}/>
        }  
        <DialogActions>
          <Button onClick={onClose} variant="contained" color="primary">
            Close
          </Button>
          <Button onClick={submitTasking} variant="contained" color="secondary">
            Submit
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

