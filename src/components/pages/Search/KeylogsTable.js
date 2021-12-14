import React, { useEffect } from 'react';
import Grid from '@material-ui/core/Grid';

export function KeylogsTable(props){
    const [keylogs, setKeylogs] = React.useState([]);
    useEffect( () => {
        const condensed = props.keylogs.reduce( (prev, cur) => {
            if(prev[cur.user] === undefined){
                prev[cur.user] = {[cur.task.callback.host]: {[cur.window]: [{...cur}]}}
            }else if(prev[cur.user][cur.task.callback.host] === "undefined"){
                prev[cur.user][cur.task.callback.host] = {[cur.window]: [{...cur}]}
            }else if(prev[cur.user][cur.task.callback.host][cur.window] === undefined){
                prev[cur.user][cur.task.callback.host][cur.window] = [{...cur}];
            }else{
                prev[cur.user][cur.task.callback.host][cur.window].push({...cur});
            }
            return {...prev}
        },{})
        //now that we have it split into a dictionary, we need to split it back out into an array for easy processing
        let newArrayData = [];
        for(const [key, value] of Object.entries(condensed)){
            // key should be a User, Host, or Window
            let newSecondLevel = [];
            //console.log("key", key, "value", value);
            for(const [key2, value2] of Object.entries(value)){
                // key2 should be a Host, User, or Host
                let newThirdLevel = []
                //console.log("key2", key2, "value2", value2);
                for( const[key3, value3] of Object.entries(value2)){
                    // key3 should be Window, Window, or User
                    // value3 should always be an array of keylog entries so we can get the actual keystrokes
                    //console.log("key3", key3, "value3", value3);
                    newThirdLevel.push({"name": key3, "value": value3});
                }
                //console.log("newThirdLevel", newThirdLevel);
                newSecondLevel.push({"name": key2, "value": newThirdLevel});
            }
            newArrayData.push({"name": key, "value": newSecondLevel});
        }
        //console.log(newArrayData);
        setKeylogs([...newArrayData]);
    }, [props.keylogs]);
//k0["name"]
    return (
        <Grid container spacing={0} direction="row" columns={12}>
            {keylogs.map( k0 => (
                <React.Fragment key={k0["name"]}>
                    <Grid item xs={2} style={{borderBottom: "2px solid grey"}}>{k0["name"]}</Grid>
                    <Grid container item spacing={0} xs={10} style={{borderBottom: "2px solid grey"}}>
                        {k0.value.map( (k1, k1i) => (
                            <React.Fragment key={k0["name"] + k1["name"]}>
                                <Grid item xs={2} style={{borderBottom: k1i + 1 !== k0.value.length ? "2px solid grey": ""}}>{k1["name"]}</Grid>
                                <Grid container item spacing={0} xs={10} style={{borderBottom: k1i + 1 !== k0.value.length ? "2px solid grey" : ""}}>
                                    {k1.value.map( (k2, k2i) => (
                                        <React.Fragment key={k0["name"] + k1["name"] + k2["name"]}>
                                            <Grid item xs={2} style={{borderBottom: k2i + 1 !== k1.value.length ? "2px solid grey" : ""}}> {k2["name"]} </Grid>
                                            <Grid container item spacing={0} xs={10} style={{borderBottom: k2i + 1 !== k1.value.length ? "2px solid grey": ""}}>
                                                <Grid item xs={12}>
                                                    {k2.value.map( (k3, k3i) => (
                                                        <span key={k0["name"] + k1["name"] + k2["name"] + k3i}>{k3.keystrokes_text}</span>
                                                    ))}
                                                </Grid>
                                            </Grid>
                                        </React.Fragment>
                                    ))}
                                </Grid>
                            </React.Fragment>
                        ))}
                    </Grid>
                </React.Fragment>
            ))}
        </Grid>
    )
}

/*
    <TableCell>
                    <Typography variant="body2" style={{wordBreak: "break-all"}}>{toLocalTime(props.timestamp, me.user.view_utc_time)}</Typography>
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{wordBreak: "break-all", display: "inline-block"}}>{props.task.callback.host}</Typography>
                </TableCell>
                <TableCell >
                    <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" 
                        href={"/new/task/" + props.task.id}>
                            {props.task.id}
                    </Link>
                </TableCell>
                <TableCell>
                <Typography variant="body2" style={{wordBreak: "break-all", maxWidth: "40rem"}}>{props.keystrokes_text}</Typography>
                </TableCell>
*/
