import { Box, Typography } from '@material-ui/core';
import { useCallback } from 'react';
import useSingleAndDoubleClick from '../../utilities/useSingleAndDoubleClick';
import useStyles from './styles';
import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFilter} from '@fortawesome/free-solid-svg-icons';
import Grow from '@material-ui/core/Grow';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Paper from '@material-ui/core/Paper';
import {useTheme} from '@material-ui/core/styles';

const HeaderCell = ({
    onClick = () => {},
    onDoubleClick = () => {},
    contextMenuOptions = [],
    sortIndicatorIndex,
    sortDirection,
    headerNameKey = "name",
    VariableSizeGridProps: { style, rowIndex, columnIndex, data, ...other },
}) => {
    const classes = useStyles();
    const dropdownAnchorRef = React.useRef(null);
    const theme = useTheme();
    const item = data.items[rowIndex][columnIndex];
    const isFiltered = item?.filtered || false;
    const handleClick = useCallback(
        (e) => {
            onClick(e, columnIndex);
        },
        [onClick, columnIndex]
    );

    const handleDoubleClick = useCallback(
        (e) => {
            onDoubleClick(e, columnIndex);
        },
        [onDoubleClick, columnIndex]
    );
    const [openContextMenu, setOpenContextMenu] = React.useState(false);
    const handleContextClick = useCallback(
        (event) => {
            event.preventDefault();
            if(item.disableFilterMenu){
                return;
            }
            if(contextMenuOptions && contextMenuOptions.length > 0){
                
                setOpenContextMenu(true);
            }
        },
        [contextMenuOptions, columnIndex] // eslint-disable-line react-hooks/exhaustive-deps
    );
    const handleMenuItemClick = (event, index) => {
        contextMenuOptions[index].click({event, columnIndex});
        setOpenContextMenu(false);
    };
    const handleClose = (event) => {
        if (dropdownAnchorRef.current && dropdownAnchorRef.current.contains(event.target)) {
          return;
        }
        setOpenContextMenu(false);
      };
    const handleClicks = useSingleAndDoubleClick(handleClick, handleDoubleClick);

    

    return (
        <div style={style} className={classes.headerCell} onClick={handleClicks} onContextMenu={handleContextClick} ref={dropdownAnchorRef}>
            <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
                <Typography className={classes.cellInner} variant='body1'>
                    {item[headerNameKey].toUpperCase()}
                </Typography>
                {isFiltered ? (
                    <FontAwesomeIcon icon={faFilter} />
                ) : (null)}
                {sortIndicatorIndex === columnIndex && (sortDirection === 'ASC' ? <div>↑</div> : <div>↓</div>)}
                <Popper open={openContextMenu} anchorEl={dropdownAnchorRef.current} role={undefined} transition disablePortal style={{zIndex: 4}}>
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
                            {contextMenuOptions.map((option, index) => (
                              <MenuItem
                                key={option.name + index}
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
            </Box>
        </div>
    );
};

export default HeaderCell;
