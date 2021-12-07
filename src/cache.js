import { makeVar } from '@apollo/client';

export const meState = makeVar({loggedIn:false, user: null, access_token: null, refresh_token: null});
export const menuOpen = makeVar(false);


export const successfulLogin = (data) => {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    meState({
        loggedIn: true,
        ...data
    });
}
export const successfulRefresh = (data) => {
    localStorage.setItem("access_token", data.access_token);
    meState({
        loggedIn: true,
        access_token: localStorage.getItem("access_token"),
        ...meState()
    });
}
export const FailedRefresh = () =>{
    console.log("failed refresh");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    meState({
        loggedIn: false,
        access_token: null,
        refresh_token: null,
        user: null
    });
}

