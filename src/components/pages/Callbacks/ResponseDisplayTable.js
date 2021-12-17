import React, {useEffect, useRef} from 'react';
import {Button} from '@material-ui/core';
import { MythicViewJSONAsTableDialog, MythicDialog } from '../../MythicComponents/MythicDialog';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {useTheme} from '@material-ui/core/styles';
import {Table, Column, AutoSizer} from 'react-virtualized';
import 'react-virtualized/styles.css';
import Draggable from 'react-draggable';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import {TaskFromUIButton} from './TaskFromUIButton';
import Grow from '@material-ui/core/Grow';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { copyStringToClipboard } from '../../utilities/Clipboard';
import IconButton from '@material-ui/core/IconButton';
import {snackActions} from '../../utilities/Snackbar';
import { Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFolder, faFolderOpen, faFileArchive, faFilePrescription, faFileWord, faFileExcel, faFilePowerpoint, faFilePdf, faDatabase, faKey, faFileCode, faDownload, faUpload, faFileImage, faCopy, faBoxOpen, faFileAlt } from '@fortawesome/free-solid-svg-icons';

const useStyles = makeStyles((theme) => ({
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
const onCopyToClipboard = (data) => {
  let result = copyStringToClipboard(data);
  if(result){
    snackActions.success("Copied text!");
  }else{
    snackActions.error("Failed to copy text");
  }
}
const getIconName = (iconName) => {
  switch(iconName.toLowerCase()){
    case "openfolder":
    case "folder":
      return faFolderOpen;
    case "closedfolder":
      return faFolder;
    case "archive":
    case "zip":
      return faFileArchive;
    case "diskimage":
      return faBoxOpen;
    case "executable":
      return faFilePrescription;
    case "word":
      return faFileWord;
    case "excel":
      return faFileExcel;
    case "powerpoint":
      return faFilePowerpoint;
    case "pdf":
    case "adobe":
      return faFilePdf;
    case "database":
      return faDatabase;
    case "key":
      return faKey;
    case "code":
    case "source":
      return faFileCode;
    case "download":
      return faDownload;
    case "upload":
      return faUpload;
    case "png":
    case "jpg":
    case "image":
      return faFileImage;
    default:
      return faFileAlt;
  }
}
const ResponseDisplayTableStringCell = ({cellData, rowData}) => {
  const classes = useStyles();
  return (
    <div style={{...cellData["cellStyle"]}}>
      {cellData?.copyIcon? 
        <IconButton onClick={() => onCopyToClipboard(cellData["plaintext"])}>
            <FontAwesomeIcon icon={faCopy} />
        </IconButton> : null}
      {cellData?.startIcon? 
        <Tooltip title={cellData?.startIconHoverText || ""} arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}}><span>
            <FontAwesomeIcon icon={getIconName(cellData?.startIcon)} style={{marginRight: "5px"}}/></span>
        </Tooltip>
         : null
      }
      {cellData.plaintextHoverText? (
        <Tooltip title={cellData.plaintextHoverText} arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}}>
          <pre style={{display: "inline-block"}}>
            {cellData?.plaintext || " "}
          </pre>
          
        </Tooltip>
      ) : (
        <pre style={{display: "inline-block"}}>
            {cellData?.plaintext || " "}
          </pre>
      )}
      {cellData?.endIcon? 
       <Tooltip title={cellData?.endIconHoverText || ""} arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}}><span>
        <FontAwesomeIcon icon={getIconName(cellData?.endIcon)} /> </span> 
        </Tooltip>: null
      }
    </div>
          
  )
}
const getStringSize = ({cellData}) => {
  try{
      // process for getting human readable string from bytes: https://stackoverflow.com/a/18650828
      let bytes = parseInt(cellData["plaintext"]);
      if (cellData["plaintext"] === ''){
        return ""
      }
      if (bytes === 0){
        return "0 Bytes";
      };
      const decimals = 2;
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
      return size;
  }catch(error){
    return cellData?.plaintext || ""
    
  }
}
const ResponseDisplayTableSizeCell = ({cellData}) => {
  const classes = useStyles();
  return (
    <div style={{...cellData["cellStyle"]}}>
        {cellData.plaintextHoverText? (
        <Tooltip title={cellData.plaintextHoverText} arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}}>
          <pre style={{display: "inline-block"}}>
            {getStringSize({cellData})}
          </pre>
          
        </Tooltip>
      ) : (
        <pre style={{display: "inline-block"}}>
            {getStringSize({cellData})}
          </pre>
      )}
     </div>
          
  )
}
const ResponseDisplayTableActionCell = ({cellData, callback_id, rowData}) => {
  const theme = useTheme();
  const [openButton, setOpenButton] = React.useState(false);
  const [openTaskingButton, setOpenTaskingButton] = React.useState(false);
  const dropdownAnchorRef = useRef(null);
  const [openDropdownButton, setOpenDropdownButton] = React.useState(false);
  const [taskingData, setTaskingData] = React.useState({});
  const classes = useStyles();
  const handleClose = (event) => {
    if (dropdownAnchorRef.current && dropdownAnchorRef.current.contains(event.target)) {
      return;
    }
    setOpenDropdownButton(false);
  };
  const handleMenuItemClick = (event, index) => {
    switch(cellData.button.value[index].type.toLowerCase()){
      case "task":
        setTaskingData(cellData.button.value[index]);
        setOpenTaskingButton(true);
        break;
      case "dictionary":
        setTaskingData(cellData.button.value[index]);
        setOpenButton(true);
        break;
    }
    setOpenDropdownButton(false);
  };
  const finishedTasking = () => {
    setOpenTaskingButton(false);
    setTaskingData({});
  }
  const finishedViewingData = () => {
    setOpenButton(false);
    setTaskingData({});
  }
  const getButtonObject = () => {
    switch(cellData.button.type.toLowerCase()){
      case "dictionary":
        return (
          <React.Fragment>
            <Tooltip title={cellData?.button?.hoverText || "Display Data"} arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}}>
              <Button size="small" 
                variant="contained" color="primary" onClick={() => setOpenButton(true)} disabled={cellData?.button?.disabled || false}>{cellData?.button?.name || " "}</Button>
            </Tooltip>
            {openButton &&
                <MythicDialog fullWidth={true} maxWidth="lg" open={openButton} 
                    onClose={()=>{setOpenButton(false);}} 
                    innerDialog={<MythicViewJSONAsTableDialog title={cellData?.button?.title || "Title Here"} leftColumn={cellData?.button?.leftColumnTitle || "Left Column"} 
                    rightColumn={cellData?.button?.rightColumnTitle || "Right Column"} value={cellData?.button?.value || {}} onClose={()=>{setOpenButton(false);}} />}
                />
              }
            </React.Fragment>
        )
      case "task":
        return (
          <React.Fragment>
            <Tooltip title={cellData?.button?.hoverText || "Issues Task to Agent"} arrow classes={{tooltip: classes.tooltip, arrow: classes.arrow}}>
              <Button size="small" 
              onClick={() => setOpenTaskingButton(true)} disabled={cellData?.button?.disabled || false} variant="contained" color="secondary" >{cellData?.button?.name || " "}</Button>
            </Tooltip>
            {openTaskingButton && 
              <TaskFromUIButton ui_feature={cellData?.button?.ui_feature || " "} 
                callback_id={callback_id} 
                parameters={cellData?.button?.parameters || ""}
                onTasked={() => setOpenTaskingButton(false)}/>
            }
          </React.Fragment>
        )
      case "link":
        return (
          <React.Fragment>

          </React.Fragment>
        )
      case "menu":
        return (
          <React.Fragment>
            {openTaskingButton && 
              <TaskFromUIButton ui_feature={taskingData.ui_feature} 
                callback_id={callback_id} 
                parameters={taskingData.parameters}
                onTasked={finishedTasking}/>
            }
            {openButton && 
              <MythicDialog fullWidth={true} maxWidth="lg" open={openButton} 
                onClose={finishedViewingData} 
                innerDialog={<MythicViewJSONAsTableDialog title={taskingData.title} leftColumn={taskingData.leftColumnTitle} 
                rightColumn={taskingData.rightColumnTitle} value={taskingData.value} onClose={finishedViewingData} />}
            />
            }
            <Button ref={dropdownAnchorRef} size="small" onClick={()=>{setOpenDropdownButton(true);}} color="primary" variant="contained">{cellData.button.name}</Button>
                <Popper open={openDropdownButton} anchorEl={dropdownAnchorRef.current} role={undefined} transition style={{zIndex: 4}}>
                  {({ TransitionProps, placement }) => (
                    <Grow
                      {...TransitionProps}
                      style={{
                        transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                      }}
                    >
                      <Paper variant="outlined" style={{backgroundColor: theme.palette.type === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light, color: "white"}}>
                        <ClickAwayListener onClickAway={handleClose}>
                          <MenuList id="split-button-menu"  >
                            {cellData.button.value.map((option, index) => (
                              <MenuItem
                                key={option.name + index}
                                disabled={option.disabled}
                                onClick={(event) => handleMenuItemClick(event, index)}
                              >
                                {option.name}
                              </MenuItem>
                            ))}
                          </MenuList>
                        </ClickAwayListener>
                      </Paper>
                    </Grow>
                  )}
                </Popper>
          </React.Fragment>
        )
    }
  }
  return (
    <div style={{...cellData["cellStyle"]}}>
      {cellData.plaintext ? cellData.plaintext : null}
      {cellData.button ? (getButtonObject()) : (null)}
    </div>
  )
}
const CellRenderer = ({columnData, dataKey, rowData}) => {
  const DisplayData = () => {
    switch(columnData.format){
      case "string":
        return <ResponseDisplayTableStringCell cellData={rowData[dataKey]} rowData={rowData}/>
      case "size":
        return <ResponseDisplayTableSizeCell cellData={rowData[dataKey]} rowData={rowData}/>
      case "button":
        return <ResponseDisplayTableActionCell callback_id={columnData.callback_id} cellData={rowData[dataKey]} rowData={rowData}/>
      default:
        return <ResponseDisplayTableStringCell cellData={rowData[dataKey]} rowData={rowData}/>
    }
  };
  return (
    DisplayData()
  )
}
const noRowsRender = () => {
  return (
    <div>NO DATA</div>
  )
}

