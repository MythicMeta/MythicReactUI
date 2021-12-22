import React, { useCallback, useEffect, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import useScrollbarSize from 'react-scrollbar-size';
import { VariableSizeGrid } from 'react-window';
import HeaderCell from './HeaderCell';
import Cell from './Cell';
import DraggableHandles from './DraggableHandles';
import useStyles from './styles';

const MIN_COLUMN_WIDTH = 100;

const CellRenderer = (VariableSizeGridProps) => {
    return VariableSizeGridProps.rowIndex === 0 ? null : <Cell VariableSizeGridProps={VariableSizeGridProps} />;
};

const ResizableGridWrapper = ({ columns, items, onClick, rowHeight, ...AutoSizerProps }) => {
    /* Hooks */
    const { width: scrollbarWidth } = useScrollbarSize();

    const [columnWidths, setColumnWidths] = useState(columns.map((column) => column.initialWidth || MIN_COLUMN_WIDTH));

    const gridRef = useRef(null);

    const dragHandlesRef = useRef(null);

    const getColumnWidth = useCallback(
        (index) => {
            return columnWidths[index];
        },
        [columnWidths]
    );

    const getRowHeight = useCallback(
        (index) => {
            return rowHeight;
        },
        [rowHeight]
    );

    useEffect(() => {
        const totalWidth = AutoSizerProps.width - scrollbarWidth;
        const updatedColumnWidths = columns.map((column) => column.initialWidth || MIN_COLUMN_WIDTH);
        const totalWidthDiff = totalWidth - updatedColumnWidths.reduce((a, b) => a + b, 0);
        if (totalWidthDiff > 0) {
            updatedColumnWidths[updatedColumnWidths.length - 1] += totalWidthDiff;
        }
        setColumnWidths(updatedColumnWidths);
    }, [scrollbarWidth]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const itemsWithHeader = [columns.map((column) => column.name), ...items];

    const innerElementType = React.forwardRef(({ children, ...rest }, ref) => {
        const classes = useStyles();
        return (
            <div ref={ref} {...rest}>
                {/* always render header cells */}
                <div
                    className={classes.headerCellRow}
                    style={{
                        height: getRowHeight(0),
                    }}>
                    {columns.map((column, i) => {
                        const leftOffset = columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
                        return (
                            <HeaderCell
                                key={i}
                                onClick={onClick}
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
                                    data: itemsWithHeader,
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
                rowCount={itemsWithHeader.length}
                rowHeight={getRowHeight}
                itemData={itemsWithHeader}
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
            <DraggableHandles
                height={AutoSizerProps.height}
                rowHeight={getRowHeight(0)}
                width={AutoSizerProps.width}
                minColumnWidth={MIN_COLUMN_WIDTH}
                columnWidths={columnWidths}
                onStop={resizeColumn}
                ref={dragHandlesRef}
            />
        </>
    );
};

const MythicResizableGrid = ({ columns, items, onClick, rowHeight = 32 }) => {
    return (
        <AutoSizer>
            {(AutoSizerProps) => (
                <ResizableGridWrapper
                    columns={columns}
                    items={items}
                    rowHeight={rowHeight}
                    onClick={onClick}
                    {...AutoSizerProps}
                />
            )}
        </AutoSizer>
    );
};

export default MythicResizableGrid;
