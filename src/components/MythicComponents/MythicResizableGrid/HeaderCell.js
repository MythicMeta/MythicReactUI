import { Typography } from '@material-ui/core';
import { useCallback } from 'react';
import useSingleAndDoubleClick from '../../utilities/useSingleAndDoubleClick';
import useStyles from './styles';

const HeaderCell = ({
    onClick = () => {},
    onDoubleClick = () => {},
    VariableSizeGridProps: { style, rowIndex, columnIndex, data, ...other },
}) => {
    console.log(rowIndex, columnIndex);
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

    const item = data[rowIndex][columnIndex];

    return (
        <div style={style} className={classes.headerCell} onClick={handleClicks}>
            <Typography className={classes.cellInner} variant='body1'>
                {item}
            </Typography>
        </div>
    );
};

export default HeaderCell;
