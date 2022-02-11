import React, { useEffect, useRef } from 'react';
import { EventFeedTableEvents } from './EventFeedTableEvents';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import {useTheme} from '@mui/material/styles';
import { EventFeedTableInput } from './EventFeedTableInput';
import {Button} from '@mui/material';
import {VariableSizeList } from 'react-window';
import Autosizer from 'react-virtualized-auto-sizer';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Grow from '@mui/material/Grow';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import ClickAwayListener from '@mui/material/ClickAwayListener';

const Row = ({data, index, style}) => {
    const op = data[data.length - index - 1];
    return (
        <div style={style}>
            <EventFeedTableEvents
                {...op}
            />
        </div> 
    )
};

const EventList = ({onUpdateDeleted, onUpdateLevel, onUpdateResolution, getSurroundingEvents, operationeventlog}) => {
    const listRef = React.createRef();
    const getItemSize = (index) => {
        const op = operationeventlog[operationeventlog.length - index - 1];
        return 75 + (20 * (op["message"].match(/\n/g) || []).length);
    }
    const eventlogWithFunctions = operationeventlog.map( (oplog) => {
        return {onUpdateDeleted, onUpdateLevel, onUpdateResolution, getSurroundingEvents, ...oplog}
    });
    useEffect( () => {
        if(listRef.current){
            listRef.current.resetAfterIndex(0);
        }
    }, [operationeventlog])
    return (
        <Autosizer>
            {({height, width}) => (
                <VariableSizeList
                    ref={listRef}
                    height={height-50}
                    itemData={eventlogWithFunctions}
                    itemCount={operationeventlog.length}
                    width={width}
                    itemSize={getItemSize}
                    overscanCount={20}
                    >
                        {Row}
                </VariableSizeList>
            )}
        </Autosizer>
    )
};

export function EventFeedTable(props){
    const messagesEndRef = useRef(null);
    const theme = useTheme();
    const dropdownAnchorRef = React.useRef(null);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    
    const onSubmitMessage = (message) => {
        if(message && message.length > 0){
            props.onSubmitMessage({level:"info", message});
            scrollToBottom();
        }
    } 
    const scrollToBottom = () => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
    const dropDownOptions = [
        {
            name: "Load More Events",
            click: props.loadMore
        },
        {
            name: "Load All Errors",
            click: props.loadNextError
        },
        {
            name: "Resolve Viewable Errors",
            click: props.resolveViewableErrors
        },
        {
            name: "Resolve All Errors",
            click: props.resolveAllErrors
        },
    ]
    const handleMenuItemClick = (event, index) => {
        dropDownOptions[index].click();
        setDropdownOpen(false);
    };
    return (
        <React.Fragment>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main,  color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                    Operational Event Messages
                </Typography>
                <ButtonGroup variant="contained" ref={dropdownAnchorRef} aria-label="split button" style={{marginRight: "10px", marginTop:"10px", float: "right"}} color="primary">
                    <Button size="small" color="primary" aria-controls={dropdownOpen ? 'split-button-menu' : undefined}
                        aria-expanded={dropdownOpen ? 'true' : undefined}
                        aria-haspopup="menu"
                        onClick={() => setDropdownOpen(!dropdownOpen)}>
                            Actions <ArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
                <Popper open={dropdownOpen} anchorEl={dropdownAnchorRef.current} role={undefined} transition disablePortal style={{zIndex: 10}}>
                {({ TransitionProps, placement }) => (
                    <Grow
                    {...TransitionProps}
                    style={{
                        transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                    }}
                    >
                    <Paper style={{backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light, color: "white"}}>
                        <ClickAwayListener onClickAway={() => setDropdownOpen(false)}>
                        <MenuList id="split-button-menu">
                            {dropDownOptions.map((option, index) => (
                            <MenuItem
                                key={option.name}
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
            </Paper>
            
            <Paper elevation={5} style={{position: "relative", height: "calc(90vh)", backgroundColor: theme.body}} variant={"elevation"}>
                <EventList 
                    onUpdateResolution={props.onUpdateResolution}
                    onUpdateLevel={props.onUpdateLevel}
                    onUpdateDeleted={props.onUpdateDeleted}
                    getSurroundingEvents={props.getSurroundingEvents}
                    operationeventlog={props.operationeventlog}/>
                <div ref={messagesEndRef} />
                <EventFeedTableInput onSubmitMessage={onSubmitMessage} />
            </Paper>
        </React.Fragment>
    )
}