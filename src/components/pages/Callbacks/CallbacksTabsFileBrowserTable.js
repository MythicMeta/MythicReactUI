import React, { useEffect } from 'react';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import {
    MythicDialog,
    MythicModifyStringDialog,
    MythicViewJSONAsTableDialog,
} from '../../MythicComponents/MythicDialog';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import Paper from '@material-ui/core/Paper';
import DescriptionIcon from '@material-ui/icons/Description';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import { useTheme } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import Grow from '@material-ui/core/Grow';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import EditIcon from '@material-ui/icons/Edit';
import { DownloadHistoryDialog } from './DownloadHistoryDialog';
import HistoryIcon from '@material-ui/icons/History';
import VisibilityIcon from '@material-ui/icons/Visibility';
import Divider from '@material-ui/core/Divider';
import ListIcon from '@material-ui/icons/List';
import DeleteIcon from '@material-ui/icons/Delete';
import GetAppIcon from '@material-ui/icons/GetApp';
import 'react-virtualized/styles.css';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import { copyStringToClipboard } from '../../utilities/Clipboard';
import MythicResizableGrid from '../../MythicComponents/MythicResizableGrid';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import {TableFilterDialog} from './TableFilterDialog';
import {MythicTransferListDialog} from '../../MythicComponents/MythicTransferList';

const getPermissionsDataQuery = gql`
    query getPermissionsQuery($filebrowserobj_id: Int!) {
        filebrowserobj_by_pk(id: $filebrowserobj_id) {
            id
            permissions
        }
    }
`;
const getFileDownloadHistory = gql`
    query getFileDownloadHistory($filebrowserobj_id: Int!) {
        filebrowserobj_by_pk(id: $filebrowserobj_id) {
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
    mutation updateCommentMutation($filebrowserobj_id: Int!, $comment: String!) {
        update_filebrowserobj_by_pk(pk_columns: { id: $filebrowserobj_id }, _set: { comment: $comment }) {
            comment
            id
        }
    }
`;


