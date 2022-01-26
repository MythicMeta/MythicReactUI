import React, {useEffect} from 'react';
import {useLazyQuery, gql } from '@apollo/client';
import { MythicDialog, MythicViewObjectPropertiesAsTableDialog } from '../../MythicComponents/MythicDialog';
import Paper from '@material-ui/core/Paper';
import {useTheme} from '@material-ui/core/styles';
import {Button} from '@material-ui/core';
import Grow from '@material-ui/core/Grow';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import VisibilityIcon from '@material-ui/icons/Visibility';
import Divider from '@material-ui/core/Divider';
import ListIcon from '@material-ui/icons/List';
import DeleteIcon from '@material-ui/icons/Delete';
import GetAppIcon from '@material-ui/icons/GetApp';
import { snackActions } from '../../utilities/Snackbar';
import 'react-virtualized/styles.css';
import MythicResizableGrid from '../../MythicComponents/MythicResizableGrid';
import {TableFilterDialog} from './TableFilterDialog';
import {MythicTransferListDialog} from '../../MythicComponents/MythicTransferList';


const getDetailedData = gql`
query getDetailed($process_id: Int!){
    process_by_pk(id: $process_id){
        id
        command_line
        description
        signer
        start_time
        name
        bin_path
    }
}
`;
const getProcessTokenData = gql`
query getDetailed($process_id: Int!){
    process_by_pk(id: $process_id){
        id
        tokens(where: {deleted: {_eq: false}}) {
            Address
            AppContainer
            AppContainerNumber
            AppContainerSid
            AppId
            AppModelPolicies
            AppModelPolicyDictionary
            AttributesFlags
            AuditPolicy
            AuthenticationId_id
            BnoIsolationPrefix
            CanSynchronize
            Capabilities
            CreationTime
            DefaultDacl
            DenyOnlyGroups
            DeviceClaimAttributes
            DeviceGroups
            Elevated
            ElevationType
            EnabledGroups
            ExpirationTime
            Filtered
            Flags
            FullPath
            GrantedAccess
            GrantedAccessGeneric
            GrantedAccessMask
            GroupCount
            Groups
            Handle
            HandleReferenceCount
            HasRestrictions
            ImpersonationLevel
            Inherit
            IntegrityLevel
            IntegrityLevelSid
            IsClosed
            IsContainer
            IsPseudoToken
            IsRestricted
            IsSandbox
            LogonSid
            LowPrivilegeAppContainer
            MandatoryPolicy
            ModifiedId
            Name
            NoChildProcess
            NotLow
            NtType
            NtTypeName
            Owner
            Origin
            PackageFullName
            PackageIdentity
            PackageName
            PointerReferenceCount
            PrimaryGroup
            PrivateNamespace
            Privileges
            ProcessUniqueAttribute
            ProtectFromClose
            Restricted
            RestrictedDeviceClaimAttributes
            RestrictedDeviceGroups
            RestrictedSids
            RestrictedSidsCount
            RestrictedUserClaimAttributes
            SandboxInert
            Sddl
            SecurityAttributes
            SecurityDescriptor
            SessionId
            Source
            ThreadID
            TokenId
            TokenType
            TrustLevel
            UIAccess
            User
            UserClaimAttributes
            VirtualizationAllowed
            VirtualizationEnabled
            WriteRestricted
            callbacktokens {
                callback_id
            }
            logonsession {
                id
            }
            task_id
            timestamp_created
        }
    }
}
`;


export const CallbacksTabsProcessBrowserTable = (props) => {
    const [allData, setAllData] = React.useState([]);
    const [sortData, setSortData] = React.useState({"sortKey": null, "sortDirection": null, "sortType": null});
    const [openContextMenu, setOpenContextMenu] = React.useState(false);
    const [filterOptions, setFilterOptions] = React.useState({});
    const [selectedColumn, setSelectedColumn] = React.useState({});
    const [columnVisibility, setColumnVisibility] = React.useState({
        "visible": ["Actions", "PPID", "PID", "Arch", "Name", "User"],
        "hidden": ["Path"]
    })
    const [openAdjustColumnsDialog, setOpenAdjustColumnsDialog] = React.useState(false);
    const columns = React.useMemo(
        () => 
            [
                { name: 'Actions', width: 100, disableAutosize: true, disableSort: true, disableFilterMenu: true },
                { name: 'PPID', type: 'number', key: 'parent_process_id', width:75 },
                { name: 'PID',  type: 'number', key: 'process_id', width: 75},
                { name: 'Arch', type: 'string', key: 'architecture', width: 75 },
                { name: 'Name', type: 'string', key: 'name', fillWidth: true },
                { name: 'User', type: 'string', key: 'user', fillWidth: true},
                { name: 'Path', type: 'string', key: 'bin_path', width: 200}
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
    useEffect( () => {
        setAllData([...props.selectedFolder]);
    }, [props.selectedFolder]);
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
                                return <FileBrowserTableRowActionCell rowData={row} onTaskRowAction={props.onTaskRowAction} />;
                            case "PPID":
                                return <FileBrowserTableRowStringCell rowData={row} cellData={row.parent_process_id} />;
                            case "PID":
                                return <FileBrowserTableRowStringCell rowData={row} cellData={row.process_id} />;
                            case "Arch":
                                return <FileBrowserTableRowStringCell rowData={row} cellData={row.architecture} />;
                            case "Name":
                                return <FileBrowserTableRowStringCell rowData={row} cellData={row.name} />;
                            case "User":
                                return <FileBrowserTableRowStringCell rowData={row} cellData={row.user} />;
                            case "Path":
                                return <FileBrowserTableRowStringCell rowData={row} cellData={row.bin_path} />;
                        }
                    })];
                }
            }, []),
        [sortedData, props.onTaskRowAction, filterOptions, columnVisibility]
    );
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
    const onRowDoubleClick = React.useCallback( () => {

    }, []);
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
        <div style={{ width: '100%', height: '100%', overflow: "hidden" }}>
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
    )
}

