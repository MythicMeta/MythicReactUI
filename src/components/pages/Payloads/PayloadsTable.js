import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { PayloadsTableRow } from './PayloadsTableRow';
import {useTheme} from '@material-ui/core/styles';
import AddCircleOutlineOutlinedIcon from '@material-ui/icons/AddCircleOutlineOutlined';
import {ImportPayloadConfigDialog} from './ImportPayloadConfigDialog';
import { MythicDialog } from '../../MythicComponents/MythicDialog';


export function PayloadsTable({payload, onDeletePayload, onUpdateCallbackAlert}){
    const theme = useTheme();
    const [openPayloadImport, setOpenPayloadImport] = React.useState(false);
    return (
        <React.Fragment>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                    Payloads
                </Typography>
                <Button size="small" href="/new/createpayload" style={{float: "right", marginTop: "10px", marginRight: "30px"}} startIcon={<AddCircleOutlineOutlinedIcon/>} color="primary" variant="contained">New Payload</Button>
                <Button size="small" onClick={() => setOpenPayloadImport(true)} style={{float: "right", marginTop: "10px", marginRight: "30px"}} startIcon={<AddCircleOutlineOutlinedIcon/>} color="primary" variant="contained">Import Payload Config</Button>
                {openPayloadImport ? (
                    <MythicDialog fullWidth={true} maxWidth="sm" open={openPayloadImport} 
                        onClose={()=>{setOpenPayloadImport(false);}} 
                        innerDialog={<ImportPayloadConfigDialog onClose={()=>{setOpenPayloadImport(false);}} />}
                    />
                ): (null) }
              </Paper>  
        <TableContainer component={Paper} className="mythicElement">
            <Table stickyHeader size="small" style={{ "maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "4rem"}}> Delete</TableCell>
                        <TableCell style={{width: "15rem"}}>Timestamp</TableCell>
                        <TableCell style={{width: "6rem"}}>Modify</TableCell>
                        <TableCell style={{width: "6rem"}}>Download</TableCell>
                        <TableCell>File</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell >C2 Status</TableCell>
                        <TableCell style={{width: "5rem"}}>Details</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {payload.map( (op) => (
                    <PayloadsTableRow
                        onDeletePayload={onDeletePayload}
                        onAlertChanged={onUpdateCallbackAlert}
                        key={"payload" + op.id}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
        </React.Fragment>
    )
}

