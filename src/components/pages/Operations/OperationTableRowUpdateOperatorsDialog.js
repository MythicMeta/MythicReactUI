import React, {  } from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {gql, useMutation, useQuery} from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import {OperationTableRowUpdateOperatorsDialogRow} from './OperationTableRowUpdateOperatorsDialogRow';

const GET_Operations = gql`
query GetOperation($operation_id: Int!) {
  operation_by_pk(id: $operation_id) {
    id
    admin {
      username
      id
    }
    operatoroperations {
      view_mode
      operator {
        username
        id
      }
      disabledcommandsprofile {
        name
        id
      }
      id
    }
  }
  operator(where: {active: {_eq: true}, deleted: {_eq: false}}) {
    id
    username
  }
  disabledcommandsprofile(where: {operation_id: {_eq: $operation_id}}, distinct_on: name, order_by: {name: asc}) {
    name
    id
  }
}
`;
const Update_Lead = gql`
mutation updateLeadMutation($operation_id: Int!, $admin_id: Int!) {
  update_operation_by_pk(pk_columns: {id: $operation_id}, _set: {admin_id: $admin_id}) {
    admin {
      id
      username
    }
    id
  }
}
`;
const Update_OperatorViewMode = gql`
mutation updateOperatorViewMode($operatoroperation_id: Int!, $view_mode: String!, $disabledcommandsprofile: Int) {
  update_operatoroperation_by_pk(pk_columns: {id: $operatoroperation_id}, _set: {view_mode: $view_mode, base_disabled_commands_id: $disabledcommandsprofile}) {
    id
    view_mode
  }
}`;
const Remove_OperatorFromOperation = gql`
mutation removeOperatorsFromOperation($operatoroperation_ids: [Int!]!) {
  delete_operatoroperation(where: {id: {_in: $operatoroperation_ids}}) {
    returning {
      id
    }
  }
}`;
const Add_OperatorsToOperation = gql`
mutation addNewOperators($operators: [operatoroperation_insert_input!]!) {
  insert_operatoroperation(objects: $operators) {
    returning {
      id
    }
  }
}`;
export function OperationTableRowUpdateOperatorsDialog(props) {
    const [operators, setOperators] = React.useState([]);
    const [admin, setAdmin] = React.useState({});
    const [originalOperators, setOriginalOperators] = React.useState([]);
    const [commandBlockLists, setCommandBlockLists] = React.useState([]);
    useQuery(GET_Operations, {variables: {operation_id: props.id}, fetchPolicy: "network-only",
      onCompleted: (data) => {
        const allOperators = data.operator.map( (operator) => {
          return {...operator, checked: false}
        });
        setOriginalOperators(data.operation_by_pk.operatoroperations);
        setAdmin(data.operation_by_pk.admin);
        const updateAssignments = allOperators.map( (operator) => {
          const assigned = data.operation_by_pk.operatoroperations.find( (op) => op.operator.id === operator.id );
          if( assigned ){
            if(assigned.operator.id === data.operation_by_pk.admin.id){
              return {...operator, checked: true, view_mode: "lead", operatoroperation_id: assigned.id, disabledcommandsprofile: assigned.disabledcommandsprofile};
            }
            return {...operator, checked: true, view_mode: assigned.view_mode, operatoroperation_id: assigned.id, disabledcommandsprofile: assigned.disabledcommandsprofile};
          }
          return {...operator, view_mode: "operator"};
        });
        updateAssignments.sort( (a,b) => a.username > b.username ? 1 : -1)
        setOperators(updateAssignments);
        const blockListNames = [...data.disabledcommandsprofile];
        setCommandBlockLists(blockListNames)
      },
      onError: (data) => {
        snackActions.error("Failed to get operational data");
        console.error(data);
      }
    });
    const [updateOperationLead] = useMutation(Update_Lead, {
      onCompleted: (data) => {
        snackActions.success("Successfully updated Lead");
      },
      onError: (data) => {
        snackActions.error("Failed to update operation");
        console.log("error updating operation", data);
      }
    })
    const [addOperators] = useMutation(Add_OperatorsToOperation, {
      onCompleted: (data) => {
        snackActions.success("Sucessfully added operators");
      },
      onError: (data) => {
        snackActions.error("Failed to add operators");
        console.error("error adding operators to operation", data);
      }
    })
    const [removeOperatorsMutation] = useMutation(Remove_OperatorFromOperation, {
      onCompleted: (data) => {
        snackActions.success("Sucessfully removed operators");
      },
      onError: (data) => {
        snackActions.error("Failed to remove operators");
        console.error("error removing operators from operation", data);
      }
    })
    const [updateOperatorViewMode] = useMutation(Update_OperatorViewMode, {
      onCompleted: (data) => {
        snackActions.success("Successfully updated operator view mode");
      },
      onError: (data) => {
        snackActions.error("Failed to update operator view mode");
        console.error("failed to update view mode: ", data);
      }
    })
    const onAccept = () =>{
      // make sure there is only one with view_mode of "lead"
      //   set that operator as the lead, add/remove the other operators
      const newAdmin = operators.find( (op) => op.view_mode === "lead");
      if(!newAdmin){
        snackActions.error("No Lead for the operation is set");
        return;
      }
      if(newAdmin.id !== admin.id){
        updateOperationLead({variables: {
          operation_id: props.id,
          admin_id: newAdmin.id
        }});
      }
      // now loop through the props.assignedOperators to see 
      let newOperators = [];
      let removeOperators = [];
      operators.forEach( (op) => {
        let oldMatch = originalOperators.find( (oop) => oop.operator.id === op.id);
        if(oldMatch){
          // op was listed in the original set, so we're looking to update or remove based on checked/view_mode
          if(op.checked){
            // op is still checked, so just a potential update
            if(op.view_mode !== oldMatch.view_mode || op.disabledcommandsprofile !== oldMatch.disabledcommandsprofile){
              updateOperatorViewMode({variables: {operatoroperation_id: oldMatch.id, view_mode: op.view_mode, disabledcommandsprofile: op.disabledcommandsprofile?op.disabledcommandsprofile.id:null}});
            }
          }
          else{
            // op is unchecked, but was originally listed, so remove this operator
            removeOperators.push(oldMatch.id);
          }
          //op was checked then, is checked now, and nothing changed. just move on
        }else{
          //op wasn't listed, so if checked is true, then we want to add them to the operation
          if(op.checked){
            newOperators.push({operation_id: props.id, operator_id: op.id, view_mode: op.view_mode});
          }
          // op wasnt checked then, isn't checked now, so move on
        }
      });
      if(newOperators.length > 0){
        addOperators({variables: {operators: newOperators}});
      }
      if(removeOperators.length > 0){
        removeOperatorsMutation({variables: {operatoroperation_ids: removeOperators}});
      }      
      props.onClose();
    }
    const updateOperator = (op) => {
      let updates = [...operators];
      if(op.view_mode === "lead"){
        //make sure nobody else has this, if they do, demote them down to "operator"
        updates = updates.map( (operator) => {
          if(operator.view_mode === "lead"){
            return {...operator, view_mode: "operator"}
          }
          return {...operator}
        });
      }
      updates = updates.map( (operator) => {
        if(operator.id === op.id){
          return {...op};
        }
        return {...operator};
      });
      setOperators(updates);
    }
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Modify Operator Assignments</DialogTitle>
        <DialogContent dividers={true}>
          <TableContainer component={Paper} className="mythicElement" style={{maxHeight: "calc(50vh)"}}>   
              <Table  size="small" style={{"tableLayout": "fixed", "maxWidth": "calc(100vw)", "overflow": "scroll"}}>
                  <TableHead>
                      <TableRow>
                          <TableCell style={{width: "8rem"}}>Assign to Operation</TableCell>
                          <TableCell style={{width: "8rem"}}>Operator</TableCell>
                          <TableCell style={{width: "10rem"}}>Role</TableCell>
                          <TableCell >Block List</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                  
                  {operators.map( (op) => (
                      <OperationTableRowUpdateOperatorsDialogRow
                          key={"operator" + op.id} operator={op} updateOperator={updateOperator} commandBlockLists={commandBlockLists}
                      />
                  ))}
                  </TableBody>
              </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Cancel
          </Button>
          <Button onClick={onAccept} variant="contained" color="warning">
            Update
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