const FileBrowserTableRowStringCell = ({cellData}) => {
    return (
        <div>{cellData}</div>
    )
}

const FileBrowserTableRowActionCell = ({rowData, onTaskRowAction, os}) => {
    const dropdownAnchorRef = React.useRef(null);
    const theme = useTheme();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [viewPermissionsDialogOpen, setViewPermissionsDialogOpen] = React.useState(false);
    const [viewTokensDialogOpen, setViewTokensDialogOpen] = React.useState(false);
    const [permissionData, setPermissionData] = React.useState({});
    const [tokenData, setTokenData] = React.useState({});
    const [getPermissions] = useLazyQuery(getDetailedData, {
        onCompleted: (data) => {
            setPermissionData(data.process_by_pk);
            setViewPermissionsDialogOpen(true);
        },
        fetchPolicy: "network-only"
    });
    const [getTokens] = useLazyQuery(getProcessTokenData, {
        onCompleted: (data) => {
            if(data.process_by_pk.tokens.length === 0){
                snackActions.warning("No Token Data for Process");
            }else{
                setTokenData(data.process_by_pk.tokens);
                setViewPermissionsDialogOpen(true);
            }
        },
        fetchPolicy: "network-only"
    });
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
    const optionsA = [{name: 'View Detailed Data', icon: <VisibilityIcon style={{paddingRight: "5px"}}/>, click: (evt) => {
                        evt.stopPropagation();
                        getPermissions({variables: {process_id: rowData.id}});
                    }},
                    {name: 'View Tokens', icon: <VisibilityIcon style={{paddingRight: "5px"}}/>, click: (evt) => {
                        evt.stopPropagation();
                        getTokens({variables: {process_id: rowData.id}});
                    }, os: ["Windows"]},
    ];
    const optionsB = [{name: 'Task Token Listing', icon: <ListIcon style={{paddingRight: "5px", color: theme.palette.warning.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        onTaskRowAction({
                            process_id: rowData.process_id,
                            architecture: rowData.architecture,
                            uifeature: "process_browser:list_tokens"
                        });
                    }, os: ["Windows"]},
                    {name: 'Task Inject', icon: <GetAppIcon style={{paddingRight: "5px", color: theme.palette.success.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        console.log(rowData);
                        onTaskRowAction({
                            process_id: rowData.process_id,
                            architecture: rowData.architecture,
                            uifeature: "process_browser:inject"
                        });
                    }},
                    {name: 'Task Steal Token', icon: <DeleteIcon style={{paddingRight: "5px", color: theme.palette.error.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        onTaskRowAction({
                            process_id: rowData.process_id,
                            architecture: rowData.architecture,
                            uifeature: "process_browser:steal_token"
                        });
                        
                    }, os: ["Windows"]},
                    {name: 'Task Kill Process', icon: <DeleteIcon style={{paddingRight: "5px", color: theme.palette.error.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        onTaskRowAction({
                            process_id: rowData.process_id,
                            architecture: rowData.architecture,
                            uifeature: "process_browser:kill"
                        });
                        
                    }},
    ];
    return (
        <React.Fragment>
            <Button
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
            <Popper open={dropdownOpen} anchorEl={dropdownAnchorRef.current} role={undefined} transition style={{zIndex: 4}}>
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
                            option.os === undefined || option.os.includes(os) ? (
                                <MenuItem
                                    key={option.name}
                                    onClick={(event) => handleMenuItemClick("A", event, index)}
                                >
                                    {option.icon}{option.name}
                                </MenuItem>
                            ) : (null)
                        ))}
                        <Divider />
                        {optionsB.map((option, index) => (
                            option.os === undefined || option.os.includes(os) ? (
                                <MenuItem
                                    key={option.name}
                                    onClick={(event) => handleMenuItemClick("B", event, index)}
                                >
                                    {option.icon}{option.name}
                                </MenuItem>
                            ) : (null)
                        ))}
                    </MenuList>
                    </ClickAwayListener>
                </Paper>
                </Grow>
            )}
            </Popper>
            <MythicDialog fullWidth={true} maxWidth="md" open={viewPermissionsDialogOpen} 
                    onClose={()=>{setViewPermissionsDialogOpen(false);}} 
                    innerDialog={<MythicViewObjectPropertiesAsTableDialog title="View Detailed Data" leftColumn="Attribute" 
                        rightColumn="Value" value={permissionData} 
                        onClose={()=>{setViewPermissionsDialogOpen(false);}} 
                        keys={["name", "bin_path", "signer", "command_line", "start_time", "description"]}
                        />}
                />
        </React.Fragment>
    )
}
