import { makeStyles } from '@material-ui/core';
import { useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

const useStyles = makeStyles((theme) => ({
    rowContainer: {},
    row: {
        display: 'flex',
        alignItems: 'center',
        marginLeft: (props) => theme.spacing(3 * props.item.depth),
        userSelect: 'none',
        whiteSpace: 'nowrap',
    },
    rowButtonWrapper: {
        width: theme.spacing(3),
        textAlign: 'center',
        '&:hover': {
            cursor: 'pointer',
            textDecoration: 'underline',
        },
    },
    rowButton: {
        width: theme.spacing(3),
    },
    rowLabel: {
        marginLeft: theme.spacing(0.5),
    },
}));

const VirtualTreeRow = ({ onSelectNode, onExpandNode, onCollapseNode, ...ListProps }) => {
    const classes = useStyles({
        item: ListProps.data[ListProps.index],
    });

    const item = ListProps.data[ListProps.index];

    const handleOnClickButton = (e) => {
        e.stopPropagation();
        if (item.isOpen) {
            onCollapseNode(item.id, item);
        } else {
            console.log(item.id, item);
            onExpandNode(item.id, item);
        }
    };

    const handleOnClickRow = (e) => {
        onSelectNode(item.id, item);
    };

    return (
        <div className={classes.rowContainer} style={ListProps.style}>
            <div className={classes.row} onClick={handleOnClickRow}>
                <div className={classes.rowButtonWrapper}>
                    {/* {!item.isLeaf && ( */}
                    <button className={classes.rowButton} onClick={handleOnClickButton}>
                        {item.isOpen ? '-' : '+'}
                    </button>
                    {/* )} */}
                </div>
                <div className={classes.rowLabel}>{item.name}</div>
            </div>
        </div>
    );
};

const VirtualTree = ({ nodes, openNodes, onSelectNode, onExpandNode, onCollapseNode }) => {
    const flattenNode = useCallback(
        (node, depth = 0) => {
            if (depth === 0) {
                return [
                    {
                        id: node.id,
                        name: node.name_text,
                        depth,
                        isLeaf: !Array.isArray(node.children) || node.children.length === 0,
                        isOpen: true,
                        data: { ...node, depth },
                    },
                    ...Object.values(node.children)
                        .reduce((prev, cur) => {
                            if (cur.is_file) {
                                return [...prev];
                            }
                            return [...prev, flattenNode(cur, depth + 1)];
                        }, [])
                        .flat(),
                ];
            }
            if (openNodes[node.id] === true) {
                return [
                    {
                        id: node.id,
                        name: node.name_text,
                        depth,
                        isLeaf: !Array.isArray(node.children) || node.children.length === 0,
                        isOpen: true,
                        data: { ...node, depth },
                    },
                    ...Object.values(node.children)
                        .reduce((prev, cur) => {
                            if (cur.is_file) {
                                return [...prev];
                            }
                            return [...prev, flattenNode(cur, depth + 1)];
                        }, [])
                        .flat(),
                ];
            }
            return [
                {
                    id: node.id,
                    name: node.name_text,
                    depth,
                    isLeaf: !Array.isArray(node.children) || node.children.length === 0,
                    isOpen: false,
                    data: { ...node, depth },
                },
            ];
        },
        [openNodes]
    );

    const flattenedNodes = useMemo(() => nodes.map((node) => flattenNode(node)).flat(), [flattenNode, nodes]);

    return (
        <AutoSizer>
            {(AutoSizerProps) => (
                <List
                    itemData={flattenedNodes}
                    direction='vertical'
                    height={AutoSizerProps.height}
                    width={AutoSizerProps.width}
                    itemCount={flattenedNodes.length}
                    itemSize={24}>
                    {(ListProps) => (
                        <VirtualTreeRow
                            {...ListProps}
                            onSelectNode={onSelectNode}
                            onExpandNode={onExpandNode}
                            onCollapseNode={onCollapseNode}
                        />
                    )}
                </List>
            )}
        </AutoSizer>
    );
};

export default VirtualTree;
