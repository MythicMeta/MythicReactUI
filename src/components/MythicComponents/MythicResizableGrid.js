import { makeStyles } from '@material-ui/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import AutoSizer from 'react-virtualized-auto-sizer';
import useScrollbarSize from 'react-scrollbar-size';
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
        borderTop: '1px solid #e0e0e0',
        borderRight: '1px solid #e0e0e0',
        borderBottom: '1px solid #e0e0e0',
        '&:first-child': {
            borderLeft: '1px solid #e0e0e0',
        },
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
        borderBottom: '1px solid #e0e0e0',
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

const MIN_COLUMN_WIDTH = 100;

const Cell = ({ VariableSizeGridProps: { style, rowIndex, columnIndex, data, ...other } }) => {
    const classes = useStyles();

    const item = data[rowIndex][columnIndex];

    return (
        <div style={style} className={classes.cell}>
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
        </div>
    );
};

const CellRenderer = (VariableSizeGridProps) => {
    return VariableSizeGridProps.rowIndex === 0 ? null : <Cell VariableSizeGridProps={VariableSizeGridProps} />;
};

const ResizableGridWrapper = ({ columns, items, ...AutoSizerProps }) => {
    /* Hooks */
    const { width: scrollbarWidth } = useScrollbarSize();

    const [columnWidths, setColumnWidths] = useState(columns.map((column) => MIN_COLUMN_WIDTH));

    const [isDragging, setIsDragging] = useState(false);

    const gridRef = useRef(null);

    const dragHandlesRef = useRef(null);

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
        const totalWidth = AutoSizerProps.width - scrollbarWidth;
        const updatedColumnWidths = columns.map((column) => column.initialWidth || MIN_COLUMN_WIDTH);
        const totalWidthDiff = totalWidth - updatedColumnWidths.reduce((a, b) => a + b, 0);
        if (totalWidthDiff > 0) {
            updatedColumnWidths[updatedColumnWidths.length - 1] += totalWidthDiff;
        }
        setColumnWidths(updatedColumnWidths);
    }, [AutoSizerProps.width, scrollbarWidth, columns]);

    useEffect(() => {
        gridRef.current.resetAfterColumnIndex(0, true);
    }, [columnWidths]);

    /* Event Handlers */

    const resizeColumn = (x, columnIndex) => {
        const updatedWidths = columnWidths.map((columnWidth, index) => {
            if (columnIndex === index) {
                return Math.floor(Math.max(columnWidth + x, MIN_COLUMN_WIDTH));
            }
            return Math.floor(columnWidth);
        });
        setColumnWidths(updatedWidths);
    };

    const autosizeColumn = (columnIndex) => {
        const longestElementInColumn = Math.max(...items.map((itemRow) => itemRow[columnIndex].length));
        const updatedWidths = columnWidths.map((columnWidth, index) => {
            if (columnIndex === index) {
                return Math.floor(Math.max(longestElementInColumn * 8 + 32, MIN_COLUMN_WIDTH));
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
                onScroll={({ scrollLeft }) => {
                    if (dragHandlesRef.current) {
                        dragHandlesRef.current.scrollTo({ left: scrollLeft });
                    }
                }}
                ref={gridRef}>
                {CellRenderer}
            </VariableSizeGrid>
            <div
                ref={dragHandlesRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    height: AutoSizerProps.height,
                    width: AutoSizerProps.width,
                    pointerEvents: isDragging ? 'initial' : 'none',
                }}>
                {columns.map((_, i) => {
                    const leftOffset = columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                    return (
                        <Draggable
                            key={i}
                            axis='x'
                            bounds={{
                                left: MIN_COLUMN_WIDTH - columnWidths[i],
                                right: Number.POSITIVE_INFINITY,
                                top: 0,
                                bottom: 0,
                            }}
                            position={isDragging ? null : { x: 0, y: 0 }}
                            onStart={() => {
                                setIsDragging(i);
                            }}
                            onStop={(e, data) => {
                                setIsDragging(false);
                                resizeColumn(data.x, i);
                            }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: leftOffset + columnWidths[i] - 1 - 8,
                                    height: getRowHeight(0),
                                    width: '16px',
                                    zIndex: 3,
                                    cursor: 'col-resize',
                                    pointerEvents: 'initial',
                                    overflowY: 'visible',
                                }}>
                                <div
                                    style={{
                                        display: isDragging === i ? 'block' : 'none',
                                        position: 'absolute',
                                        top: 0,
                                        left: 8,
                                        height: AutoSizerProps.height / 2,
                                        width: '1px',
                                        backgroundImage: 'linear-gradient(#7f93c0, #00000000)',
                                        zIndex: 3,
                                    }}
                                />
                            </div>
                        </Draggable>
                    );
                })}
            </div>
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
