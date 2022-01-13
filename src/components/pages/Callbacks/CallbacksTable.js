import React, { useEffect, useMemo } from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {EnhancedTableHead, stableSort, getComparator} from '../../MythicComponents/MythicTable';
import {MythicTransferListDialog} from '../../MythicComponents/MythicTransferList';
import {MythicDialog} from '../../MythicComponents/MythicDialog';
import { CallbacksTableRow } from './CallbacksTableRow';
import { lighten, makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import clsx from 'clsx';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import VisibilityOffOutlinedIcon from '@material-ui/icons/VisibilityOffOutlined';
import {useTheme} from '@material-ui/core/styles';
import {hideCallbackMutation, unlockCallbackMutation, lockCallbackMutation, updateDescriptionCallbackMutation, updateSleepInfoCallbackMutation} from './CallbackMutations';
import {snackActions} from '../../utilities/Snackbar';
import {useMutation } from '@apollo/client';
import {Button} from '@material-ui/core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faTasks } from '@fortawesome/free-solid-svg-icons';

const useToolbarStyles = makeStyles((theme) => ({
  root: {
    minHeight: "unset",
    marginTop: "10px"
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  title: {
  },
}));

const EnhancedTableToolbar = (props) => {
  const classes = useToolbarStyles();
  const theme = useTheme();
  const { numSelected } = props;
  return (
    <React.Fragment>
        {numSelected > 1 ? (
          <Toolbar className={clsx(classes.root, {[classes.highlight]: numSelected > 1, })} >
            <React.Fragment>
              <Typography className={classes.title} color="inherit" variant="subtitle1" component="div">
                {numSelected} selected
              </Typography>
              <Tooltip title="Hide Selected">
                <IconButton aria-label="hide" onClick={props.onHideSelected}>
                  <VisibilityOffOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Task Selected">
                <IconButton aria-label="hide" onClick={props.onTaskSelected}>
                  <FontAwesomeIcon icon={faTasks} title="Task All" />
                </IconButton>
              </Tooltip>
            </React.Fragment>
          </Toolbar>
      ) : (
        <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px", width: "100%"}} variant={"elevation"}>
          <Typography variant="h4" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
              Active Callbacks
          </Typography>
          <Button variant="contained" color={"primary"} size="small" style={{display: "inline-block", float: "right", marginTop:"5px", marginRight:"70px"}} 
                    onClick={(evt) => {evt.stopPropagation(); props.openDialog(); }}>Show/Hide Columns</Button>
        </Paper>
      )
      }
    </React.Fragment>
  );
};
const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 750,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
}));
export function CallbacksTable(props){
      const classes = useStyles();
      const [order, setOrder] = React.useState('asc');
      const [orderBy, setOrderBy] = React.useState('interact');
      const [selected, setSelected] = React.useState([]);
      const [openAdjustColumnsDialog, setOpenAdjustColumnsDialog] = React.useState(false);
      const [allColumns, setAllColumns] = React.useState([]);
      const [shownColumns, setShownColumns] = React.useState(["user", "host", "domain", "description", "last_checkin", "type", "c2", "ip", "os"]);
      const handleSelectAllClick = (event) => {
        if (event.target.checked) {
          if(selected.length > 0){
            setSelected([]);
          }else{
            const newSelecteds = props.callbacks.map((n) => n.id);
            setSelected(newSelecteds);
          }
          
          return;
        }
        setSelected([]);
      };
      const handleClick = (event, name) => {
        const selectedIndex = selected.indexOf(name);
        let newSelected = [];
        if (selectedIndex === -1) {
          newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
          newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
          newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
          newSelected = newSelected.concat(
            selected.slice(0, selectedIndex),
            selected.slice(selectedIndex + 1),
          );
        }
        setSelected(newSelected);
      };
      const isSelected = (name) => selected.indexOf(name) !== -1;
      const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
      };
      const [hideCallback] = useMutation(hideCallbackMutation, {
        update: (cache, {data}) => {
            if(data.updateCallback.status === "success"){
                snackActions.success("Hiding callback");
            }else{
                snackActions.warning(data.updateCallback.error);
            }
            
        },
        onError: data => {
            snackActions.warning(data);
            console.log(data);
        }
    });
    const [lockCallback] = useMutation(lockCallbackMutation, {
      update: (cache, {data}) => {
        if(data.updateCallback.status === "success"){
            snackActions.success("Locked callback");
        }else{
            snackActions.warning(data.updateCallback.error);
        }
        
    },
    onError: data => {
        console.log(data);
        snackActions.warning(data);
    }
    });
    const [unlockCallback] = useMutation(unlockCallbackMutation, {
      update: (cache, {data}) => {
        if(data.updateCallback.status === "success"){
            snackActions.success("Unlocked callback");
        }else{
            snackActions.warning(data.updateCallback.error);
        }
        
    },
    onError: data => {
        console.log(data);
        snackActions.warning(data);
    }
    });
    const [updateDescription] = useMutation(updateDescriptionCallbackMutation, {
      update: (cache, {data}) => {
        if(data.updateCallback.status === "success"){
            snackActions.success("Updated Callback");
        }else{
            snackActions.warning(data.updateCallback.error);
        }
        
      },
      onError: data => {
          console.log(data);
          snackActions.warning(data);
      }
    });
    const [updateSleep] = useMutation(updateSleepInfoCallbackMutation, {
      update: (cache, {data}) => {
        snackActions.success("Updated Callback");
        
      },
      onError: data => {
          console.log(data);
          snackActions.warning(data);
      }
    });
    const hideSelected = () => {
      let updated_selected = [...selected];
      for(let i = 0; i < props.callbacks.length; i++){
        if(updated_selected.includes(props.callbacks[i]["id"])){
          hideCallback({variables: {callback_id: props.callbacks[i]["id"]}});
          updated_selected = updated_selected.filter(e => e !== props.callbacks[i]["id"]);
        }
      }
      setSelected(updated_selected);
      //
    }
    const onSubmitAdjustColumns = ({left, right}) => {
      setShownColumns(right);
      localStorage.setItem("callbacks_table_columns", JSON.stringify(right));
    }
    
    const tableHeadCells = useMemo( () => [
        {id: "id", numeric: true, disablePadding: false, label: "Interact"},
        {id: "ip", numeric: false, disablePadding: false, label: "IP"},
        {id: "host", numeric: false, disablePadding: false, label: "Host"},
        {id: "user", numeric: false, disablePadding: false, label: "User"},
        {id: "domain", numeric: false, disablePadding: false, label: "Domain"},
        {id: "os", numeric: false, disablePadding: false, label: "OS"},
        {id: "arch", numberic: false, disablePadding: false, label: "Arch"},
        {id: "pid", numeric: true, disablePadding: false, label: "PID"},
        {id: "last_checkin", numeric: true, disablePadding: false, label: "Last Checkin"},
        {id: "description", numeric: false, disablePadding: false, label: "Description"},
        {id: "sleep", numeric: false, disablePadding: true, label: "Sleep"},
        {id: "type", numeric: false, disablePadding: false, label: "Type"},
        {id: "c2", numeric: false, disablePadding: true, label: "C2"},
        {id: "process_name", numeric: false, disablePadding: true, label: "Process Name"},
        {id: "external_ip", numberic: false, disablePadding: true, label: "External IP"}
    ], []);
    useEffect( () => {
      const ids = tableHeadCells.map( (cell) => cell.id);
      const allColumnNames = ids.filter( i => i !== "id");
      setAllColumns(allColumnNames);
      let localSettings = localStorage.getItem("callbacks_table_columns");
      if(localSettings !== null){
        setShownColumns(JSON.parse(localSettings));
      }
    }, [tableHeadCells]);
    const toggleLock = React.useCallback( ({id, locked}) => {
      if(locked){
        unlockCallback({variables: {callback_id: id}})
      }else{
        lockCallback({variables: {callback_id: id}})
      }
    }, []);
    const updateDescriptionSubmit = React.useCallback( ({id, description}) => {
      updateDescription({variables: {callback_id: id, description}})
    }, []);
    const updateSleepInfo = React.useCallback( ({id, sleep_info}) => {
      updateSleep({variables: {callback_id: id, sleep_info}})
    }, [])
    const taskSelected = () => {
      snackActions.warning("Not Implemented Yet")
    }
    return (
        <React.Fragment>
            <EnhancedTableToolbar numSelected={selected.length} onHideSelected={hideSelected} onTaskSelected={taskSelected} openDialog={() => setOpenAdjustColumnsDialog(true)}/>
              <TableContainer component={Paper} className="mythicElement" style={{"maxWidth": "100%", marginRight: "5px", overflow: "auto"}}>
                    <Table size="small">
                        <EnhancedTableHead shownColumns={shownColumns} numSelected={selected.length} 
                          rowCount={props.callbacks.length} classes={classes} headCells={tableHeadCells} 
                          onSelectAllClick={handleSelectAllClick} onRequestSort={handleRequestSort} orderBy={orderBy} 
                          order={order} />
                        <TableBody >
                        {
                            stableSort(props.callbacks, getComparator(order, orderBy)).map( (cal, index) => (
                                <CallbacksTableRow shownColumns={shownColumns} handleClick={handleClick} isItemSelected={isSelected} 
                                  onOpenTab={props.onOpenTab} key={"callback" + cal.id} {...cal} 
                                  callbackgraphedges={props.callbackgraphedges}
                                  toggleLock={toggleLock} updateDescription={updateDescriptionSubmit} updateSleepInfo={updateSleepInfo}
                                  />
                            ))
                        }
                        </TableBody>
                    </Table>
                </TableContainer>
                {openAdjustColumnsDialog &&
                <MythicDialog fullWidth={true} maxWidth="md" open={openAdjustColumnsDialog} 
                  onClose={()=>{setOpenAdjustColumnsDialog(false);}} 
                  innerDialog={
                    <MythicTransferListDialog onClose={()=>{setOpenAdjustColumnsDialog(false);}} 
                      onSubmit={onSubmitAdjustColumns} right={shownColumns} rightTitle="Show these columns"
                      leftTitle={"Hidden Columns"} left={allColumns} dialogTitle={"Edit which columns are shown"}/>}
                />
                }              
        </React.Fragment>
    )
}

