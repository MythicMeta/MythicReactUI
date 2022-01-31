import React, { } from 'react';
import {Button} from '@material-ui/core';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import EditIcon from '@material-ui/icons/Edit';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import { OperationTableRowUpdateOperatorsDialog } from './OperationTableRowUpdateOperatorsDialog';
import { meState } from '../../../cache';
import {useReactiveVar, useMutation, gql} from '@apollo/client';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import AssessmentIcon from '@material-ui/icons/Assessment';
import AssignmentIndIcon from '@material-ui/icons/AssignmentInd';
import {OperationTableRowNotificationsDialog} from './OperationTableRowNotificationsDialog';
import { snackActions } from '../../utilities/Snackbar';

const updateCurrentOpertionMutation = gql`
mutation updateCurrentOpertionMutation($operator_id: Int!, $operation_id: Int!) {
  updateCurrentOperation(user_id: $operator_id, operation_id: $operation_id) {
    status
    error
    operation_id
  }
}
`;
export function OperationTableRow(props){
    const [openUpdateNotifications, setOpenUpdateNotifications] = React.useState(false);
    const [openUpdateOperators, setOpenUpdateOperators] = React.useState(false);
    const me = useReactiveVar(meState);
    const [updateCurrentOperation] = useMutation(updateCurrentOpertionMutation, {
      onCompleted: (data) => {
        if(data.updateCurrentOperation.status === "success"){
          meState({...meState(), user: {...meState().user, current_operation_id: data.updateCurrentOperation.operation_id, current_operation: props.name}});
          localStorage.setItem("user", JSON.stringify(meState().user));
          snackActions.success("Updated current operation");
        }else{
          snackActions.error(data.updateCurrentOperation.error);
        }
      },
      onError: (data) => {
        snackActions.error("Failed to update current operation");
        console.error(data);
      }
    })
    const makeCurrentOperation = () => {
      updateCurrentOperation({variables: {operator_id: me.user.user_id, operation_id: props.id}})
    }
    return (
        <React.Fragment>
            <TableRow key={props.id} hover>
                <TableCell><Button size="small" onClick={()=>{setOpenUpdateNotifications(true);}} startIcon={<EditIcon/>} color={props.complete ? "secondary" : "primary"} variant="contained">Edit</Button>
                {openUpdateNotifications && 
                    <MythicDialog open={openUpdateNotifications} fullWidth maxWidth={"lg"}
                        onClose={()=>{setOpenUpdateNotifications(false);}} 
                        innerDialog={<OperationTableRowNotificationsDialog onClose={()=>{setOpenUpdateNotifications(false);}} id={props.id} onUpdateOperation={props.onUpdateOperation} />}
                     />
                }
                </TableCell>
                <TableCell><Button size="small" onClick={()=>{setOpenUpdateOperators(true);}} startIcon={<AssignmentIndIcon/>} color={props.complete ? "secondary" : "primary"} variant="contained">Edit</Button>
                {openUpdateOperators && 
                    <MythicDialog open={openUpdateOperators} maxHeight={"calc(80vh)"} fullWidth maxWidth={"md"}
                        onClose={()=>{setOpenUpdateOperators(false);}} 
                        innerDialog={<OperationTableRowUpdateOperatorsDialog id={props.id} onClose={()=>{setOpenUpdateOperators(false);}}/>}
                     />
                }
                </TableCell>
                <TableCell>{props.name} {props.complete ? " (Completed) " : ""}</TableCell>
                <TableCell>{props.admin.username}</TableCell>
                <TableCell>
                <Button size="small" startIcon={<AssessmentIcon/>} onClick={() => {snackActions.warning("Not Implemented")}} color="primary" variant="contained">Analysis</Button>
                </TableCell>
                <TableCell>{props.id === me.user.current_operation_id ? ("Current Operation") : (
                  <React.Fragment>
                    <Button size="small"startIcon={<PlayArrowIcon/>} onClick={makeCurrentOperation} color="primary" variant="contained">Make Current</Button>
                   
                  </React.Fragment>
                )}</TableCell>
            </TableRow>
        </React.Fragment>
        )
}

