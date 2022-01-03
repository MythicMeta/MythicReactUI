import React, {useEffect} from 'react';
import { copyStringToClipboard } from '../../utilities/Clipboard';
import GetAppIcon from '@material-ui/icons/GetApp';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import {ResponseDisplay} from './ResponseDisplay';
import RateReviewOutlinedIcon from '@material-ui/icons/RateReviewOutlined';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {TaskCommentDialog} from './TaskCommentDialog';
import {TaskTagDialog} from './TaskTagDialog';
import {useTheme} from '@material-ui/core/styles';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import {TaskOpsecDialog} from './TaskOpsecDialog';
import {TaskViewParametersDialog} from './TaskViewParametersDialog';
import {TaskViewStdoutStderrDialog} from './TaskViewStdoutStderrDialog';
import {snackActions} from '../../utilities/Snackbar';
import LocalOfferOutlinedIcon from '@material-ui/icons/LocalOfferOutlined';
import CodeIcon from '@material-ui/icons/Code';
import KeyboardIcon from '@material-ui/icons/Keyboard';
import ConfirmationNumberIcon from '@material-ui/icons/ConfirmationNumber';
import {TaskTokenDialog} from './TaskTokenDialog';
import Grid from '@material-ui/core/Grid';
import ReplayIcon from '@material-ui/icons/Replay';
import {gql, useMutation, useLazyQuery } from '@apollo/client';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faBook} from '@fortawesome/free-solid-svg-icons';
import { faExternalLinkAlt, faExpandArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import Pagination from '@material-ui/lab/Pagination';
import { Typography } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import { makeStyles } from '@material-ui/core/styles';
import { Backdrop } from '@material-ui/core';

const ReissueTaskMutationGQL = gql`
mutation reissueTaskMutation($task_id: Int!){
  reissue_task(task_id: $task_id){
    status
    error
  }
}
`;
const ReissueTaskHandlerMutationGQL = gql`
mutation reissueTaskHandlerMutation($task_id: Int!){
  reissue_task_handler(task_id: $task_id){
    status
    error
  }
}
`;
const getAllResponsesLazyQuery = gql`
query subResponsesQuery($task_id: Int!) {
  response(where: {task_id: {_eq: $task_id}}, order_by: {id: asc}) {
    id
    response: response_text
  }
}`;

const useStyles = makeStyles((theme) => ({
  root: {
    transform: 'translateZ(0px)',
    flexGrow: 1,
  },
  speedDial: {
    position: 'absolute',
    '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
      top: theme.spacing(2),
      right: theme.spacing(2),
    },
    '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
      bottom: theme.spacing(1),
      left: theme.spacing(2),
    },
    zIndex: 3
  },
  tooltip: {
    backgroundColor: theme.palette.background.contrast,
    color: theme.palette.text.contrast,
    boxShadow: theme.shadows[1],
    fontSize: 13
  },
  arrow: {
    color: theme.palette.background.contrast,
  }
}));

