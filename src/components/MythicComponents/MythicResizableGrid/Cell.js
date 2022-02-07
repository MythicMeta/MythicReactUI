import React, { useCallback } from 'react';
import useStyles from './styles';

const CellPreMemo = ({ VariableSizeGridProps: { style, rowIndex, columnIndex, data } }) => {
    const rowClassName = data.gridUUID + "row" + rowIndex;
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
    const onMouseEnter = () => {
        const cells = document.getElementsByClassName(rowClassName);
        if(cells.length > 0){
            for(const cell of cells){
                cell.classList.add(classes.hoveredRow);
            }
        }
    }
    const onMouseLeave = () => {
        const cells = document.getElementsByClassName(rowClassName);
        if(cells.length > 0){
            for(const cell of cells){
                cell.classList.remove(classes.hoveredRow);
            }
        }
    }
    return (
        <div style={{...style, ...cellStyle, ...rowStyle}} 
            className={`${classes.cell} ${rowClassName}`} 
            onDoubleClick={handleDoubleClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}>
            <div className={classes.cellInner}>{item}</div>
        </div>
    );
};
const Cell = React.memo(CellPreMemo);
export default Cell;

