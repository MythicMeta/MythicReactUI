import { fade } from "@material-ui/core";
import { useCallback, useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import { useTheme } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import DescriptionIcon from '@material-ui/icons/Description';

const VirtualTreeRow = ({
  onSelectNode,
  onExpandNode,
  onCollapseNode,
  ...ListProps
}) => {

  const item = ListProps.data[ListProps.index];
  const theme = useTheme();
  const handleOnClickButton = (e) => {
    e.stopPropagation();
    if (item.isOpen) {
      onCollapseNode(item.id, item);
    } else {
      onExpandNode(item.id, item);
    }
  };

  const handleOnClickRow = (e) => {
    onSelectNode(item.id, item);
  };
  return (
    <div style={ListProps.style}>
    <div style={{display: 'flex' , marginBottom: "2px", flexGrow: 1}}>
        {[...Array(item.data.depth)].map((o, i) => (
            <div
                key={'folder' + item.data.id + 'lines' + i}
                style={{
                    borderLeft: `2px dashed ${fade(theme.palette.text.primary, 0.4)}`,
                    marginLeft: 15,
                    paddingRight: 15,
                    display: 'inline-block',
                }}></div>
        ))}
        {item.data.children.length === 0 ? (
          <DescriptionIcon style={{ marginLeft: '3px' }} />
        ) : (
          item.isOpen ? (
            <KeyboardArrowDownIcon 
              style={{
                marginLeft: "3px",
              }}
              onClick={handleOnClickButton}
              />
          ) : (
            <KeyboardArrowRightIcon 
              style={{
                marginLeft: "3px",
              }}
              onClick={handleOnClickButton}
              />
          )
        )}
        <Typography style={{paddingLeft: "10px"}} component="pre">
                {item.data.process_id} - {item.data.name}
        </Typography>
    </div>
    </div>
);
};

const ProcessBrowserVirtualTree = ({
  nodes,
  openNodes,
  onSelectNode,
  onExpandNode,
  onCollapseNode,
  display_name,
}) => {
  const flattenNode = useCallback(
    (node, depth = 0) => {
      if (openNodes[node.id] === true) {
        return [
          {
            id: node.id,
            name: node[display_name],
            depth,
            isLeaf: !Array.isArray(node.children) || node.children.length === 0,
            isOpen: true,
            data: {...node, depth}
          },
          ...(Object.values(node.children).reduce( (prev, cur) => {
              if(cur.is_file){return [...prev]}
              return [...prev, flattenNode(cur, depth+1)];
          }, []).flat())
        ];
      }
      return [
        {
          id: node.id,
          name: node[display_name],
          depth,
          isLeaf: !Array.isArray(node.children) || node.children.length === 0,
          isOpen: false,
          data: {...node, depth},
        }
      ];
     
    },
    [openNodes] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const flattenedNodes = useMemo(
    () => nodes.map((node) => flattenNode(node)).flat(),
    [flattenNode, nodes]
  );
  return (
    <AutoSizer>
      {(AutoSizerProps) => (
        <List
          itemData={flattenedNodes}
          direction="vertical"
          height={AutoSizerProps.height - 10}
          width={AutoSizerProps.width - 10}
          itemCount={flattenedNodes.length}
          itemSize={24}
        >
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

export default ProcessBrowserVirtualTree;
