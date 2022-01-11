import React, {useEffect, useRef} from 'react';
import {Button} from '@material-ui/core';
import { MythicViewJSONAsTableDialog, MythicDialog } from '../../MythicComponents/MythicDialog';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import {useTheme} from '@material-ui/core/styles';
import 'react-virtualized/styles.css';
import {TaskFromUIButton} from './TaskFromUIButton';
import Grow from '@material-ui/core/Grow';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { copyStringToClipboard } from '../../utilities/Clipboard';
import IconButton from '@material-ui/core/IconButton';
import {snackActions} from '../../utilities/Snackbar';
import {MythicStyledTooltip} from '../../MythicComponents/MythicStyledTooltip';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import MythicResizableGrid from '../../MythicComponents/MythicResizableGrid';
import {faList, faTrashAlt, faSkullCrossbones, faCamera, faSyringe, faFolder, faFolderOpen, faFileArchive, faCog, faFileWord, faFileExcel, faFilePowerpoint, faFilePdf, faDatabase, faKey, faFileCode, faDownload, faUpload, faFileImage, faCopy, faBoxOpen, faFileAlt } from '@fortawesome/free-solid-svg-icons';

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
      return faCog;
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
    case "list":
      return faList;
    case "delete":
      return faTrashAlt;
    case "inject":
      return faSyringe;
    case "kill":
      return faSkullCrossbones;
    case "camera":
      return faCamera;
    default:
      return faFileAlt;
  }
}
const doubleClickRow = () => {

}
const ResponseDisplayTableStringCell = ({cellData, rowData}) => {
  return (
    <div style={{...cellData?.cellStyle || null}}>
      {cellData?.copyIcon? 
        <MythicStyledTooltip title={"Copy to clipboard"}>
            <IconButton onClick={() => onCopyToClipboard(cellData["plaintext"])} size="small">
                <FontAwesomeIcon icon={faCopy} />
            </IconButton>
        </MythicStyledTooltip> : null}
      {cellData?.startIcon? 
        <MythicStyledTooltip title={cellData?.startIconHoverText || ""} >
            <FontAwesomeIcon icon={getIconName(cellData?.startIcon)} style={{marginRight: "5px", color: cellData?.startIconColor  || ""}}/>
        </MythicStyledTooltip>
         : null
      }
      {cellData?.plaintextHoverText? (
        <MythicStyledTooltip title={cellData.plaintextHoverText}>
          <pre style={{display: "inline-block"}}>
            {cellData?.plaintext || " "}
          </pre>
          
        </MythicStyledTooltip>
      ) : (
        <pre style={{display: "inline-block"}}>
            {cellData?.plaintext || " "}
          </pre>
      )}
      {cellData?.endIcon? 
       <MythicStyledTooltip title={cellData?.endIconHoverText || ""}>
          <FontAwesomeIcon icon={getIconName(cellData?.endIcon)} style={{color: cellData?.endIconColor  || ""}}/>
        </MythicStyledTooltip>: null
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
const ResponseDisplayTableSizeCell = ({cellData, rowData}) => {
  return (
    <div style={{...cellData?.cellStyle || null}}>
        {cellData?.plaintextHoverText? (
        <MythicStyledTooltip title={cellData.plaintextHoverText} >
          <pre style={{display: "inline-block"}}>
            {getStringSize({cellData})}
          </pre>
          
        </MythicStyledTooltip>
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
            <MythicStyledTooltip title={cellData?.button?.hoverText || "Display Data"} >
              <Button size="small" variant="contained" color="primary" 
                onClick={() => setOpenButton(true)} disabled={cellData?.button?.disabled || false}
                startIcon={cellData?.button?.startIcon ? <FontAwesomeIcon icon={getIconName(cellData?.button?.startIcon)} style={{color: cellData?.button?.startIconColor  || ""}}/> : null}
                >{cellData?.button?.name || " "}</Button>
            </MythicStyledTooltip>
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
            <MythicStyledTooltip title={cellData?.button?.hoverText || "Issues Task to Agent"}>
              <Button size="small" onClick={() => setOpenTaskingButton(true)} disabled={cellData?.button?.disabled || false} variant="contained" color="secondary" 
                startIcon={cellData?.button?.startIcon ? <FontAwesomeIcon icon={getIconName(cellData?.button?.startIcon)} style={{color: cellData?.button?.startIconColor  || ""}}/> : null}
              >{cellData?.button?.name || " "}</Button>
            </MythicStyledTooltip>
            {openTaskingButton && 
              <TaskFromUIButton ui_feature={cellData?.button?.ui_feature || " "} 
                callback_id={callback_id} 
                parameters={cellData?.button?.parameters || ""}
                onTasked={() => setOpenTaskingButton(false)}/>
            }
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
                                <MythicStyledTooltip title={option?.hoverText || (option.type === "task" ? "Task an Agent" : "Display Data")}>
                                    {option?.startIcon ? <FontAwesomeIcon icon={getIconName(option?.startIcon)} style={{color: option?.startIconColor  || "", marginRight: "5px"}}/> : null}
                                    {option.name}
                                </MythicStyledTooltip>
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
    <div style={{...rowData?.rowStyle || null, ...cellData?.cellStyle || null}}>
      {cellData?.plaintext ? cellData.plaintext : null}
      {cellData?.button ? (getButtonObject()) : (null)}
    </div>
  )
}

export const ResponseDisplayTable = ({table, callback_id}) =>{
  const theme = useTheme();
  const rowHeight = 35;
  const headerHeight = 45;
  const [dataHeight, setDataHeight] = React.useState(530);
  const maxElements = Math.floor(dataHeight / rowHeight);
  const [allData, setAllData] = React.useState([]);
  const [sortData, setSortData] = React.useState({sortKey: null, sortType: null, sortDirection: "ASC"})
  const sortedData = React.useMemo(() => {
    if (sortData.sortKey === null || sortData.sortType === null) {
      return allData
    }
    const tmpData = [...allData];
    if(sortData.sortType === "number" || sortData.sortType === "size"){
      tmpData.sort((a, b) => (parseInt(a[sortData.sortKey]["plaintext"]) > parseInt(b[sortData.sortKey]["plaintext"]) ? 1 : -1));
    }else if(sortData.sortType === "date"){
      tmpData.sort((a,b) => ( (new Date(a[sortData.sortKey]["plaintext"])) > (new Date(b[sortData.sortKey]["plaintext"])) ? 1: -1));
    }else{
      tmpData.sort( (a, b) => {
        if(a[sortData.sortKey]["plaintext"] === undefined){
          return -1;
        }else if(b[sortData.sortKey]["plaintext"] === undefined){
          return 1;
        }
        return a[sortData.sortKey]["plaintext"].toLowerCase() > b[sortData.sortKey]["plaintext"].toLowerCase() ? 1 : -1
      });
    }
    if(sortData.sortDirection === "DESC"){
      tmpData.reverse();
    }
    return tmpData;
  }, [allData, sortData]);
  const onClickHeader = (e, columnIndex) => {
    const column = table.headers[columnIndex];
    console.log(column)
    if(column.disableSort){
        return;
    }
    if (!column.plaintext) {
        setSortData({sortKey: null, sortType: null, sortDirection: "ASC"});
    }
    if (sortData.sortKey === column.plaintext) {
        if (sortData.sortDirection === 'ASC') {
            setSortData({sortKey: column.plaintext, sortType: column.type, sortDirection: "DESC"});
        } else {
            setSortData({sortKey: column.plaintext, sortType: column.type, sortDirection: "ASC"});
        }
    } else {
        setSortData({sortKey: column.plaintext, sortType: column.type, sortDirection: "ASC"});
    }
  };
  const gridData = React.useMemo(
    () => {
        return sortedData.map((row) => {
          let rowData = [];
          for(let i = 0; i < table.headers.length; i++){
            switch(table.headers[i].type){
              case "string":
                rowData.push(
                  <ResponseDisplayTableStringCell cellData={row[table.headers[i]['plaintext']]} rowData={row}/>
                )
                break;
              case "size":
                rowData.push(
                  <ResponseDisplayTableSizeCell cellData={row[table.headers[i]['plaintext']]} rowData={row}/>
                )
                break;
              case "button":
                rowData.push(
                  <ResponseDisplayTableActionCell callback_id={callback_id} cellData={row[table.headers[i]['plaintext']]} rowData={row}/>
                )
                break;
              default:
                rowData.push(
                  <ResponseDisplayTableStringCell cellData={row[table.headers[i]['plaintext']]} rowData={row}/>
                )
                break;
            }
          }
          return [...rowData];
        });
    }, [sortedData]
  );
  
  useEffect( () => {
    setAllData([...table.rows]);
    if(table.rows.length < maxElements){
      setDataHeight((table.rows.length * rowHeight) + headerHeight);
    }
  }, [table.rows])
  const sortColumn = table.headers.findIndex((column) => column.plaintext === sortData.sortKey);
  return (
      <React.Fragment>
        {table?.title ? (
          <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main, marginBottom: "5px", marginTop: "10px", marginRight: "5px"}} variant={"elevation"}>
              <Typography variant="h5" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                  {table.title}
              </Typography>
          </Paper>
        ) : (null)}
          
          <div style={{height: dataHeight, width: "100%"}}>
            <MythicResizableGrid
                  columns={table.headers}
                  sortIndicatorIndex={sortColumn}
                  sortDirection={sortData.sortDirection}
                  items={gridData}
                  widthMeasureKey={"plaintext"}
                  headerNameKey={"plaintext"}
                  onDoubleClickRow={doubleClickRow}
                  rowHeight={rowHeight}
                  onClickHeader={onClickHeader}
              />
            
          </div>
      </React.Fragment>
    
  )   
}