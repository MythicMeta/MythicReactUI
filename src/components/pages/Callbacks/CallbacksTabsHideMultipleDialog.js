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
import {useReactiveVar, useMutation} from '@apollo/client';
import {hideCallbackMutation} from './CallbackMutations';
import {snackActions} from '../../utilities/Snackbar';


const callbacksAndFeaturesQuery = gql`
query callbacksAndFeatures($operation_id: Int!) {
  callback(where: {operation_id: {_eq: $operation_id}, active: {_eq: true}}, order_by: {id: asc}) {
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

export function CallbacksTabsHideMultipleDialog({onClose}) {
    const me = useReactiveVar(meState);
    const classes = useStyles();
    const [checked, setChecked] = React.useState([]);
    const [left, setLeft] = React.useState([]);
    const [right, setRight] = React.useState([]);
    const leftChecked = intersection(checked, left);
    const rightChecked = intersection(checked, right);
    const updatedCallbacksSuccess = React.useRef(0);
    const updatedCallbacks = React.useRef(0);
    const [hideCallback] = useMutation(hideCallbackMutation, {
      update: (cache, {data}) => {
          updatedCallbacks.current += 1;
          if(data.updateCallback.status === "success"){
            updatedCallbacksSuccess.current += 1;
          }else{
              snackActions.warning(data.updateCallback.error);
          }
          if(updatedCallbacks.current === right.length){
            snackActions.success("Successfully updated " + updatedCallbacksSuccess.current + " callbacks status");
          }
          
      },
      onError: data => {
          console.log(data);
      }
    });
    useQuery(callbacksAndFeaturesQuery, {variables: {operation_id: me?.user?.current_operation_id || 0},
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
        const callbackData = data.callback.map( c => {
          // for each callback, get a unique set of supported features
          const display = `${c.id} - ${c.user}@${c.host} (${c.pid})`;
          return {...c, display};
        });
        setLeft(callbackData);
      }
    });
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

    const submitTasking = () => {
      if(right.length === 0){
        onClose();
        return;
      }
      for(let i = 0; i < right.length; i++){
        hideCallback({variables: {callback_id: right[i].id}});
      }
      
    }
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
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Hide Multiple Callbacks at Once</DialogTitle>
        <DialogContent dividers={true}>
        <Grid container spacing={0} justify="center" alignItems="center" className={classes.root}>
          <Grid item xs={5}>{customList("Visible Callbacks", left)}</Grid>
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
          <Grid item xs={5}>{customList("Callbacks To Hide", right)}</Grid>
          
        </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained" color="primary">
            Close
          </Button>
          <Button onClick={submitTasking} variant="contained" color="secondary">
            Hide
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

