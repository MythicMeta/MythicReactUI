import React from 'react';
import FileBrowserVirtualTree from '../../MythicComponents/MythicFileBrowserVirtualTree';
import VirtualTree from '../../MythicComponents/VirtualTree2';


export const CallbacksTabsFileBrowserTree = ({ treeRoot, fetchFolderData, setTableData }) => {
    const [openNodes, setOpenNodes] = React.useState({});
    const toggleNodeExpanded = (nodeId, nodeData) => {
        console.log("toggleNodeExpanded", nodeId, nodeData);
        setTableData(nodeData.data);
        fetchFolderData(nodeData.data);
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
        setTableData(nodeData.data);
        console.log("onSelectNode", nodeId, nodeData);
    };
    return treeRoot.length === 0 ? (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                left: '50%',
                top: '50%',
            }}>
            No File Browser Data Collected
        </div>
    ) : (
      <VirtualTree
          nodes={treeRoot}
          openNodes={openNodes}
          onSelectNode={onSelectNode}
          onExpandNode={toggleNodeExpanded}
          onCollapseNode={toggleNodeCollapsed}
      />
    );
};