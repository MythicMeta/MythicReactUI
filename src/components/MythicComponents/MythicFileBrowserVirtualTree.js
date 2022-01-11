import { makeStyles, fade } from "@material-ui/core";
import { useCallback, useEffect, useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import { snackActions } from '../utilities/Snackbar';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ComputerIcon from '@material-ui/icons/Computer';
import DescriptionIcon from '@material-ui/icons/Description';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import { useTheme } from '@material-ui/core/styles';
import Badge from '@material-ui/core/Badge';
import { Typography } from '@material-ui/core';
import { MythicStyledTooltip } from "./MythicStyledTooltip";

const useStyles = makeStyles((theme) => ({
  rowContainer: {},
  row: {
    display: "flex",
    alignItems: "left",
    marginLeft: (props) => theme.spacing(3 * props.depth),
    userSelect: "none",
    whiteSpace: "nowrap"
  },
  rowButtonWrapper: {
    width: theme.spacing(3),
    textAlign: "center",
    "&:hover": {
      cursor: "pointer",
      textDecoration: "underline"
    }
  },
  rowButton: {
    width: theme.spacing(3)
  },
  rowLabel: {
    marginLeft: theme.spacing(0.5)
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    whiteSpace: 'pre-line',
},
secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    //color: theme.palette.text.secondary,
    overflow: 'hidden',
    display: 'block',
    textOverflow: 'ellipsis',
    maxWidth: 'calc(90vw)',
    whiteSpace: 'nowrap',
},
taskAndTimeDisplay: {
    fontSize: theme.typography.pxToRem(12),
    color: theme.palette.text.secondary,
    overflow: 'hidden',
    display: 'block',
    textOverflow: 'ellipsis',
    maxWidth: 'calc(90vw)',
    whiteSpace: 'nowrap',
},
secondaryHeadingExpanded: {
    fontSize: theme.typography.pxToRem(15),
    //color: theme.palette.text.secondary,
    display: 'block',
    overflow: 'auto',
    maxWidth: 'calc(90vw)',
    whiteSpace: 'break-word',
},
icon: {
    verticalAlign: 'middle',
    height: 20,
    width: 20,
},
details: {
    alignItems: 'center',
},
column: {
    padding: '0 5px 0 0',
    display: 'inline-block',
    margin: 0,
    height: 'auto',
},
paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
},
table: {
    minWidth: 750,
},
visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
},
}));

const VirtualTreeRow = ({
  onSelectNode,
  onExpandNode,
  onCollapseNode,
  ...ListProps
}) => {

  const item = ListProps.data[ListProps.index];
  const theme = useTheme();
  const classes = useStyles();
  const handleOnClickButton = (e) => {
    e.stopPropagation();
    if (item.isOpen) {
      onCollapseNode(item.id, item);
    } else {
      snackActions.info('fetching elements...', { persist: true });
      onExpandNode(item.id, item);
    }
  };

  const handleOnClickRow = (e) => {
    onSelectNode(item.id, item);
  };
  return (
    <div style={{display: 'flex' , marginBottom: "2px", flexGrow: 1, width: "100%"}}>
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
        <div
          className={classes.root}
          style={{ backgroundColor: theme.body, color: theme.text, alignItems: 'center', display: 'flex', paddingRight: "10px" }}
          onClick={handleOnClickRow}>
          {item.data.parent_id === null ? (
              <ComputerIcon style={{ marginLeft: '3px', marginRight: '5px' }} onClick={handleOnClickButton} />
          ) : item.data.is_file ? (
              <DescriptionIcon style={{ marginLeft: '3px', marginRight: '5px' }} />
          ) : item.isOpen ? (
              <FolderOpenIcon
                  style={{
                      marginLeft: '3px',
                      marginRight: '5px',
                      color: theme.folderColor
                  }}
                  onClick={handleOnClickButton}
              />
          ) : (
              <FolderIcon style={{ paddingTop: '5px', marginLeft: '3px', marginRight: '5px', color: theme.folderColor }} onClick={handleOnClickButton} />
          )}
          {item.data.depth > 0 &&
          item.data.filebrowserobjs_aggregate.aggregate.count > 99 ? (
              <MythicStyledTooltip title='Number of known children'>
                  <Badge
                      style={{ left: -50 }}
                      max={99}
                      badgeContent={item.data.filebrowserobjs_aggregate.aggregate.count}
                      color='primary'
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}></Badge>
              </MythicStyledTooltip>
          ) : null}
          <Typography
              style={{
                  color:
                      item.data.filebrowserobjs_aggregate.aggregate.count > 0 ||
                      item.data.success !== null
                          ? theme.palette.text.primary
                          : theme.palette.text.secondary,
              }}>
              {item.data.parent_id === null ? item.data.host : item.data.name_text}
          </Typography>

          {item.data.success === true && item.data.depth > 0 ? (
              <MythicStyledTooltip title='Successfully listed contents of folder'>
                  <CheckCircleIcon fontSize='small' style={{ color: theme.palette.success.main }} />
              </MythicStyledTooltip>
          ) : item.data.success === false && item.data.depth > 0 ? (
              <MythicStyledTooltip title='Failed to list contents of folder'>
                  <ErrorIcon fontSize='small' style={{ color: theme.palette.error.main }} />
              </MythicStyledTooltip>
          ) : null}
      </div>
    </div>
);
};

const FileBrowserVirtualTree = ({
  nodes,
  openNodes,
  onSelectNode,
  onExpandNode,
  onCollapseNode,
  display_name,
}) => {
  const flattenNode = useCallback(
    (node, depth = 0) => {
      console.log("calling flattenNode");
      if(depth === 0){
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
    [openNodes]
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

export default FileBrowserVirtualTree;
