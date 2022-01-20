import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import { useSubscription, gql } from '@apollo/client';
import { CallbacksTabsTaskingLabel, CallbacksTabsTaskingPanel } from './CallbacksTabsTasking';
import { CallbacksTabsFileBrowserLabel, CallbacksTabsFileBrowserPanel } from './CallbacksTabsFileBrowser';
import { CallbacksTabsProcessBrowserLabel, CallbacksTabsProcessBrowserPanel } from './CallbacksTabsProcessBrowser';
import { meState } from '../../../cache';
import { useReactiveVar } from '@apollo/client';

const SUB_Callbacks = gql`
    subscription CallbacksSubscription($operation_id: Int!) {
        callbacktoken(
            where: {
                deleted: { _eq: false }
                callback: { operation_id: { _eq: $operation_id }, active: { _eq: true } }
            }
        ) {
            token {
                TokenId
                id
                User
                description
            }
            callback {
                id
            }
            id
        }
    }
`;
const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
}));
export function CallbacksTabs({ onCloseTab, openTabs, clickedTabId, clearSelectedTab, onEditTabDescription }) {
    const classes = useStyles();
    const me = useReactiveVar(meState);
    const [callbackTokens, setCallbackTokens] = React.useState([]);
    useSubscription(SUB_Callbacks, {
        variables: { operation_id: me?.user?.current_operation_id || 0},
        fetchPolicy: 'network-only',
        shouldResubscribe: true,
        onSubscriptionData: ({ subscriptionData }) => {
            setCallbackTokens(subscriptionData.data.callbacktoken);
        },
    });
    const [value, setValue] = React.useState(0);
    const handleChange = (event, newValue) => {
        setValue(newValue);
        localStorage.setItem('clickedTab', openTabs[newValue].tabID);
    };
    const onCloseTabLocal = ({ tabID, index }) => {
        if (index > 0) {
            setValue(index - 1);
        } else {
            setValue(0);
        }
        onCloseTab({ tabID, index });
    };
    useEffect(() => {
        for (let i = 0; i < openTabs.length; i++) {
            if (openTabs[i].tabID === clickedTabId) {
                setValue(i);
            }
        }
        clearSelectedTab();
    }, [clickedTabId, openTabs, clearSelectedTab]);
    return (
        <div className={classes.root} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: "100%" }}>
            <AppBar color='default' position='static'>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    indicatorColor='primary'
                    textColor='primary'
                    variant='scrollable'
                    scrollButtons='auto'
                    style={{ maxWidth: '100%', width: '100%' }}
                    aria-label='scrollable auto tabs example'>
                    {openTabs.map((tab, index) => {
                        switch (tab.tabType) {
                            case 'interact':
                                return (
                                    <CallbacksTabsTaskingLabel
                                        onEditTabDescription={onEditTabDescription}
                                        onCloseTab={onCloseTabLocal}
                                        key={'tablabel' + tab.tabID + tab.tabType}
                                        tabInfo={tab}
                                        index={index}
                                    />
                                );
                            case 'fileBrowser':
                                return (
                                    <CallbacksTabsFileBrowserLabel
                                        onEditTabDescription={onEditTabDescription}
                                        onCloseTab={onCloseTabLocal}
                                        key={'tablabel' + tab.tabID + tab.tabType}
                                        tabInfo={tab}
                                        index={index}
                                    />
                                );
                            case 'processBrowser':
                                return (
                                    <CallbacksTabsProcessBrowserLabel
                                        onEditTabDescription={onEditTabDescription}
                                        onCloseTab={onCloseTabLocal}
                                        key={'tablabel' + tab.tabID + tab.tabType}
                                        tabInfo={tab}
                                        index={index}
                                    />
                                );
                            default:
                                return null;
                        }
                    })}
                </Tabs>
            </AppBar>

            {openTabs.map((tab, index) => {
                switch (tab.tabType) {
                    case 'interact':
                        return (
                            <CallbacksTabsTaskingPanel
                                style={{
                                    position: 'relative',
                                    height: '100%',
                                    maxHeight: '100%',
                                    overflow: 'auto',
                                }}
                                key={'tabpanel' + tab.tabID + tab.tabType}
                                onCloseTab={onCloseTabLocal}
                                tabInfo={tab}
                                value={value}
                                index={index}
                                callbacktokens={callbackTokens}
                            />
                        );
                    case 'fileBrowser':
                        return (
                            <CallbacksTabsFileBrowserPanel
                                style={{
                                    height: '100%',
                                    maxHeight: '100%',
                                    position: 'relative',
                                    overflow: 'auto',
                                }}
                                onCloseTab={onCloseTabLocal}
                                key={'tabpanel' + tab.tabID + tab.tabType}
                                tabInfo={tab}
                                value={value}
                                index={index}
                            />
                        );
                    case 'processBrowser':
                        return (
                            <CallbacksTabsProcessBrowserPanel
                                style={{
                                    height: '100%',
                                    maxHeight: '100%',
                                    position: 'relative',
                                    overflow: 'auto',
                                }}
                                onCloseTab={onCloseTabLocal}
                                key={'tabpanel' + tab.tabID + tab.tabType}
                                tabInfo={tab}
                                value={value}
                                index={index}
                            />
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
}
