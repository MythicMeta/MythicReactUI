import React, {useState} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MythicTextField from '../../MythicComponents/MythicTextField';
import {useQuery, gql, useReactiveVar, useMutation} from '@apollo/client';
import LinearProgress from '@mui/material/LinearProgress';
import { meState } from '../../../cache';
import makeStyles from '@mui/styles/makeStyles';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { IconButton } from '@mui/material';
import {snackActions} from '../../utilities/Snackbar';

const addTaskTagMutation = gql`
mutation addTaskTag ($task_id: Int!, $tag: String!) {
  insert_tasktag_one(object: {task_id: $task_id, tag: $tag}){
    id
  }
}
`;
const removeTaskTagMutation = gql`
mutation removeTaskTag($tasktag_id: Int!){
  delete_tasktag_by_pk(id: $tasktag_id){
    id
  }
}
`;
const getTaskTagsQuery = gql`
query getTaskTags ($operation_id: Int!) {
  tasktag(where: {operation_id: {_eq: $operation_id}}) {
    id
    tag
    task_id
  }
}
`;
const useStyles = makeStyles((theme) => ({
  root: {
    margin: 'auto',
    paddingBottom: "10px"
  },
  paper: {
    width: 200,
    height: 230,
    overflow: 'auto',
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
  
export function TaskTagDialog(props) {
    const [newTag, setNewTag] = useState("");
    const me = useReactiveVar(meState);
    const { loading, error } = useQuery(getTaskTagsQuery, {
        variables: {operation_id: me.user.current_operation_id},
        onCompleted: data => {
          const currentTags = data.tasktag.reduce( (prev, cur) => {
            if(cur.task_id === props.task_id){
              return [...prev, cur];
            }else{
              return [...prev];
            }
          }, []);
          const allTags = data.tasktag.reduce( (prev, cur) => {
            if(prev.find( element => element.tag === cur.tag) || currentTags.find( element => element.tag === cur.tag)){
              return [...prev];
            }else{
              return [...prev, cur];
            }
          }, []);
          
          setLeft(allTags);
          setRight(currentTags);
          setOriginalTags([...currentTags]);
        },
        fetchPolicy: "network-only"
    });
    const [addTaskTag] = useMutation(addTaskTagMutation, {
        update: (cache, {data}) => {
            //console.log(data);
        }
    });
    const [removeTaskTag] = useMutation(removeTaskTagMutation, {
      update: (cache, {data}) => {
          //console.log(data);
      }
  });
    const classes = useStyles();
    const [checked, setChecked] = React.useState([]);
    const [left, setLeft] = React.useState([]);
    const [right, setRight] = React.useState([]);
    const [originalTags, setOriginalTags] = React.useState([]);
    const leftChecked = intersection(checked, left);
    const rightChecked = intersection(checked, right);

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

    const customList = (title, items) => (
      <Paper className={classes.paper} style={{width:"100%"}}>
        <Card>
          <CardHeader
            className={classes.cardHeader}
            title={title}
          />
          <Divider classes={{root: classes.divider}}/>
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
                  <ListItemText id={labelId} primary={value.tag} />
                </ListItem>
              );
            })}
            <ListItem />
          </List>
          </Card>
      </Paper>
    );
    if (loading) {
     return <LinearProgress />;
    }
    if (error) {
     console.error(error);
     return <div>Error!</div>;
    }
    const onChange = (name, value, error) => {
        setNewTag(value);
    }
    const addNewTag = () => {
      if(!right.find(element => element.tag === newTag) && !left.find(element => element.tag === newTag)){
        if(newTag !== ""){
          setRight([...right, {tag: newTag, id: 0, task_id: 0}]);
        }
      }
      setNewTag("");
    }
    const setFinalTags = () => {

      originalTags.forEach( (tag) => {
        // go through the original tags and see if they exist in the right, if so, move on
        // if the tag doesn't exist, we delete it
        if(!right.find(element => element.id === tag.id)){
          removeTaskTag({variables: {tasktag_id: tag.id}});
        }
      });
      right.forEach( (tag) => {
        // go through the right tags and see if they existed in the original, if so, move on
        // if the tag doesn't exist, we add it
        if(!originalTags.find(element => element.id === tag.id)){
          addTaskTag({variables: {task_id: props.task_id, tag: tag.tag}});
        }
      });
      if(newTag !== ""){
        addTaskTag({variables: {task_id: props.task_id, tag: newTag}});
      }
      snackActions.success("Updated tags");
      props.onClose();
    }
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Edit Task Tags</DialogTitle>
        <DialogContent dividers={true}>
        <Grid container spacing={2} justifyContent="center" alignItems="center" className={classes.root}>
          <Grid item xs={5}>{customList("Unused Tags In Operation", left)}</Grid>
          <Grid item>
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
          <Grid item xs={5}>{customList("Applied Tags To Task", right)}</Grid>
        </Grid>
        <MythicTextField autoFocus multiline={false} name="Add New Tag..." onChange={onChange} value={newTag} style={{display:"inline-block"}} 
          InputProps={{
                    endAdornment:
                    <React.Fragment>
                    <IconButton
                      color="success"
                      variant="contained"
                      onClick={addNewTag}
                      size="large"><NoteAddIcon/></IconButton>
                    </React.Fragment>
                }}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
          <Button onClick={setFinalTags} variant="contained" color="success">
            Submit
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