export const CallbacksTabsFileBrowserTable = (props) => {
    const [allData, setAllData] = React.useState([]);
    const [openContextMenu, setOpenContextMenu] = React.useState(false);
    const [filterOptions, setFilterOptions] = React.useState({});
    const [selectedColumn, setSelectedColumn] = React.useState({});
    const [sortData, setSortData] = React.useState({"sortKey": null, "sortDirection": null, "sortType": null})
    const [columnVisibility, setColumnVisibility] = React.useState({
        "visible": ["Actions", "Name", "Size", "Last Modified"],
        "hidden": ["Comment"]
    });
    const [openAdjustColumnsDialog, setOpenAdjustColumnsDialog] = React.useState(false);
    const columns = React.useMemo(
        () =>
            [
                { name: 'Actions', width: 100, disableAutosize: true, disableSort: true, disableFilterMenu: true },
                { name: 'Name', type: 'string', key: 'name_text', fillWidth: true },
                { name: 'Size', type: 'number', key: 'size', width: 200 },
                { name: 'Last Modified', type: 'date', key: 'modify_time', width: 200 },
                { name: 'Comment', type: 'string', key: 'comment', width: 200 },
            ].reduce( (prev, cur) => {
                if(columnVisibility.visible.includes(cur.name)){
                    if(filterOptions[cur.key] && String(filterOptions[cur.key]).length > 0){
                        return [...prev, {...cur, filtered: true}];
                    }else{
                        return [...prev, {...cur}];
                    }
                }else{
                    return [...prev];
                }
            }, [])
        , [filterOptions, columnVisibility]
    );
    const sortedData = React.useMemo(() => {
        if (sortData.sortKey === null || sortData.sortType === null) {
            return allData;
        }
        const tempData = [...allData];

        if (sortData.sortType === 'number' || sortData.sortType === 'size' || sortData.sortType === 'date') {
            tempData.sort((a, b) => (parseInt(a[sortData.sortKey]) > parseInt(b[sortData.sortKey]) ? 1 : -1));
        } else if (sortData.sortType === 'string') {
            tempData.sort((a, b) => (a[sortData.sortKey].toLowerCase() > b[sortData.sortKey].toLowerCase() ? 1 : -1));
        }
        if (sortData.sortDirection === 'DESC') {
            tempData.reverse();
        }
        return tempData;
    }, [allData, sortData]);
    const onSubmitFilterOptions = (newFilterOptions) => {
        setFilterOptions(newFilterOptions);
    }
    const filterRow = (row) => {
        for(const [key,value] of Object.entries(filterOptions)){
            if(!String(row[key]).toLowerCase().includes(value)){
                return true;
            }
        }
        return false;
    }
    const gridData = React.useMemo(
        () =>
            sortedData.reduce((prev, row) => {
                if(filterRow(row)){
                    return [...prev];
                }else{
                    return [...prev, columns.map( c => {
                        switch(c.name){
                            case "Actions":
                                return  <FileBrowserTableRowActionCell rowData={row} onTaskRowAction={props.onTaskRowAction} />;
                            case "Name":
                                return <FileBrowserTableRowNameCell rowData={row} cellData={row.name_text} />;
                            case "Size":
                                return FileBrowserTableRowSizeCell({ cellData: row.size });
                            case "Last Modified":
                                return FileBrowserTableRowDateCell({ cellData: row.modify_time });
                            case "Comment":
                                return FileBrowserTableRowStringCell({ cellData: row.comment });
                        }
                    })];
                }
                
        }, []),
        [sortedData, props.onTaskRowAction, filterOptions, columnVisibility]
    );

    useEffect(() => {
        if (props.showDeletedFiles) {
            setAllData([...props.selectedFolder]);
        } else {
            const filteredData = props.selectedFolder.filter((f) => !f.deleted);
            setAllData([...filteredData]);
        }
    }, [props.selectedFolder, props.showDeletedFiles]);

    const onRowDoubleClick = (e, rowIndex) => {
        const rowData = allData[rowIndex];
        if (rowData.is_file) {
            return;
        }
        snackActions.info('Fetching contents of folder...');
        props.onRowDoubleClick(rowData);

        setSortData({"sortKey": null, "sortType":null, "sortDirection": "ASC"});
    };

    const onClickHeader = (e, columnIndex) => {
        const column = columns[columnIndex];
        if(column.disableSort){
            return;
        }
        if (!column.key) {
            setSortData({"sortKey": null, "sortType":null, "sortDirection": "ASC"});
        }
        if (sortData.sortKey === column.key) {
            if (sortData.sortDirection === 'ASC') {
                setSortData({...sortData, "sortDirection": "DESC"});
            } else {
                setSortData({"sortKey": null, "sortType":null, "sortDirection": "ASC"});
            }
        } else {
            setSortData({"sortKey": column.key, "sortType":column.type, "sortDirection": "ASC"});
        }
    };
    const contextMenuOptions = [
        {
            name: 'Filter Column', 
            click: ({event, columnIndex}) => {
                if(columns[columnIndex].disableFilterMenu){
                    snackActions.warning("Can't filter that column");
                    return;
                }
                setSelectedColumn(columns[columnIndex]);
                setOpenContextMenu(true);
            }
        },
        {
            name: "Show/Hide Columns",
            click: ({event, columnIndex}) => {
                if(columns[columnIndex].disableFilterMenu){
                    snackActions.warning("Can't filter that column");
                    return;
                }
                setOpenAdjustColumnsDialog(true);
            }
        }
    ];
    const onSubmitAdjustColumns = ({left, right}) => {
        setColumnVisibility({visible: right, hidden: left});
    }
    const sortColumn = columns.findIndex((column) => column.key === sortData.sortKey);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <MythicResizableGrid
                columns={columns}
                sortIndicatorIndex={sortColumn}
                sortDirection={sortData.sortDirection}
                items={gridData}
                rowHeight={35}
                onClickHeader={onClickHeader}
                onDoubleClickRow={onRowDoubleClick}
                contextMenuOptions={contextMenuOptions}
            />
            {openContextMenu &&
                <MythicDialog fullWidth={true} maxWidth="xs" open={openContextMenu} 
                    onClose={()=>{setOpenContextMenu(false);}} 
                    innerDialog={<TableFilterDialog 
                        selectedColumn={selectedColumn} 
                        filterOptions={filterOptions} 
                        onSubmit={onSubmitFilterOptions} 
                        onClose={()=>{setOpenContextMenu(false);}} />}
                />
            }
            {openAdjustColumnsDialog &&
                <MythicDialog fullWidth={true} maxWidth="md" open={openAdjustColumnsDialog} 
                  onClose={()=>{setOpenAdjustColumnsDialog(false);}} 
                  innerDialog={
                    <MythicTransferListDialog onClose={()=>{setOpenAdjustColumnsDialog(false);}} 
                      onSubmit={onSubmitAdjustColumns} right={columnVisibility.visible} rightTitle="Show these columns"
                      leftTitle={"Hidden Columns"} left={columnVisibility.hidden} dialogTitle={"Edit which columns are shown"}/>}
                />
            } 
        </div>
    );
};
const FileBrowserTableRowNameCell = ({ cellData, rowData }) => {
    const theme = useTheme();
    return (
        <div style={{ alignItems: 'center', display: 'flex', textDecoration: rowData.deleted ? 'line-through' : '' }}>
            {rowData.is_file ? (
                <DescriptionIcon style={{ marginRight: '5px' }} />
            ) : (
                <FolderOpenIcon
                    style={{
                        marginRight: '5px',
                        color:
                            rowData.filebrowserobjs_aggregate.aggregate.count > 0 || rowData.success !== null
                                ? theme.folderColor
                                : 'grey',
                    }}
                />
            )}
            {rowData.filemeta.length > 0 ? <GetAppIcon style={{ color: theme.palette.success.main }} /> : null}
            <pre 
                style={{
                    color:
                        rowData.filebrowserobjs_aggregate.aggregate.count > 0 || rowData.success !== null
                            ? theme.palette.text.primary
                            : theme.palette.text.secondary,
                }}>
                {cellData}
            </pre>
            {rowData.success === true ? (
                <MythicStyledTooltip title='Successfully listed contents of folder'>
                    <CheckCircleIcon fontSize='small' style={{ color: theme.palette.success.main }} />
                </MythicStyledTooltip>
            ) : rowData.success === false ? (
                <MythicStyledTooltip title='Failed to list contents of folder'>
                    <ErrorIcon fontSize='small' style={{ color: theme.palette.error.main }} />
                </MythicStyledTooltip>
            ) : null}
        </div>
    );
};
const FileBrowserTableRowStringCell = ({ cellData }) => {
    return cellData;
};
const FileBrowserTableRowDateCell = ({ cellData }) => {
    if(cellData === "" || cellData <= 0){
        return cellData;
    }
    return (new Date(parseInt(cellData))).toISOString();
};
const FileBrowserTableRowSizeCell = ({ cellData }) => {
    const getStringSize = () => {
        try {
            // process for getting human readable string from bytes: https://stackoverflow.com/a/18650828
            let bytes = parseInt(cellData);
            if (cellData === '') return '';
            if (bytes === 0) return '0 B';
            const decimals = 2;
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        } catch (error) {
            return cellData;
        }
    };
    return getStringSize(cellData);
};
const FileBrowserTableRowActionCell = ({ rowData, onTaskRowAction }) => {
    const dropdownAnchorRef = React.useRef(null);
    const theme = useTheme();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [fileCommentDialogOpen, setFileCommentDialogOpen] = React.useState(false);
    const [viewPermissionsDialogOpen, setViewPermissionsDialogOpen] = React.useState(false);
    const [fileHistoryDialogOpen, setFileHistoryDialogOpen] = React.useState(false);
    const [permissionData, setPermissionData] = React.useState('');
    const [downloadHistory, setDownloadHistory] = React.useState([]);
    const [getPermissions] = useLazyQuery(getPermissionsDataQuery, {
        onCompleted: (data) => {
            setPermissionData(data.filebrowserobj_by_pk.permissions);
            if (data.filebrowserobj_by_pk.permissions !== '') {
                setViewPermissionsDialogOpen(true);
            } else {
                snackActions.warning('No permission data available');
            }
        },
        fetchPolicy: 'network-only',
    });
    const [getHistory] = useLazyQuery(getFileDownloadHistory, {
        onCompleted: (data) => {
            //console.log(data);
            if (data.filebrowserobj_by_pk.filemeta.length === 0) {
                snackActions.warning('File has no download history');
            } else {
                setDownloadHistory(data.filebrowserobj_by_pk.filemeta);
                setFileHistoryDialogOpen(true);
            }
        },
        fetchPolicy: 'network-only',
    });
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success('updated comment');
        },
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({ variables: { filebrowserobj_id: rowData.id, comment: comment } });
    };
    const handleDropdownToggle = (evt) => {
        evt.stopPropagation();
        setDropdownOpen((prevOpen) => !prevOpen);
    };
    const handleMenuItemClick = (whichOption, event, index) => {
        switch (whichOption) {
            case 'A':
                optionsA[index].click(event);
                break;
            case 'B':
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
        if (result) {
            snackActions.success('Copied text!');
        } else {
            snackActions.error('Failed to copy text');
        }
    };
    const optionsA = [
        {
            name: 'View Permissions',
            icon: <VisibilityIcon style={{ paddingRight: '5px' }} />,
            click: (evt) => {
                evt.stopPropagation();
                getPermissions({ variables: { filebrowserobj_id: rowData.id } });
            },
        },
        {
            name: 'Download History',
            icon: <HistoryIcon style={{ paddingRight: '5px' }} />,
            click: (evt) => {
                evt.stopPropagation();
                getHistory({ variables: { filebrowserobj_id: rowData.id } });
            },
        },
        {
            name: 'Edit Comment',
            icon: <EditIcon style={{ paddingRight: '5px' }} />,
            click: (evt) => {
                evt.stopPropagation();
                setFileCommentDialogOpen(true);
            },
        },
        {
            name: 'Copy Path to Clipboard',
            icon: <FileCopyOutlinedIcon style={{ paddingRight: '5px' }} />,
            click: (evt) => {
                evt.stopPropagation();
                copyToClipboard();
            },
        },
    ];
    const optionsB = [
        {
            name: 'Task File Listing',
            icon: <ListIcon style={{ paddingRight: '5px', color: theme.palette.warning.main }} />,
            click: (evt) => {
                evt.stopPropagation();
                onTaskRowAction({
                    path: rowData.parent_path_text,
                    host: rowData.host,
                    filename: rowData.name_text,
                    uifeature: 'file_browser:list',
                });
            },
        },
        {
            name: 'Task Download',
            icon: <GetAppIcon style={{ paddingRight: '5px', color: theme.palette.success.main }} />,
            click: (evt) => {
                evt.stopPropagation();
                onTaskRowAction({
                    path: rowData.parent_path_text,
                    host: rowData.host,
                    filename: rowData.name_text,
                    uifeature: 'file_browser:download',
                });
            },
        },
        {
            name: 'Task File Removal',
            icon: <DeleteIcon style={{ paddingRight: '5px', color: theme.palette.error.main }} />,
            click: (evt) => {
                evt.stopPropagation();
                onTaskRowAction({
                    path: rowData.parent_path_text,
                    host: rowData.host,
                    filename: rowData.name_text,
                    uifeature: 'file_browser:remove',
                    getConfirmation: true
                });
            },
        },
    ];
    return (
        <React.Fragment>
            <Button
                style={{ }}
                size='small'
                aria-controls={dropdownOpen ? 'split-button-menu' : undefined}
                aria-expanded={dropdownOpen ? 'true' : undefined}
                aria-haspopup='menu'
                onClick={handleDropdownToggle}
                color='primary'
                variant='contained'
                ref={dropdownAnchorRef}>
                Actions
            </Button>
            <Popper
                open={dropdownOpen}
                anchorEl={dropdownAnchorRef.current}
                role={undefined}
                transition
                style={{ zIndex: 4000 }}>
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                        }}>
                        <Paper
                            style={{
                                backgroundColor:
                                    theme.palette.type === 'dark'
                                        ? theme.palette.primary.dark
                                        : theme.palette.primary.light,
                                color: 'white',
                            }}>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id='split-button-menu'>
                                    {optionsA.map((option, index) => (
                                        <MenuItem
                                            key={option.name}
                                            onClick={(event) => handleMenuItemClick('A', event, index)}>
                                            {option.icon}
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                    <Divider />
                                    {optionsB.map((option, index) => (
                                        <MenuItem
                                            key={option.name}
                                            onClick={(event) => handleMenuItemClick('B', event, index)}>
                                            {option.icon}
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
            {fileCommentDialogOpen && (
                <MythicDialog
                    fullWidth={true}
                    maxWidth='md'
                    open={fileCommentDialogOpen}
                    onClose={() => {
                        setFileCommentDialogOpen(false);
                    }}
                    innerDialog={
                        <MythicModifyStringDialog
                            title='Edit File Browser Comment'
                            onSubmit={onSubmitUpdatedComment}
                            value={rowData.comment}
                            onClose={() => {
                                setFileCommentDialogOpen(false);
                            }}
                        />
                    }
                />
            )}
            {viewPermissionsDialogOpen && (
                <MythicDialog
                    fullWidth={true}
                    maxWidth='md'
                    open={viewPermissionsDialogOpen}
                    onClose={() => {
                        setViewPermissionsDialogOpen(false);
                    }}
                    innerDialog={
                        <MythicViewJSONAsTableDialog
                            title='View Permissions Data'
                            leftColumn='Permission'
                            rightColumn='Value'
                            value={permissionData}
                            onClose={() => {
                                setViewPermissionsDialogOpen(false);
                            }}
                        />
                    }
                />
            )}
            {fileHistoryDialogOpen && (
                <MythicDialog
                    fullWidth={true}
                    maxWidth='md'
                    open={fileHistoryDialogOpen}
                    onClose={() => {
                        setFileHistoryDialogOpen(false);
                    }}
                    innerDialog={
                        <DownloadHistoryDialog
                            title='Download History'
                            value={downloadHistory}
                            onClose={() => {
                                setFileHistoryDialogOpen(false);
                            }}
                        />
                    }
                />
            )}
        </React.Fragment>
    );
};
