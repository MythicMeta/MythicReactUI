import React, {useState} from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import MythicTextField from '../../MythicComponents/MythicTextField';
import {useQuery, gql, useMutation} from '@apollo/client';

const updateCommentMutation = gql`
mutation updateComment ($token_id: Int!, $description: String) {
  update_token_by_pk(pk_columns: {id: $token_id}, _set: {description: $description}) {
    description
    id
  }
}
`;
const getCommentQuery = gql`
query getCommentQuery ($token_id: Int!) {
  token_by_pk(id: $token_id) {
    description
    id
  }
}
`;

export function TokenDescriptionDialog(props) {
    const [comment, setComment] = useState("");
    useQuery(getCommentQuery, {
        variables: {token_id: props.token_id},
        onCompleted: data => {
            setComment(data.token_by_pk.description)
        },
        fetchPolicy: "network-only"
    });
    const [updateComment] = useMutation(updateCommentMutation, {
        onCompleted: (data) => {
          console.log('udpated');
          props.onClose();
        },
        onError: (data) => {
          console.error(data);
          props.onClose();
        }
        
    });
    const onCommitSubmit = () => {
        updateComment({variables: {token_id: props.token_id, description: comment}});
        
    }
    const onChange = (name, value, error) => {
        setComment(value);
    }
  
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Edit Token Description</DialogTitle>
        <DialogContent dividers={true}>
            <MythicTextField autoFocus onEnter={onCommitSubmit} onChange={onChange} value={comment} />
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
          <Button onClick={onCommitSubmit} variant="contained" color="secondary">
            Submit
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

