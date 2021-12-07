import React, {useEffect} from 'react';
import {useMutation, useLazyQuery, gql } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import { MythicDialog, MythicModifyStringDialog, MythicViewJSONAsTableDialog } from '../../MythicComponents/MythicDialog';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import Paper from '@material-ui/core/Paper';
import DescriptionIcon from '@material-ui/icons/Description';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import {useTheme} from '@material-ui/core/styles';
import {Button} from '@material-ui/core';
import Grow from '@material-ui/core/Grow';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import EditIcon from '@material-ui/icons/Edit';
import Tooltip from '@material-ui/core/Tooltip';
import {DownloadHistoryDialog} from './DownloadHistoryDialog';
import HistoryIcon from '@material-ui/icons/History';
import VisibilityIcon from '@material-ui/icons/Visibility';
import Divider from '@material-ui/core/Divider';
import ListIcon from '@material-ui/icons/List';
import DeleteIcon from '@material-ui/icons/Delete';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Typography } from '@material-ui/core';
import {Table, Column, AutoSizer} from 'react-virtualized';
import 'react-virtualized/styles.css';
import Draggable from 'react-draggable';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import { copyStringToClipboard } from '../../utilities/Clipboard';

const getPermissionsDataQuery = gql`
query getPermissionsQuery($filebrowserobj_id: Int!){
    filebrowserobj_by_pk(id: $filebrowserobj_id){
        id
        permissions
    }
}
`;
const getFileDownloadHistory = gql`
query getFileDownloadHistory($filebrowserobj_id: Int!){
    filebrowserobj_by_pk(id: $filebrowserobj_id){
        filemeta {
            id
            comment
            agent_file_id
            chunks_received
            complete
            total_chunks
            timestamp
            task {
                id
                comment
            }
        }
    }
}
`;
const updateFileComment = gql`
mutation updateCommentMutation($filebrowserobj_id: Int!, $comment: String!){
    update_filebrowserobj_by_pk(pk_columns: {id: $filebrowserobj_id}, _set: {comment: $comment}) {
        comment
        id
    }
}
`;
const CellRenderer = ({columnData, dataKey, rowData}) => {
    const DisplayData = () => {
        switch(columnData.format){
        case "string":
            return <FileBrowserTableRowStringCell cellData={rowData[dataKey]} rowData={rowData}/>
        case "name":
            return <FileBrowserTableRowNameCell cellData={rowData[dataKey]} rowData={rowData} />
        case "size":
            return <FileBrowserTableRowSizeCell cellData={rowData[dataKey]} />
        case "button":
            return <FileBrowserTableRowActionCell rowData={rowData} onTaskRowAction={columnData.onTaskRowAction}/>
        default:
            return <FileBrowserTableRowStringCell cellData={rowData[dataKey]} rowData={rowData} />
        }
    };
    return (
        DisplayData()
    )
}
export const CallbacksTabsFileBrowserTable = (props) => {
    const [allData, setAllData] = React.useState([]);
    const widthRef = React.useRef(null);
    const [sortDirection, setSortDirection] = React.useState("ASC");
    const [sortBy, setSortBy] = React.useState("name_text");
    const [columnWidths, setColumnWidths] = React.useState({
        actions: .065,
        name_text: .45,
        size: .08,
        modify_time: .18,
        comment: .2,
        
    })
    const [columns, setColumns] = React.useState([]);
    
    const sortTable = ({sortBy, sortDirection}) => {
        const tmpData = [...allData];
        const sortType = columns.filter( h => h.dataKey === sortBy)[0]["columnData"]["format"];
        if(sortType === "number" || sortType === "size"){
          tmpData.sort((a, b) => (parseInt(a[sortBy]) > parseInt(b[sortBy]) ? 1 : -1));
        }else if(sortType === "date"){
          tmpData.sort((a,b) => ( (new Date(a[sortBy])) > (new Date(b[sortBy])) ? 1: -1));
        }else{
          tmpData.sort( (a, b) => a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? 1 : -1);
        }
        if(sortDirection === "DESC"){
          tmpData.reverse();
        }
        setAllData([...tmpData]);
        setSortBy(sortBy);
        setSortDirection(sortDirection);
    
    };
    const rowGetter = ({index}) => {
        return allData[index];
    };
    const resizeRow = React.useCallback( ({event, dataKey, deltaX}) => {
        event.preventDefault();
        event.stopPropagation();
        const prevWidths = {...columnWidths};
        const percentDelta = deltaX / widthRef.current.offsetWidth;
        let nextHeader = "";
        let getNext = false;
        for(const [key, val] of Object.entries(columnWidths)){
            if(getNext){
                nextHeader = key;
                break;
            }else if(key === dataKey){
                getNext = true;
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
        setColumnWidths(updatedWidths);
    }, [columnWidths]);
    const headerRenderer = React.useCallback( ({columnData, dataKey, disableSort, label, sortBy, sortDirection}) => {
        return (
          <React.Fragment key={"header" + dataKey}>
            <span style={{display: "inline-flex", flexDirection: "row", alignContent: "stretch", justifyContent: "flex-start"}}>
              {label}
              {sortBy === dataKey ? (
                sortDirection === "ASC" ? (
                  <ArrowDownwardIcon />
                ) : (
                  <ArrowUpwardIcon />
                )
              ) :(null) }
            </span>
            {columnData.format !== "button" && label !== "Comment" && 
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
            }
            
          </React.Fragment>
        )
      }, [resizeRow, columns]);
    const onRowDoubleClick = ({event, index, rowData}) => {
        if(rowData.is_file){
            return;
        }
        snackActions.info("Fetching contents of folder...");
        props.onRowDoubleClick(rowData);
    }
    useEffect( () => {
        setColumns([
            {columnData: {format: "button", onTaskRowAction: props.onTaskRowAction}, dataKey: 'actions', label: "Actions", 
                cellRenderer: CellRenderer, width: columnWidths.actions * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            {columnData: {format: "name"}, dataKey: 'name_text', label: "Name", 
                cellRenderer: CellRenderer, width: columnWidths.name_text * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            {columnData: {format: "size"}, dataKey: 'size', label: "Size", 
                cellRenderer: CellRenderer, width: columnWidths.size * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            {columnData: {format: "date"}, dataKey: 'modify_time', label: "Last Modified", 
                cellRenderer: CellRenderer,  width: columnWidths.modify_time * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            {columnData: {format: "string"}, dataKey: 'comment',  label: "Comment", 
                cellRenderer: CellRenderer, width: columnWidths.comment * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            
        ])
    }, [columnWidths, props.onTaskRowAction]);

    useEffect( () => {
        //console.log("setting selected folder", props.selectedFolder);
        if(props.showDeletedFiles){
            setAllData([...props.selectedFolder]);
        }else{
            const filteredData = props.selectedFolder.filter( f => !f.deleted );
            setAllData([...filteredData]);
        }
        
    }, [props.selectedFolder, props.showDeletedFiles]);
    
    return (
        <div ref={widthRef} style={{width: "100%", height: "90%", overflow: 'hidden'}}>
            <AutoSizer>
                {({height, width}) => (
                    <Table
                        headerHeight={25}
                        rowCount={allData.length}
                        rowGetter={ rowGetter }
                        rowHeight={35}
                        height={height}
                        width={width}
                        sort={sortTable}
                        sortBy={sortBy}
                        onRowDoubleClick={onRowDoubleClick}
                        sortDirection={sortDirection}
                        >
                        {columns.map( (col) => (
                            <Column key={"col" + col.dataKey} {...col} />
                        ))}
                    </Table>
                )}
            </AutoSizer>
        </div>
    )
}
const FileBrowserTableRowNameCell = ({cellData, rowData}) => {
    const theme = useTheme();
    return (
        <div style={{alignItems: "center", display: "flex", textDecoration: rowData.deleted ? 'line-through': ''}}>
            {rowData.is_file ? (<DescriptionIcon style={{marginRight: "5px"}}/>) : (<FolderOpenIcon style={{marginRight: "5px", color: rowData.filebrowserobjs_aggregate.aggregate.count > 0 || rowData.success !== null ? theme.folderColor : "grey"}}/>)}
            {rowData.filemeta.length > 0 ? (<GetAppIcon style={{color: theme.palette.success.main}}/>) : (null)}
            <Typography style={{color:rowData.filebrowserobjs_aggregate.aggregate.count > 0 ||  rowData.success !== null ? theme.palette.text.primary : theme.palette.text.secondary}}>
                {cellData}
            </Typography>
            {rowData.success === true ? (
                <Tooltip title="Successfully listed contents of folder">
                    <CheckCircleIcon fontSize="small" style={{ color: theme.palette.success.main}}/>
                </Tooltip>) : (
                rowData.success === false ? (
                    <Tooltip title="Failed to list contents of folder">
                        <ErrorIcon fontSize="small" style={{ color: theme.palette.error.main}} />
                    </Tooltip>
                ) : (
                    null
                )
            )}
        </div>
    )
}
const FileBrowserTableRowStringCell = ({cellData}) => {
    return (
            cellData
    )
}
const FileBrowserTableRowSizeCell = ({cellData}) => {
    const getStringSize = () => {
        try{
            // process for getting human readable string from bytes: https://stackoverflow.com/a/18650828
            let bytes = parseInt(cellData);
            if (cellData === '') return '';
            if (bytes === 0) return '0 Bytes';
            const decimals = 2;
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }catch(error){
            return cellData;
        }
    }
    return (
        <div>
            {getStringSize(cellData)}
        </div>
    )
}
const FileBrowserTableRowActionCell = ({rowData, onTaskRowAction}) => {
    const dropdownAnchorRef = React.useRef(null);
    const theme = useTheme();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [fileCommentDialogOpen, setFileCommentDialogOpen] = React.useState(false);
    const [viewPermissionsDialogOpen, setViewPermissionsDialogOpen] = React.useState(false);
    const [fileHistoryDialogOpen, setFileHistoryDialogOpen] = React.useState(false);
    const [permissionData, setPermissionData] = React.useState("");
    const [downloadHistory, setDownloadHistory] = React.useState([]);
    const [getPermissions] = useLazyQuery(getPermissionsDataQuery, {
        onCompleted: (data) => {
            setPermissionData(data.filebrowserobj_by_pk.permissions);
            if(data.filebrowserobj_by_pk.permissions !== ""){
                setViewPermissionsDialogOpen(true);
            }else{
                snackActions.warning("No permission data available");
            }
        },
        fetchPolicy: "network-only"
    });
    const [getHistory] = useLazyQuery(getFileDownloadHistory, {
        onCompleted: (data) => {
            //console.log(data);
            if(data.filebrowserobj_by_pk.filemeta.length === 0){
                snackActions.warning("File has no download history");
            }else{
                setDownloadHistory(data.filebrowserobj_by_pk.filemeta);
                setFileHistoryDialogOpen(true);
            }
        },
        fetchPolicy: "network-only"
    })
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {filebrowserobj_id: rowData.id, comment: comment}})
    }
    const handleDropdownToggle = (evt) => {
        evt.stopPropagation();
        setDropdownOpen((prevOpen) => !prevOpen);
    };
    const handleMenuItemClick = (whichOption, event, index) => {
        switch (whichOption){
            case "A":
                optionsA[index].click(event);
                break;
            case "B":
                optionsB[index].click(event);
                break;
            default:
                break;
        }
        setDropdownOpen(false);
    };
    const handleClose = (event) => {
        if (dropdownAnchorRef.current && dropdownAnchorRef.current.contains(event.target)) {
          return;
        }
        setDropdownOpen(false);
    };
    const copyToClipboard = () => {
        let result = copyStringToClipboard(rowData.full_path_text);
        if(result){
          snackActions.success("Copied text!");
        }else{
          snackActions.error("Failed to copy text");
        }
    }
    const optionsA = [{name: 'View Permissions', icon: <VisibilityIcon style={{paddingRight: "5px"}}/>, click: (evt) => {
                        evt.stopPropagation();
                        getPermissions({variables: {filebrowserobj_id: rowData.id}});
                    }},
                    {name: 'Download History', icon: <HistoryIcon style={{paddingRight: "5px"}}/>, click: (evt) => {
                        evt.stopPropagation();
                        getHistory({variables: {filebrowserobj_id: rowData.id}});
                    }},
                    {name: 'Edit Comment', icon: <EditIcon style={{paddingRight: "5px"}}/>, click: (evt) => {
                        evt.stopPropagation();
                        setFileCommentDialogOpen(true);
                    }},
                    {name: 'Copy Path to Clipboard', icon: <FileCopyOutlinedIcon style={{paddingRight: "5px"}}/>, click: (evt) => {
                        evt.stopPropagation();
                        copyToClipboard();
                    }},
    ];
    const optionsB = [{name: 'Task File Listing', icon: <ListIcon style={{paddingRight: "5px", color: theme.palette.warning.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        onTaskRowAction({
                            path: rowData.parent_path_text,
                            host: rowData.host,
                            filename: rowData.name_text,
                            uifeature: "file_browser:list"
                        });
                    }},
                    {name: 'Task Download', icon: <GetAppIcon style={{paddingRight: "5px", color: theme.palette.success.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        onTaskRowAction({
                            path: rowData.parent_path_text,
                            host: rowData.host,
                            filename: rowData.name_text,
                            uifeature: "file_browser:download"
                        });
                    }},
                    {name: 'Task File Removal', icon: <DeleteIcon style={{paddingRight: "5px", color: theme.palette.error.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        onTaskRowAction({
                            path: rowData.parent_path_text,
                            host: rowData.host,
                            filename: rowData.name_text,
                            uifeature: "file_browser:remove"
                        });
                        
                    }},
    ];
    return (
        <React.Fragment>
            <Button
                style={{padding:0}} 
                size="small"
                aria-controls={dropdownOpen ? 'split-button-menu' : undefined}
                aria-expanded={dropdownOpen ? 'true' : undefined}
                aria-haspopup="menu"
                onClick={handleDropdownToggle}
                color="primary"
                variant="contained"
                ref={dropdownAnchorRef}
            >
                Actions
            </Button>
            <Popper open={dropdownOpen} anchorEl={dropdownAnchorRef.current} role={undefined} transition style={{zIndex: 4000}}>
            {({ TransitionProps, placement }) => (
                <Grow
                {...TransitionProps}
                style={{
                    transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                }}
                >
                <Paper style={{backgroundColor: theme.palette.type === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light, color: "white"}}>
                    <ClickAwayListener onClickAway={handleClose}>
                    <MenuList id="split-button-menu">
                        {optionsA.map((option, index) => (
                        <MenuItem
                            key={option.name}
                            onClick={(event) => handleMenuItemClick("A", event, index)}
                        >
                            {option.icon}{option.name}
                        </MenuItem>
                        ))}
                        <Divider />
                        {optionsB.map((option, index) => (
                        <MenuItem
                            key={option.name}
                            onClick={(event) => handleMenuItemClick("B", event, index)}
                        >
                            {option.icon}{option.name}
                        </MenuItem>
                        ))}
                    </MenuList>
                    </ClickAwayListener>
                </Paper>
                </Grow>
            )}
            </Popper>
            {fileCommentDialogOpen && 
                <MythicDialog fullWidth={true} maxWidth="md" open={fileCommentDialogOpen} 
                    onClose={()=>{setFileCommentDialogOpen(false);}} 
                    innerDialog={<MythicModifyStringDialog title="Edit File Browser Comment" onSubmit={onSubmitUpdatedComment} value={rowData.comment} onClose={()=>{setFileCommentDialogOpen(false);}} />}
                />
            }
            {viewPermissionsDialogOpen &&
                <MythicDialog fullWidth={true} maxWidth="md" open={viewPermissionsDialogOpen} 
                    onClose={()=>{setViewPermissionsDialogOpen(false);}} 
                    innerDialog={<MythicViewJSONAsTableDialog title="View Permissions Data" leftColumn="Permission" rightColumn="Value" value={permissionData} onClose={()=>{setViewPermissionsDialogOpen(false);}} />}
                />
            }
            {fileHistoryDialogOpen &&
                <MythicDialog fullWidth={true} maxWidth="md" open={fileHistoryDialogOpen} 
                    onClose={()=>{setFileHistoryDialogOpen(false);}} 
                    innerDialog={<DownloadHistoryDialog title="Download History" value={downloadHistory} onClose={()=>{setFileHistoryDialogOpen(false);}} />}
                />
            }
            
        </React.Fragment>
    )
}
