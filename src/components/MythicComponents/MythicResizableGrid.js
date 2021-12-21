import { makeStyles } from '@material-ui/core';
import React, { useCallback, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import useScrollbarSize from 'react-scrollbar-size';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeGrid } from 'react-window';

const useStyles = makeStyles((theme) => ({
    headerRow: {
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    headerCell: {
        flexGrow: 0,
        flexShrink: 0,
        minWidth: '50px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0.25em',
        boxSizing: 'border-box',
        userSelect: 'none',
    },
    cell: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 0.25em',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
    },
    cellInner: {
        width: '100%',
        whiteSpace: 'nowrap',
        overflowX: 'hidden',
        textOverflow: 'ellipsis',
    },
}));

const Cell = ({ style, rowIndex, columnIndex, data, ...OtherVariableSizeGridProps }) => {
    const classes = useStyles();

    const item = data[rowIndex][columnIndex];

    return (
        <div style={{ ...style, backgroundColor: rowIndex % 2 === 0 ? '#ddd' : '#eee' }} className={classes.cell}>
            <div className={classes.cellInner}>{item}</div>
        </div>
    );
};

const HeaderRow = React.forwardRef(
    ({ width, scrollbarWidth, columns, getColumnWidth, onResizeColumn, onDoubleClick }, ref) => {
        const classes = useStyles();

        const handleDrag = (e, data, columnIndex) => {
            onResizeColumn(e, data, columnIndex);
        };

        return (
            <div
                style={{
                    height: '24px',
                    width: width - scrollbarWidth,
                }}
                className={classes.headerRow}
                ref={ref}>
                {columns.map((column, i) => (
                    <div
                        key={i}
                        className={classes.headerCell}
                        style={{
                            flexBasis: getColumnWidth(i),
                        }}
                        onDoubleClick={(e) => onDoubleClick(e, i)}>
                        <div className={classes.cellInner}>{column.name}</div>
                        <Draggable
                            axis='x'
                            handle='.handle'
                            position={{ x: 0 }}
                            onDrag={(e, data) => handleDrag(e, data, i)}>
                            <div>
                                <div
                                    className='handle'
                                    style={{
                                        cursor: 'col-resize',
                                    }}>
                                    &nbsp;⋮&nbsp;
                                </div>
                            </div>
                        </Draggable>
                    </div>
                ))}
            </div>
        );
    }
);

const ResizableGridWrapper = ({ columns, items, ...AutoSizerProps }) => {
    /* Hooks */
    const [columnWidths, setColumnWidths] = useState(Array(columns.length).fill(100));

    const { width: scrollbarWidth } = useScrollbarSize();

    const gridRef = useRef(null);

    const headerRef = useRef(null);

    const getColumnWidth = useCallback(
        (index) => {
            return columnWidths[index];
        },
        [columnWidths]
    );

    /* Event Handlers */
    const onResizeColumn = (e, data, columnIndex) => {
        const updatedWidths = columnWidths.map((columnWidth, index) => {
            if (columnIndex === index) {
                return Math.floor(Math.max(columnWidth + data.deltaX, 50));
            }
            return Math.floor(columnWidth);
        });
        setColumnWidths(updatedWidths);
        gridRef.current.resetAfterColumnIndex(0, false);
    };

    const onDoubleClick = (e, columnIndex) => {
        const longestElementInColumn = Math.max(...items.map((itemRow) => itemRow[columnIndex].length));
        const updatedWidths = columnWidths.map((columnWidth, index) => {
            if (columnIndex === index) {
                return Math.floor(Math.max(longestElementInColumn * 8 + 32, 50));
            }
            return Math.floor(columnWidth);
        });
        setColumnWidths(updatedWidths);
        gridRef.current.resetAfterColumnIndex(0, false);
    };

    const handleOnScroll = ({ scrollLeft }) => {
        if (headerRef.current) headerRef.current.scrollLeft = scrollLeft;
    };

    return (
        <>
            <HeaderRow
                {...AutoSizerProps}
                columns={columns}
                getColumnWidth={getColumnWidth}
                onResizeColumn={onResizeColumn}
                onDoubleClick={onDoubleClick}
                scrollbarWidth={scrollbarWidth}
                ref={headerRef}
            />
            <VariableSizeGrid
                height={AutoSizerProps.height - 24}
                width={AutoSizerProps.width}
                columnCount={columns.length}
                columnWidth={getColumnWidth}
                rowCount={items.length}
                rowHeight={(index) => 24}
                itemData={items}
                ref={gridRef}
                onScroll={handleOnScroll}>
                {(VariableSizeGridProps) => <Cell onResizeColumn={onResizeColumn} {...VariableSizeGridProps} />}
            </VariableSizeGrid>
        </>
    );
};

const MythicResizableGrid = ({ columns, items }) => {
    return (
        <AutoSizer>
            {(AutoSizerProps) => <ResizableGridWrapper columns={columns} items={items} {...AutoSizerProps} />}
        </AutoSizer>
    );
};

export default MythicResizableGrid;
