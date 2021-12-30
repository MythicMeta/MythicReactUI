import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Tab from '@material-ui/core/Tab';
import React from 'react';

export function MythicTabPanel(props) {
    const { children, value, index, maxHeight, tabInfo, getCallbackData, queryParams, changeSearchParam, ...other } =
        props;
    const style =
        props.style === undefined
            ? {
                  display: value === index ? 'flex' : 'none',
                  flexDirection: 'column',
                  flexGrow: 1,
                  width: '100%',
                  maxWidth: '100%',
              }
            : props.style;
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`scrollable-auto-tabpanel-${index}`}
            aria-labelledby={`scrollable-auto-tab-${index}`}
            style={style}
            {...other}>
            {<React.Fragment>{children}</React.Fragment>}
        </div>
    );
}
function a11yProps(index) {
    return {
        id: `scrollable-auto-tab-${index}`,
        'aria-controls': `scrollable-auto-tabpanel-${index}`,
    };
}
export function MythicTabLabel(props) {
    const {
        label,
        index,
        fullWidth,
        maxHeight,
        onContextMenu,
        onCloseTab,
        selectionFollowsFocus,
        textColor,
        indicator,
        tabInfo,
        onEditTabDescription,
        getCallbackData,
        ...other
    } = props;
    const onClick = (e) => {
        e.stopPropagation();
        onCloseTab({ tabID: tabInfo.tabID, index: index });
    };
    return (
        <Tab
            label={
                <span onContextMenu={onContextMenu} style={{ display: 'inline-block', zIndex: 1 }}>
                    {label}
                    <IconButton component='div' size='small' onClick={onClick} {...other}>
                        <CloseIcon />
                    </IconButton>
                </span>
            }
            {...a11yProps(index)}
            {...other}
        />
    );
}
export function MythicSearchTabLabel(props) {
    const { label, index, fullWidth, maxHeight, selectionFollowsFocus, textColor, indicator, iconComponent, ...other } =
        props;
    return (
        <Tab
            label={
                <span>
                    {label}
                    <br />
                    {iconComponent}
                </span>
            }
            {...a11yProps(index)}
            {...other}
        />
    );
}