export const ResponseDisplayTable = ({table, callback_id}) =>{
  const theme = useTheme();
  const [allHeaders, setAllHeaders] = React.useState([]);
  const allData = React.useRef([]);
  const [sortBy, setSortBy] = React.useState("");
  const [headerWidths, setHeaderWidths] = React.useState({});
  const widthRef = React.useRef(null);
  const [sortDirection, setSortDirection] = React.useState("ASC");
  const rowStyle =  ({index}) => {
    if(index < 0){
      return {backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main};
    }
    return allData.current[index]["rowStyle"] || {};
  };
  const sortTable = ({sortBy, sortDirection}) => {
    const tmpData = [...allData.current];
    const sortType = table.headers.filter( h => h["plaintext"] === sortBy)[0]["type"];
    if(sortType === "number" || sortType === "size"){
      tmpData.sort((a, b) => (parseInt(a[sortBy]["plaintext"]) > parseInt(b[sortBy]["plaintext"]) ? 1 : -1));
    }else if(sortType === "date"){
      tmpData.sort((a,b) => ( (new Date(a[sortBy]["plaintext"])) > (new Date(b[sortBy]["plaintext"])) ? 1: -1));
    }else{
      tmpData.sort( (a, b) => {
        if(a[sortBy]["plaintext"] === undefined){
          return -1;
        }else if(b[sortBy]["plaintext"] === undefined){
          return 1;
        }
        return a[sortBy]["plaintext"].toLowerCase() > b[sortBy]["plaintext"].toLowerCase() ? 1 : -1
      });
    }
    if(sortDirection === "DESC"){
      tmpData.reverse();
    }
    allData.current = [...tmpData];
    setSortBy(sortBy);
    setSortDirection(sortDirection);

  };
  const rowGetter = ({index}) => {
    return allData.current[index];
  };
  const resizeRow = React.useCallback( ({event, dataKey, deltaX}) => {
    event.preventDefault();
    event.stopPropagation();
    const prevWidths = {...headerWidths};
    const percentDelta = deltaX / widthRef.current.offsetWidth;
    let nextHeader = "";
    for(let i = 0; i < table.headers.length; i++){
      //console.log("testing", table.headers[i]["plaintext"], dataKey);
      if(table.headers[i]["plaintext"] === dataKey){
        if(i+1 < table.headers.length){
          nextHeader = table.headers[i+1]["plaintext"];
        }
      }
    }
    if(nextHeader === ""){
      console.log("next header not found");
      return;
    }
    const updatedWidths = {...prevWidths, 
      [dataKey]: prevWidths[dataKey] + percentDelta,
      [nextHeader]: prevWidths[nextHeader] - percentDelta
    };
    setHeaderWidths(updatedWidths);
  }, [headerWidths]);
  const headerRenderer = React.useCallback( ({columnData, dataKey, disableSort, label, sortBy, sortDirection}) => {
    return (
      <React.Fragment key={"header" + dataKey}>
        <span style={{display: "inline-flex", flexDirection: "row", alignContent: "stretch", justifyContent: "flex-start"}}>
          {label}
          {sortBy === label ? (
            sortDirection === "ASC" ? (
              <ArrowDownwardIcon />
            ) : (
              <ArrowUpwardIcon />
            )
          ) :(null) }
        </span>
        <Draggable
          axis="x"
          defaultClassName="DragHandle"
          defaultClassNameDragging="DragHandleActive"
          onDrag={(event, {deltaX}) => resizeRow({event, dataKey, deltaX})}
          position={{x:0}}
          zIndex={999}
          >
            <span onClick={(evt) => {evt.preventDefault();evt.stopPropagation();}} className="DragHandleIcon" style={{width: "20px", textAlign: "center"}}>⋮</span>
        </Draggable>        
      </React.Fragment>
    )
  }, [resizeRow]);

  useEffect( () => {
    const unSpecifiedWidths = table.headers.reduce( (prev, cur) => {
      if(cur.width){
        return prev;
      }else{
        return prev + 1;
      }
    }, 0);
    const totalSpecifedWidths = table.headers.reduce( (prev, cur) => {
      if(cur.width){
        return prev + cur.width;
      }else{
        return prev;
      }
    }, 0);
    const remainingWidths = 100 - totalSpecifedWidths;

    const headerWidthData = table.headers.reduce( (prev, cur) => {
      return {...prev, [cur["plaintext"]]: ( cur.width ? (cur.width/100) : (remainingWidths / unSpecifiedWidths / 100)  )};
    }, {});
    setHeaderWidths({...headerWidthData});
  }, [table.headers])
  useEffect( () => {
    allData.current = [...table.rows];
  }, [table.rows])
  useEffect( () => {
      const headerData = table.headers.map( (header) => {
        return {
          dataKey: header["plaintext"],
          label: header["plaintext"],
          width: headerWidths[header["plaintext"]] * widthRef.current.offsetWidth,
          columnData: {format: header["type"] === undefined ? "string" : header["type"], callback_id: callback_id},
          cellRenderer: CellRenderer,
          headerRenderer: headerRenderer
        }
      });
      setAllHeaders(headerData);
      if(headerData.length > 0){
        setSortBy(headerData[0]["dataKey"]);
      }
  }, [table.headers, headerWidths, widthRef.current]);

  return (
      <React.Fragment>
          <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main, marginBottom: "5px", marginTop: "10px", marginRight: "5px"}} variant={"elevation"}>
              <Typography variant="h5" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                  {table.title}
              </Typography>
          </Paper>
          <div style={{height: "calc(45vh)", width: "100%"}} ref={widthRef}>
            <AutoSizer>
              {({height, width}) => (
                <Table
                  height={height}
                  width={width}
                  headerHeight={25}
                  noRowsRenderer={noRowsRender}
                  rowCount={allData.current.length}
                  rowGetter={ rowGetter }
                  rowHeight={35}
                  rowStyle={rowStyle}
                  sort={sortTable}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  >
                    {allHeaders.map( (col) => (
                      <Column key={"col" + col.dataKey} {...col} />
                    ))}
                  </Table>
              )}
            </AutoSizer>
            
          </div>
      </React.Fragment>
    
  )   
}