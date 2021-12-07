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
import {Table, Column, AutoSizer} from 'react-virtualized';
import 'react-virtualized/styles.css';
import Draggable from 'react-draggable';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';

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
const noRowsRender = () => {
    return (
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", left: "50%", top: "50%"}}>No Data Selected</div>
    )
}
const CellRenderer = ({columnData, dataKey, rowData}) => {
    const DisplayData = () => {
        switch(columnData.format){
        case "string":
            return <FileBrowserTableRowStringCell cellData={rowData[dataKey]} rowData={rowData}/>
        case "button":
            return <FileBrowserTableRowActionCell rowData={rowData} onTaskRowAction={columnData.onTaskRowAction} os={columnData.os}/>
        default:
            return <FileBrowserTableRowStringCell cellData={rowData[dataKey]} rowData={rowData} />
        }
    };
    return (
        DisplayData()
    )
}
export const CallbacksTabsProcessBrowserTable = (props) => {
    const widthRef = React.useRef(null);
    const [sortDirection, setSortDirection] = React.useState("ASC");
    const [sortBy, setSortBy] = React.useState("name");
    const [columnWidths, setColumnWidths] = React.useState({
        actions: .065,
        parent_process_id: .0714,
        process_id: .0714,
        architecture: .06,
        name: .14,
        user: .14,
        bin_path: .40,
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
          tmpData.sort( (a, b) => a[sortBy] > b[sortBy] ? 1 : -1);
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
            {columnData.format !== "button" && label !== "Path" && 
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
    const [allData, setAllData] = React.useState([]);
    useEffect( () => {
        setColumns([
            {columnData: {format: "button", onTaskRowAction: props.onTaskRowAction, os: props.os}, dataKey: 'actions', label: "Actions", 
                cellRenderer: CellRenderer, width: columnWidths.actions * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            {columnData: {format: "number"}, dataKey: 'parent_process_id', label: "PPID", 
                cellRenderer: CellRenderer, width: columnWidths.parent_process_id * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            {columnData: {format: "number"}, dataKey: 'process_id', label: "PID", 
                cellRenderer: CellRenderer,  width: columnWidths.process_id * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            {columnData: {format: "string"}, dataKey: 'architecture',  label: "Arch", 
                cellRenderer: CellRenderer, width: columnWidths.architecture * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            {columnData: {format: "string"}, dataKey: 'name',  label: "Name", 
                cellRenderer: CellRenderer, width: columnWidths.name * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            
            {columnData: {format: "string"}, dataKey: 'user',  label: "User", 
                cellRenderer: CellRenderer, width: columnWidths.user * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
            {columnData: {format: "string"}, dataKey: 'bin_path',  label: "Path", 
                cellRenderer: CellRenderer, width: columnWidths.bin_path * widthRef.current.offsetWidth, headerRenderer: headerRenderer},
        ])
    }, [columnWidths, props.onTaskRowAction, props.os]);
    useEffect( () => {
        setAllData(props.selectedFolder);
    }, [props.selectedFolder]);

    return (
        <div ref={widthRef} style={{width: "100%", height: "90%", overflow: "hidden"}}>
            <AutoSizer>
                {({height, width}) => (
                    <Table
                        headerHeight={25}
                        noRowsRenderer={noRowsRender}
                        rowCount={allData.length}
                        rowGetter={ rowGetter }
                        rowHeight={35}
                        height={height}
                        width={width}
                        sort={sortTable}
                        sortBy={sortBy}
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

const FileBrowserTableRowStringCell = ({cellData}) => {
    return (
        cellData
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
                            path: rowData.parent_path_text,
                            host: rowData.host,
                            filename: rowData.name_text,
                            uifeature: "process_browser:list_tokens"
                        });
                    }, os: ["Windows"]},
                    {name: 'Task Inject', icon: <GetAppIcon style={{paddingRight: "5px", color: theme.palette.success.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        onTaskRowAction({
                            path: rowData.parent_path_text,
                            host: rowData.host,
                            filename: rowData.name_text,
                            uifeature: "process_browser:inject"
                        });
                    }},
                    {name: 'Task Steal Token', icon: <DeleteIcon style={{paddingRight: "5px", color: theme.palette.error.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        onTaskRowAction({
                            path: rowData.parent_path_text,
                            host: rowData.host,
                            filename: rowData.name_text,
                            uifeature: "process_browser:steal_token"
                        });
                        
                    }, os: ["Windows"]},
                    {name: 'Task Kill Process', icon: <DeleteIcon style={{paddingRight: "5px", color: theme.palette.error.main}}/>, click: (evt) => {
                        evt.stopPropagation();
                        onTaskRowAction({
                            path: rowData.parent_path_text,
                            host: rowData.host,
                            filename: rowData.name_text,
                            uifeature: "process_browser:kill"
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
