import React from 'react';
import { MitreGrid } from './MitreGrid';
import {useQuery, gql, useLazyQuery} from '@apollo/client';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import { Backdrop } from '@material-ui/core';
import {CircularProgress} from '@material-ui/core';

const Get_MITREATTACK = gql`
query GetMitreAttack {
  attack(order_by: {t_num: asc}){
    id
    name
    t_num
    os
    tactic
  }
}
`;
const Get_TaskAttacks= gql`
query GetMitreTaskAttack($operation_id: Int!) {
  attacktask(where: {task: {callback: {operation_id: {_eq: $operation_id}}}}) {
    attack_id
    task {
      id
      command_name
      comment
      display_params
      callback {
        id
        payload {
          payloadtype {
            ptype
          }
        }
      }
    }
  }
}
`;
const Get_CommandAttacks= gql`
query GetMitreCommandAttack{
  attackcommand {
    attack_id
    command {
      cmd
      payloadtype {
        ptype
      }
    }
  }
}
`;

export function MitreAttack(props){
    const me = useReactiveVar(meState);
    const [backdropOpen, setBackdropOpen] = React.useState(true);
    const [mitreAttack, setMitreAttack] = React.useState({
      "Reconnaissance": {rows: [], tactic: "Reconnaissance", commands: 0, tasks: 0},
      "Resource Development": {rows: [], tactic: "Resource Development", commands: 0, tasks: 0},
      "Initial Access": {rows: [], tactic: "Initial Access", commands: 0, tasks: 0},
      "Execution": {rows: [], tactic: "Execution", commands: 0, tasks: 0},
      "Persistence": {rows: [], tactic: "Persistence", commands: 0, tasks: 0},
      "Privilege Escalation": {rows: [], tactic: "Privilege Escalation", commands: 0, tasks: 0},
      "Defense Evasion": {rows: [], tactic: "Defense Evasion", commands: 0, tasks: 0},
      "Credential Access": {rows: [], tactic: "Credential Access", commands: 0, tasks: 0},
      "Discovery": {rows: [], tactic: "Discovery", commands: 0, tasks: 0},
      "Lateral Movement": {rows: [], tactic: "Lateral Movement", commands: 0, tasks: 0},
      "Collection": {rows: [], tactic: "Collection", commands: 0, tasks: 0},
      "Command And Control": {rows: [], tactic: "Command And Control", commands: 0, tasks: 0},
      "Exfiltration": {rows: [], tactic: "Exfiltration", commands: 0, tasks: 0},
      "Impact": {rows: [], tactic: "Impact", commands: 0, tasks: 0},
    });
    
    const [getCommands] = useLazyQuery(Get_CommandAttacks,{
      onError: data => {
        console.error(data)
      },
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        if(data.attackcommand.length === 0){
          snackActions.info("No commands associated with MITRE ATT&CK");
          return;
        }
        let attackCommands = [...data.attackcommand];
        let updatingMitre = {...mitreAttack};
        for(const key in updatingMitre){
          let column_total = 0;
          for(let i = 0; i < updatingMitre[key].rows.length; i++){
            // updatingMitre[key].rows[i] is a specific cell in the attack matrix
            // now check if there's a data.attackcommand entry with attack_id == updatingMitre[key].rows[i].id
            updatingMitre[key].rows[i].commands = [];
            attackCommands = attackCommands.filter( (attackcommand) => {
              //console.log(attackcommand, updatingMitre[key].rows[i]);
              if(attackcommand.attack_id === updatingMitre[key].rows[i].id){
                updatingMitre[key].rows[i].commands.push({...attackcommand.command});
                // we've already added this entry from data.attackcommand, so not bother processing it for the next row/column
                return false;
              }
              return true;
            });
            column_total += updatingMitre[key].rows[i].commands.length;
          }
          updatingMitre[key].commands = column_total;
        }
        setMitreAttack(updatingMitre);
      }
    });
    const [getTasks] = useLazyQuery(Get_TaskAttacks,{
      onError: data => {
        console.error(data)
      },
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        if(data.attacktask.length === 0){
          snackActions.info("No tasks associated with MITRE ATT&CK");
          return;
        }
        let attackTasks = [...data.attacktask];
        let updatingMitre = {...mitreAttack};
        for(const key in updatingMitre){
          let column_total = 0;
          for(let i = 0; i < updatingMitre[key].rows.length; i++){
            // updatingMitre[key].rows[i] is a specific cell in the attack matrix
            // now check if there's a data.attackcommand entry with attack_id == updatingMitre[key].rows[i].id
            updatingMitre[key].rows[i].tasks = [];
            attackTasks = attackTasks.filter( (attacktask) => {
              //console.log(attackcommand, updatingMitre[key].rows[i]);
              if(attacktask.attack_id === updatingMitre[key].rows[i].id){
                updatingMitre[key].rows[i].tasks.push({...attacktask.task});
                // we've already added this entry from data.attackcommand, so not bother processing it for the next row/column
                return false;
              }
              return true;
            });
            column_total += updatingMitre[key].rows[i].tasks.length;
          }
          updatingMitre[key].tasks = column_total;
        }
        setMitreAttack(updatingMitre);
      }
    });
    useQuery(Get_MITREATTACK, {
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
        const mitre = data.attack.reduce( (prev, cur) => {
          const entry = {...cur, os: JSON.parse(cur["os"]), tactic: JSON.parse(cur["tactic"]), commands: [], tasks: []};
          let p = {...prev};
          for(let i = 0; i < entry.tactic.length; i++){
            if(p[entry.tactic[i]]){
              // the tactic exists already, so we can just add this as a row
              p[entry.tactic[i]].rows.push(entry);
            }else{
              p[entry.tactic[i]] = {rows: [entry], tactic: entry.tactic[i], commands: 0, tasks: 0};
            }
          }
          return {...p};
        }, {});
        
        setMitreAttack(mitre);
        setBackdropOpen(false);
      },
      onError: (error) => {
        snackActions.error("Failed to fetch MITRE data: " + error.toString());
      }
    });
    const onGetTasks = () => {
      getTasks({variables: {operation_id: me?.user?.current_operation_id || 0}});
    }
    return (
      <React.Fragment>
        <Backdrop open={backdropOpen} style={{zIndex: 2, position: "absolute"}} invisible={false}>
            <CircularProgress color="inherit" />
        </Backdrop>
        <MitreGrid entries={mitreAttack} onGetCommands={getCommands} onGetTasks={onGetTasks}/>
      </React.Fragment>
        
    );
} 
