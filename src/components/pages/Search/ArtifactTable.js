import React, { useEffect } from 'react';
import {Typography, Link} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


export function ArtifactTable(props){
    const [artifacts, setArtifacts] = React.useState([]);
    useEffect( () => {
        setArtifacts([...props.artifacts]);
    }, [props.artifacts]);

    return (
        <TableContainer component={Paper} className="mythicElement" style={{}}>
            <Table stickyHeader size="small" style={{}}>
                <TableHead>
                    <TableRow>
                        <TableCell >Type</TableCell>
                        <TableCell >Command</TableCell>
                        <TableCell >Task</TableCell>
                        <TableCell >Callback</TableCell>
                        <TableCell >Host</TableCell>
                        <TableCell >Artifact</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {artifacts.map( (op) => (
                    <ArtifactTableRow
                        key={"cred" + op.id}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

function ArtifactTableRow(props){
    return (
        <React.Fragment>
            <TableRow hover>
                <TableCell>
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.artifact.name}</Typography>
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{props.task.command.cmd}</Typography>
                </TableCell>
                <TableCell>
                    <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" 
                        href={"/new/task/" + props.task.id}>
                            {props.task.id}
                    </Link>
                </TableCell>
                <TableCell>
                    <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" 
                        href={"/new/callbacks/" + props.task.callback_id}>
                            {props.task.callback_id}
                    </Link>
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>{props.host}</Typography>
                </TableCell>
                <TableCell>
                <Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>{props.artifact_instance_text}</Typography>
                </TableCell>
              
            </TableRow>
        </React.Fragment>
    )
}

