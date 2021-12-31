import { Box, Typography } from '@material-ui/core';
import { useCallback } from 'react';
import useSingleAndDoubleClick from '../../utilities/useSingleAndDoubleClick';
import useStyles from './styles';
import {useTheme} from '@material-ui/core/styles';

const HeaderCell = ({
    onClick = () => {},
    onDoubleClick = () => {},
    sortIndicatorIndex,
    sortDirection,
    VariableSizeGridProps: { style, rowIndex, columnIndex, data, ...other },
}) => {
    const theme = useTheme();
    const classes = useStyles();


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

    const handleClicks = useSingleAndDoubleClick(handleClick, handleDoubleClick);

    const item = data.items[rowIndex][columnIndex];

    return (
        <div style={style} className={classes.headerCell} onClick={handleClicks}>
            <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
                <Typography className={classes.cellInner} variant='body1'>
                    {item.name}
                </Typography>
                {sortIndicatorIndex === columnIndex && (sortDirection === 'ASC' ? <div>↑</div> : <div>↓</div>)}
            </Box>
        </div>
    );
};

export default HeaderCell;
