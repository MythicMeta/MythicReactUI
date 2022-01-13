import React from 'react';
import ProcessBrowserVirtualTree from '../../MythicComponents/MythicProcessBrowserVirtualTree';


export const CallbacksTabsProcessBrowserTree = ({treeRoot}) => {
    const [openNodes, setOpenNodes] = React.useState({});
    const toggleNodeExpanded = (nodeId, nodeData) => {
        setOpenNodes({
          ...openNodes,
          [nodeId]: true
        });
      };
    const toggleNodeCollapsed = (nodeId, nodeData) => {
        setOpenNodes({
          ...openNodes,
          [nodeId]: false
        });
      };
    const onSelectNode = (nodeId, nodeData) => {
        console.log("onSelectNode", nodeId, nodeData);
    };
    React.useEffect( () => {
      // start off with all of the nodes open for the process browser
      let open = {};
      const recursiveCall = (node) => {
        open[node.id] = true;
        node?.children?.forEach( n => recursiveCall(n));
      }
      treeRoot.forEach(r => recursiveCall(r));
      setOpenNodes(open);
    }, [treeRoot]);
    return (
        treeRoot.length === 0 ? (
            <div style={{
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                 position: "absolute", 
                 left: "50%", 
                 top: "50%"
                }}>
                    No Process Listing Data
            </div>
        ) : (
            <ProcessBrowserVirtualTree
                nodes={treeRoot}
                display_name={"name"}
                openNodes={openNodes}
                onSelectNode={onSelectNode}
                onExpandNode={toggleNodeExpanded}
                onCollapseNode={toggleNodeCollapsed}
            />
        )
    )
}
