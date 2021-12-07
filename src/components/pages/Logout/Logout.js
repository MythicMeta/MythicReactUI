import React, {useEffect} from 'react';
import {Redirect} from 'react-router-dom';
import { menuOpen, FailedRefresh } from '../../../cache';

export function Logout(props){
    useEffect(() => {
        if(menuOpen){
            menuOpen(false);
        }
    })
    return(
        <Redirect to='/new/login' />
    )
}

