import { useCallback } from 'react';
import useStyles from './styles';

const Cell = ({ VariableSizeGridProps: { style, rowIndex, columnIndex, data } }) => {
    const classes = useStyles();

    const handleDoubleClick = useCallback(
        (e) => {
            data.onDoubleClickRow(e, rowIndex - 1); // minus 1 to account for header row
        },
        [data, rowIndex]
    );

    const item = data.items[rowIndex][columnIndex];

    return (
        <div
            style={style}
            className={`${classes.cell} ${rowIndex === 3 ? classes.highlightRow : ''}`}
            onDoubleClick={handleDoubleClick}>
            <div className={classes.cellInner}>{item}</div>
        </div>
    );
};

export default Cell;
