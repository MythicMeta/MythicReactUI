import React from 'react';
import { OperationTable } from './OperationTable';
import {useQuery, gql} from '@apollo/client';
import {CommandBlockListTable} from './CommandBlockListTable';
import { snackActions } from '../../utilities/Snackbar';

const GET_Operations = gql`
query GetOperations {
  operation(order_by: {name: asc}) {
    complete
    name
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
      id
    }
  }
  operator(where: {active: {_eq: true}, deleted: {_eq: false}}) {
    id
    username
  }
}
`;
const GET_BlockLists = gql`
query getBlockLists {
  disabledcommandsprofile(order_by: {name: asc}) {
    id
    name
    command{
      id
      cmd
      payloadtype{
        ptype
      }
    }
  }
}
`;
export function Operations(props){
  const [blockLists, setBlockLists] = React.useState([]);
  const [operations, setOperations] = React.useState([]);
    useQuery(GET_Operations, {fetchPolicy: "network-only",
      onCompleted: (data) => {
        setOperations(data.operation);
      },
      onError: (data) => {
        snackActions.error("Failed to get list of operations");
      }
    });
    useQuery(GET_BlockLists, {fetchPolicy: "network-only",
      onCompleted: (data) => {
        const condensed = data.disabledcommandsprofile.reduce( (prev, cur) => {
          if(prev[cur.name] === undefined){
            prev[cur.name] = {};
          }
          if(prev[cur.name][cur.command.payloadtype.ptype] === undefined){
            prev[cur.name][cur.command.payloadtype.ptype] = [];
          }
          prev[cur.name][cur.command.payloadtype.ptype].push(cur);
          return {...prev};
        }, {});
        // now break out into array
        let arrayForm = [];
        for(const [key, value] of Object.entries(condensed)){
          arrayForm.push({"name": key, entries: value});
        }
        setBlockLists(arrayForm);
      },
      onError: (data) => {
        snackActions.error("Failed to get blocklist options");
      } 
    });
    const onUpdateOperation = ({id, name, complete}) => {
      const updatedOperations = operations.map( o => {
        if(o.id === id){
          return {...o, name, complete};
        }
        return {...o};
      })
      setOperations(updatedOperations);
    }
    const onNewOperation = ({id, name, admin}) => {
      setOperations([...operations, {id, name, admin}])
    }
    return (
      <div style={{  height: "100%", display: "flex", flexDirection: "column"}}>
        <OperationTable operations={operations} onUpdateOperation={onUpdateOperation} onNewOperation={onNewOperation}/>
        <CommandBlockListTable blockLists={blockLists} />
      </div>
    );
} 
