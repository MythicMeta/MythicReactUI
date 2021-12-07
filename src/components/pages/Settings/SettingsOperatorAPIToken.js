import React from 'react';
import {Button} from '@material-ui/core';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import DeleteIcon from '@material-ui/icons/Delete';

export function APITokenRow(props){
    
    return (
            <TableRow key={"apitokenRow" + props.id}>
                <TableCell><Button size="small" onClick={() => {props.onDeleteAPIToken(props.id)}} startIcon={<DeleteIcon/>} color="secondary" variant="contained">Delete</Button></TableCell>
                <TableCell>{props.token_value}</TableCell>
            </TableRow>
        )
}