export const TaskDisplayContainer = ({task}) => {
    const theme = useTheme();
    const [totalCount, setTotalcount] = React.useState(0);
    const [viewBrowserScript, setViewBrowserScript] = React.useState(true);
    const [openCommentDialog, setOpenCommentDialog] = React.useState(false);
    const [openTokenDialog, setOpenTokenDialog] = React.useState(false);
    const [openParametersDialog, setOpenParametersDialog] = React.useState(false);
    const [openStdoutStderrDialog, setOpenStdoutStderrDialog] = React.useState(false);
    const [openOpsecDialog, setOpenOpsecDialog] = React.useState(false);
    const [openTaskTagDialog, setOpenTaskTagDialog] = React.useState(false);
    const [commandID, setCommandID] = React.useState(0);
    const [search, setSearch] = React.useState("");
    const [searchOutput, setSearchOutput] = React.useState(false);
    const [fetchLimit, setFetchLimit] = React.useState(10);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectAllOutput, setSelectAllOutput] = React.useState(false);
    const classes = useStyles();
    const [openSpeedDial, setOpenSpeedDial] = React.useState(false);
    const [downloadResponses] = useLazyQuery(getAllResponsesLazyQuery, {
      fetchPolicy: "network-only",
      onCompleted: (data) => {
          const output = data.response.reduce( (prev, cur) => {
            return prev + Buffer.from(cur.response, "base64");
          }, "");
          const dataBlob = new Blob([output], {type: 'application/octet-stream'});
          const ele = document.getElementById("download_config");
          if(ele !== null){
            ele.href = URL.createObjectURL(dataBlob);
            ele.download = "task_" + task.id + ".txt";
            ele.click();
          }else{
            const element = document.createElement("a");
            element.id = "download_config";
            element.href = URL.createObjectURL(dataBlob);
            element.download = "task_" + task.id + ".txt";
            document.body.appendChild(element);
            element.click();
          }
      },
      onError: (data) => {

      }
    })
    const [reissueTask] = useMutation(ReissueTaskMutationGQL, {
      onCompleted: data => {
        if(data.reissue_task.status === "success"){
          snackActions.success("Successfully re-issued task to Mythic");
        }else{
          snackActions.error("Failed to re-issue task to Mythic: " + data.reissue_task.error);
        }
      },  
      onError: data => {
        console.log(data);
        snackActions.error("Failed to re-issue task: " + data);
      }
    });
    const [reissueTaskHandler] = useMutation(ReissueTaskHandlerMutationGQL, {
      onCompleted: data => {
        if(data.reissue_task_handler.status === "success"){
          snackActions.success("Successfully resubmitted task for handling");
        }else{
          snackActions.warning("Failed to resubmit task for handling: " + data.reissue_task_handler.error);
        }
        
      },
      onError: data => {
        console.log(data);
        snackActions.error("Error resubmitting task for handling: " + data);
      }
    });
    const copyToClipboard = () => {
        let result = copyStringToClipboard(task.original_params);
        if(result){
          snackActions.success("Copied text!");
        }else{
          snackActions.error("Failed to copy text");
        }
        setOpenSpeedDial(false);
    }
    const onReissueTask = () => {
      reissueTask({variables: {task_id: task.id}});
    }
    const onReissueTaskHandler = () => {
      reissueTaskHandler({variables: {task_id: task.id}});
    }
    useEffect( () => {
        setCommandID(task.command === null ? 0 : task.command.id);
        if(task.responses_aggregate !== undefined){
          setTotalcount(task.responses_aggregate.aggregate.count);  
        }
    }, [task.command, task.responses_aggregate]);
    const onSubmitSearch = ( value) => {
      setSearch(value);
      if(value === ""){
        if(task.responses_aggregate !== undefined){
          setTotalcount(task.responses_aggregate.aggregate.count);  
        }else{
          setTotalcount(0);
        }
      }
      setCurrentPage(1);
    }
    const onChangePage = (event, value) => {
      setCurrentPage(value);
    }
    const changeTotalCount = React.useCallback( (newTotal) => {
      setTotalcount(newTotal);
      setCurrentPage(1);
    }, []);
    const onDownloadResponses = () => {
      downloadResponses({variables: {task_id: task.id}});
      setOpenSpeedDial(false);
    }
    const tooltipPlacement = "top"
    return (
      <React.Fragment>
        <Grid container spacing={0} style={{maxWidth: "100%"}}>
          <Backdrop open={openSpeedDial} onClick={()=>{setOpenSpeedDial(false);}} style={{zIndex: 2, position: "absolute"}}/>
              {openTokenDialog ? 
                (<MythicDialog fullWidth={true} maxWidth="md" open={openTokenDialog} 
                  onClose={()=>{setOpenTokenDialog(false);}} 
                  innerDialog={<TaskTokenDialog token_id={task.token === undefined ? 0 : task.token.id} onClose={()=>{setOpenTokenDialog(false);}} />}
              />) : (null)
              }
              {openOpsecDialog ?
                (<MythicDialog fullWidth={true} maxWidth="md" open={openOpsecDialog} 
                  onClose={()=>{setOpenOpsecDialog(false);}} 
                  innerDialog={<TaskOpsecDialog task_id={task.id} onClose={()=>{setOpenOpsecDialog(false);}} />}
              />) : (null)
              }
              {openParametersDialog ? 
                (<MythicDialog fullWidth={true} maxWidth="md" open={openParametersDialog} 
                  onClose={()=>{setOpenParametersDialog(false);}} 
                  innerDialog={<TaskViewParametersDialog task_id={task.id} onClose={()=>{setOpenParametersDialog(false);}} />}
              />) : (null)
              }
              {openStdoutStderrDialog ? 
                (<MythicDialog fullWidth={true} maxWidth="md" open={openStdoutStderrDialog} 
                  onClose={()=>{setOpenStdoutStderrDialog(false);}} 
                  innerDialog={<TaskViewStdoutStderrDialog task_id={task.id} onClose={()=>{setOpenStdoutStderrDialog(false);}} />}
              />) : (null)
              }
              {openTaskTagDialog ?
                (<MythicDialog fullWidth={true} maxWidth="md" open={openTaskTagDialog} 
                  onClose={()=>{setOpenTaskTagDialog(false);}} 
                  innerDialog={<TaskTagDialog task_id={task.id} onClose={()=>{setOpenTaskTagDialog(false);}} />}
              />) : (null)
              }
              {openCommentDialog ?
                (<MythicDialog fullWidth={true} maxWidth="md" open={openCommentDialog} 
                  onClose={()=>{setOpenCommentDialog(false);}} 
                  innerDialog={<TaskCommentDialog task_id={task.id} onClose={()=>{setOpenCommentDialog(false);}} />}
              />) : (null)
              }
            <Grid item xs={12}>
              <ResponseDisplay task={task} command_id={commandID} viewBrowserScript={viewBrowserScript} onSubmitSearch={onSubmitSearch}
                searchOutput={searchOutput}
                fetchLimit={fetchLimit} currentPage={currentPage} searchText={search} changeTotalCount={changeTotalCount} selectAllOutput={selectAllOutput}/>
            </Grid>
            <Grid item xs={12} >
            <SpeedDial
                ariaLabel="Task Speeddial"
                className={classes.speedDial}
                icon={<SpeedDialIcon />}
                onClick={()=>{setOpenSpeedDial(!openSpeedDial)}}
                FabProps={{ color: "primary", size: "small" }}
                open={openSpeedDial}
                direction="right"
              >
                  <SpeedDialAction
                    icon={<CodeIcon/>}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"Toggle BrowserScript"}
                    onClick={() => {setViewBrowserScript(!viewBrowserScript);setOpenSpeedDial(false);}}
                  />
                  <SpeedDialAction
                    icon={<FontAwesomeIcon icon={faExpandArrowsAlt} size="lg" />}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"View All Output"}
                    onClick={() => {setSelectAllOutput(!selectAllOutput);setOpenSpeedDial(false);}}
                  />
                  <SpeedDialAction
                    icon={<SearchIcon />}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"Search Output"}
                    onClick={() => {setSearchOutput(!searchOutput);setOpenSpeedDial(false);}}
                  />
                  <SpeedDialAction
                    icon={<GetAppIcon/>}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"Download output"}
                    onClick={onDownloadResponses}
                  />
                  <SpeedDialAction
                    icon={<LocalOfferOutlinedIcon/>}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"Edit Tags"}
                    onClick={()=>{setOpenTaskTagDialog(true);setOpenSpeedDial(false);}}
                  />
                  <SpeedDialAction
                    icon={<FontAwesomeIcon icon={faExternalLinkAlt} size="lg" />}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"Open Task in New Window"}
                    onClick={()=> {window.open('/new/task/' + task.id, "_blank")}}
                  />
                  <SpeedDialAction
                    icon={<FileCopyOutlinedIcon/>}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"Copy original params to clipboard"}
                    onClick={copyToClipboard}
                  />
                  <SpeedDialAction
                    icon={<RateReviewOutlinedIcon/>}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"Edit Comment"}
                    onClick={()=>{setOpenCommentDialog(true);setOpenSpeedDial(false);}}
                  />
                  <SpeedDialAction
                    icon={<KeyboardIcon/>}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"View All Parameters"}
                    onClick={()=>{setOpenParametersDialog(true);setOpenSpeedDial(false);}}
                  />
                  <SpeedDialAction
                    icon={<FontAwesomeIcon icon={faBook} size="lg" />}
                    arrow
                    TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                    tooltipPlacement={tooltipPlacement}
                    tooltipTitle={"View Stdout/Stderr of Task"}
                    onClick={()=>{setOpenStdoutStderrDialog(true);setOpenSpeedDial(false);}}
                  />
                  {task.opsec_pre_blocked === null ? (
                    null
                  ) : (  task.opsec_pre_bypassed === false ? (
                          <SpeedDialAction
                            icon={<LockIcon style={{color: theme.palette.error.main}}/>}
                            arrow
                            TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                            tooltipPlacement={tooltipPlacement}
                            tooltipTitle={"Submit OPSEC PreCheck Bypass Request"}
                            onClick={()=>{setOpenOpsecDialog(true);setOpenSpeedDial(false);}}
                          />
                          ): (
                            <SpeedDialAction
                            icon={<LockOpenIcon style={{color: theme.palette.success.main}}/>}
                            arrow
                            TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                            tooltipPlacement={tooltipPlacement}
                            tooltipTitle={"View OPSEC PreCheck Data"}
                            onClick={()=>{setOpenOpsecDialog(true);setOpenSpeedDial(false);}}
                          />
                          )             
                    ) 
                  }
                  {task.opsec_post_blocked === null ? (
                    null
                  ) : (  task.opsec_post_bypassed === false ? (
                          <SpeedDialAction
                            icon={<LockIcon style={{color: theme.palette.error.main}}/>}
                            arrow
                            TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                            tooltipPlacement={tooltipPlacement}
                            tooltipTitle={"Submit OPSEC PostCheck Bypass Request"}
                            onClick={()=>{setOpenOpsecDialog(true);setOpenSpeedDial(false);}}
                          />
                          ): (
                            <SpeedDialAction
                              icon={<LockOpenIcon style={{color: theme.palette.success.main}}/>}
                              arrow
                              TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                              tooltipPlacement={tooltipPlacement}
                              tooltipTitle={"View OPSEC PostCheck Data"}
                              onClick={()=>{setOpenOpsecDialog(true);setOpenSpeedDial(false);}}
                            />
                          )             
                    ) 
                  }
                  {task.token === null ? (
                    null
                  ) : (
                      <SpeedDialAction
                        icon={<ConfirmationNumberIcon />}
                        arrow
                        TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                        tooltipPlacement={tooltipPlacement}
                        tooltipTitle={"View Token Information"}
                        onClick={()=>{setOpenTokenDialog(true);setOpenSpeedDial(false);}}
                      />
                  )}
                  {task.status.toLowerCase().includes("error: container") ? (
                    <SpeedDialAction
                      icon={<ReplayIcon style={{color: theme.palette.warning.main}}/>}
                      arrow
                      TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                      tooltipPlacement={tooltipPlacement}
                      tooltipTitle={"Resubmit Tasking"}
                      onClick={onReissueTask}
                    />
                  ) : (null)}
                  {task.status.toLowerCase().includes("error: task") ? (
                    <SpeedDialAction
                      icon={<ReplayIcon style={{color: theme.palette.warning.main}}/>}
                      arrow
                      TooltipClasses={{tooltip: classes.tooltip, arrow: classes.arrow}}
                      tooltipPlacement={tooltipPlacement}
                      tooltipTitle={"Resubmit Task Handler"}
                      onClick={onReissueTaskHandler}
                    />
                  ):(null)}
                  
              </SpeedDial>
              <div style={{background: "transparent", display: "flex", justifyContent: "center", alignItems: "center", paddingBottom: "10px"}} >
                
                  <React.Fragment>
                    <Pagination count={Math.ceil(totalCount / fetchLimit)} page={currentPage} variant="outlined" color="primary" boundaryCount={2} onChange={onChangePage} style={{margin: "10px"}}/>
                    <Typography style={{paddingLeft: "10px"}}>Total Results: {totalCount}</Typography>
                  </React.Fragment>
                
                  
              </div>
            </Grid>
        </Grid>
        
      </React.Fragment>
				          
    )
}