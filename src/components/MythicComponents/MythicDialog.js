import React, {useEffect} from 'react';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MythicTextField from './MythicTextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


export function MythicDialog(props) {
  const descriptionElementRef = React.useRef(null);
  React.useEffect(() => {
    if (props.open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [props.open]);

  return (
      <Dialog
        open={props.open}
        onClose={props.onClose}
        scroll="paper"
        maxWidth={props.maxWidth}
        fullWidth={props.fullWidth}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        {props.innerDialog}
      </Dialog>
  );
}

export function MythicModifyStringDialog(props) {
  const [comment, setComment] = React.useState("");
    const onCommitSubmit = () => {
        props.onSubmit(comment);
        props.onClose();
    }
    const onChange = (name, value, error) => {
        setComment(value);
    }
    useEffect( () => {
      setComment(props.value);
    }, [props.value]);
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">{props.title}</DialogTitle>
        <DialogContent dividers={true}>
          <MythicTextField autoFocus onEnter={props?.onEnter || onCommitSubmit} onChange={onChange} value={comment} multiline={props?.multiline || false} maxRows={props.maxRows} />
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
          <Button onClick={onCommitSubmit} variant="contained" color="success">
            Submit
          </Button>
        </DialogActions>
    </React.Fragment>
  );
}

export function MythicViewJSONAsTableDialog(props) {
  const [comment, setComment] = React.useState([]);
  const [tableType, setTableType] = React.useState("dictionary");
  const [headers, setHeaders] = React.useState([]);
    useEffect( () => {
      let permissions = [];
      try{
        let permissionDict;
        if(props.value.constructor === Object){
          permissionDict = props.value;
        }else{
          permissionDict = JSON.parse(props.value);
        } 
        
        if(permissionDict.constructor === Object){
          for(let key in permissionDict){
            if(permissionDict[key].constructor === Object || Array.isArray(permissionDict[key])){
              permissions.push({"name": key, "value": JSON.stringify(permissionDict[key], null, 2)});
            }else{
              permissions.push({"name": key, "value": permissionDict[key]});
            }
            
            setHeaders([props.leftColumn, props.rightColumn]);
          }
        }else{
          setTableType("array");
          if(permissionDict.length > 0){
            setHeaders(Object.keys(permissionDict[0]));
            permissions = permissionDict;
          }else{
            setHeaders([]);
          }
        }
      }catch(error){
        console.log(error);
      }
      setComment(permissions);
    }, [props.value, props.leftColumn, props.rightColumn]);
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">{props.title}</DialogTitle>
        <DialogContent dividers={true}>
        <Paper elevation={5} style={{position: "relative"}} variant={"elevation"}>
          <TableContainer component={Paper} className="mythicElement">
            <Table size="small" style={{"tableLayout": "fixed", "maxWidth": "calc(100vw)", "overflow": "scroll"}}>
                  <TableHead>
                      <TableRow>
                          {headers.map( (header, index) => (
                            <TableCell key={'header' + index}>{header}</TableCell>
                          ))}
                      </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableType === "dictionary" ? (
                      comment.map( (element, index) => (
                        <TableRow key={'row' + index} hover>
                          <TableCell>{element.name}</TableCell>
                          <TableCell style={{wordBreak: "break-all", whiteSpace: "pre-wrap"}}>{element.value === true ? ("True") : (element.value === false ? ("False") : (element.value) ) }</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      comment.map( (row, index) => (
                        <TableRow key={'row' + index} hover>
                            {Object.keys(row).map( (key) => (
                              <TableCell key={"row" + index + "cell" + key}>{row[key]}</TableCell>
                            ))}
                        </TableRow>
                      ))
                    ) }
                    
                  </TableBody>
              </Table>
            </TableContainer>
        </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
    </React.Fragment>
  );
}

export function MythicViewObjectPropertiesAsTableDialog(props) {
  const [comment, setComment] = React.useState([]);
    useEffect( () => {
        const permissions = props.keys.reduce( (prev, key) => {
          if(props.value[key] !== undefined && props.value[key] !== null && props.value[key] !== ""){
            return [...prev, {"name": key, "value": props.value[key]}]
          }
          else{
            return [...prev];
          }
        }, []);

      setComment(permissions);
    }, [props.value, props.keys]);
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">{props.title}</DialogTitle>
        <DialogContent dividers={true}>
        <Paper elevation={5} style={{position: "relative"}} variant={"elevation"}>
          <TableContainer component={Paper} className="mythicElement">
            <Table size="small" style={{"tableLayout": "fixed", "maxWidth": "calc(100vw)", "overflow": "scroll"}}>
                  <TableHead>
                      <TableRow>
                          <TableCell>{props.leftColumn}</TableCell>
                          <TableCell>{props.rightColumn}</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                    {comment.map( (element, index) => (
                      <TableRow key={'row' + index}>
                        <TableCell>{element.name}</TableCell>
                        <TableCell>{element.value === true ? ("True") : (element.value === false ? ("False") : (element.value) ) }</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </Table>
            </TableContainer>
        </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
    </React.Fragment>
  );
}