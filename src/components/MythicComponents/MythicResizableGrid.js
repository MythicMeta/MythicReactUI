import { makeStyles } from '@material-ui/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeGrid } from 'react-window';

const useStyles = makeStyles((theme) => ({
    headerCell: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 0.25em',
        boxSizing: 'border-box',
        justifyContent: 'space-between',
        userSelect: 'none',
        backgroundColor: '#fff',
        borderBottom: '2px solid #000',
        '&:hover': {
            backgroundColor: '#eee',
            cursor: 'pointer',
        },
    },
    cell: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 0.25em',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
        borderBottom: '1px solid #333',
    },
    cellInner: {
        width: '100%',
        whiteSpace: 'nowrap',
        overflowX: 'hidden',
        textOverflow: 'ellipsis',
    },
    dragHandle: {
        cursor: 'col-resize',
        width: '32px',
        textAlign: 'center',
        flexShrink: 0,
    },
    dragIndicator: {
        position: 'absolute',
        top: 0,
        borderRight: '2px solid #7f93c0',
        width: 0,
    },
}));

const Cell = ({ VariableSizeGridProps: { style, rowIndex, columnIndex, data, ...other } }) => {
    const classes = useStyles();

    const item = data[rowIndex][columnIndex];

    return (
        <div style={{ ...style, backgroundColor: rowIndex % 2 === 0 ? '#ddd' : '#eee' }} className={classes.cell}>
            <div className={classes.cellInner}>{item}</div>
        </div>
    );
};

const HeaderCell = ({
    onClick = () => {},
    onDoubleClick = () => {},
    VariableSizeGridProps: { style, rowIndex, columnIndex, data, ...other },
}) => {
    const classes = useStyles();

    const handleClick = (e) => {
        onClick(e, columnIndex);
    };

    const handleDoubleClick = (e) => {
        onDoubleClick(e, columnIndex);
    };

    const item = data[rowIndex][columnIndex];

    return (
        <div style={style} className={classes.headerCell} onClick={handleClick} onDoubleClick={handleDoubleClick}>
            <div className={classes.cellInner}>{item}</div>
            {/* <Draggable axis='x' position={{ x: 0 }} nodeRef={draggableRef} onStop={handleDragStop}>
                <div className={classes.dragHandle} ref={draggableRef}>
                    ⋮
                </div>
            </Draggable> */}
        </div>
    );
};

const CellRenderer = (VariableSizeGridProps) => {
    return VariableSizeGridProps.rowIndex === 0 ? null : <Cell VariableSizeGridProps={VariableSizeGridProps} />;
};

const ResizableGridWrapper = ({ columns, items, ...AutoSizerProps }) => {
    /* Hooks */
    const [columnWidths, setColumnWidths] = useState(Array(columns.length).fill(100));

    const gridRef = useRef(null);

    const getColumnWidth = useCallback(
        (index) => {
            return columnWidths[index];
        },
        [columnWidths]
    );

    const getRowHeight = useCallback((index) => {
        return 32;
    }, []);

    useEffect(() => {
        gridRef.current.resetAfterColumnIndex(0, true);
    }, [columnWidths]);

    /* Event Handlers */

    // const resizeColumn = (x, columnIndex) => {
    //     const updatedWidths = columnWidths.map((columnWidth, index) => {
    //         if (columnIndex === index) {
    //             return Math.floor(Math.max(columnWidth + x, 50));
    //         }
    //         return Math.floor(columnWidth);
    //     });
    //     setColumnWidths(updatedWidths);
    // };

    const autosizeColumn = (columnIndex) => {
        const longestElementInColumn = Math.max(...items.map((itemRow) => itemRow[columnIndex].length));
        const updatedWidths = columnWidths.map((columnWidth, index) => {
            if (columnIndex === index) {
                return Math.floor(Math.max(longestElementInColumn * 8 + 32, 50));
            }
            return Math.floor(columnWidth);
        });
        setColumnWidths(updatedWidths);
    };

    const innerElementType = React.forwardRef(({ children, ...rest }, ref) => {
        return (
            <div ref={ref} {...rest}>
                {/* always render header cells */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        position: 'sticky',
                        top: '0',
                        left: '0',
                        right: '0',
                        height: getRowHeight(0),
                        zIndex: 2,
                    }}>
                    {columns.map((column, i) => {
                        const leftOffset = columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                        return (
                            <HeaderCell
                                key={i}
                                onClick={() => {}}
                                onDoubleClick={(e, columnIndex) => {
                                    if (column.disableAutosize) return;
                                    autosizeColumn(columnIndex);
                                }}
                                VariableSizeGridProps={{
                                    style: {
                                        position: 'absolute',
                                        top: 0,
                                        left: leftOffset,
                                        height: getRowHeight(0),
                                        width: getColumnWidth(i),
                                    },
                                    rowIndex: 0,
                                    columnIndex: i,
                                    data: items,
                                }}
                            />
                        );
                    })}
                </div>
                {/* render other cells as usual */}
                {children}
            </div>
        );
    });

    return (
        <>
            <VariableSizeGrid
                height={AutoSizerProps.height}
                width={AutoSizerProps.width}
                columnCount={columns.length}
                columnWidth={getColumnWidth}
                rowCount={items.length}
                rowHeight={getRowHeight}
                itemData={items}
                innerElementType={innerElementType}
                overscanRowCount={20}
                ref={gridRef}>
                {CellRenderer}
            </VariableSizeGrid>
        </>
    );
};

const MythicResizableGrid = ({ columns, items }) => {
    const itemsWithHeader = [columns.map((column) => column.name), ...items];
    return (
        <AutoSizer>
            {(AutoSizerProps) => <ResizableGridWrapper columns={columns} items={itemsWithHeader} {...AutoSizerProps} />}
        </AutoSizer>
    );
};

export default MythicResizableGrid;
