import React, {useState} from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import MythicTextField from '../../MythicComponents/MythicTextField';
import {useQuery, gql} from '@apollo/client';
import LinearProgress from '@material-ui/core/LinearProgress';

const getParametersQuery = gql`
query getParametersQuery ($task_id: Int!) {
  task_by_pk(id: $task_id) {
    display_params
    original_params
    params
    tasking_location
    parameter_group_name
    id
  }
}
`;

export function TaskViewParametersDialog(props) {
    const [comment, setComment] = useState("");
    const { loading, error } = useQuery(getParametersQuery, {
        variables: {task_id: props.task_id},
        onCompleted: data => {
            let workingComment = "Original Parameters:\n" + data.task_by_pk.original_params;
            workingComment += "\n\nAgent Parameters:\n" + data.task_by_pk.params;
            workingComment += "\n\nDisplay Parameters:\n" + data.task_by_pk.display_params;
            workingComment += "\n\nTasking Location:\n" + data.task_by_pk.tasking_location;
            workingComment += "\n\nParameter Group:\n" + data.task_by_pk.parameter_group_name;
            setComment(workingComment);
        },
        fetchPolicy: "network-only"
    });
    if (loading) {
     return <LinearProgress />;
    }
    if (error) {
     console.error(error);
     return <div>Error!</div>;
    }
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">View Task Parameters</DialogTitle>
        <DialogContent dividers={true}>
            <MythicTextField multiline={true} value={comment} onChange={() => {}}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

