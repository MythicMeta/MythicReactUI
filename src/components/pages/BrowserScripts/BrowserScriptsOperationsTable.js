import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { BrowserScriptsOperationsTableRow } from './BrowserScriptsOperationsTableRow';
import {useTheme} from '@material-ui/core/styles';


export function BrowserScriptsOperationsTable(props){
    const theme = useTheme();
    return (
        props.browserscriptoperation.length > 0 &&
            <React.Fragment>
                <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main, marginBottom: "5px", marginTop: "10px", marginRight: "5px"}} variant={"elevation"}>
                    <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                        Operation Browser Scripts
                    </Typography>
                </Paper>
                <TableContainer component={Paper} className="mythicElement" style={{maxHeight: "calc(30vh)"}}>
                    <Table size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                        <TableHead>
                            <TableRow>
                                <TableCell style={{width: "10em"}}>Payload</TableCell>
                                <TableCell style={{}}>Command</TableCell>
                                <TableCell style={{width: "5em"}}>User Modified?</TableCell>
                                <TableCell style={{}}>Operator</TableCell>
                                <TableCell style={{width: "5em"}}>View Script</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {props.browserscriptoperation.map( (op) => (
                            <BrowserScriptsOperationsTableRow
                                key={"opscriptrow" + op.browserscript.id}
                                {...op}
                            />
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </React.Fragment>
    )
}

