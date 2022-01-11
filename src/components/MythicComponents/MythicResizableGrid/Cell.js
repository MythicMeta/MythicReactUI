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
    const cellStyle = item?.props?.cellData?.cellStyle || {};
    const rowStyle = data.items[rowIndex][columnIndex]?.props?.rowData?.rowStyle || {};
    return (
        <div style={{...style, ...cellStyle, ...rowStyle}} className={classes.cell} onDoubleClick={handleDoubleClick}>
            <div className={classes.cellInner}>{item}</div>
        </div>
    );
};

export default Cell;
