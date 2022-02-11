import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import {C2ProfileBuildDialog} from './C2ProfileBuildDialog';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import WifiIcon from '@mui/icons-material/Wifi';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import {useMutation, gql} from '@apollo/client';
import {C2ProfileOutputDialog} from './C2ProfileOutputDialog';
import {C2ProfileConfigDialog} from './C2ProfileConfigDialog';
import {C2ProfileStartStopOutputDialog} from './C2ProfileStartStopOutputDialog';
import {snackActions} from '../../utilities/Snackbar';
import {useTheme} from '@mui/material/styles';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import {C2ProfileSavedInstancesDialog} from './C2ProfileSavedInstancesDialog';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    display: "flex",
    marginBottom: "10px"
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  running: {
    
  },
  notrunning: {
    backgroundColor: 'red',
    color: 'red',
  },
}));
const StyledAvatar = styled(Badge)(({theme}) => ({
    '& .MuiBadge-badge': {
        boxShadow: "0 0 0 2px white",
        width: 15,
        height: 15,
        zIndex: 0,
        '&::after': {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          animation: 'ripple 1.2s infinite ease-in-out',
          border: '1px solid currentColor',
          content:'""'
        },
      },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));
const startStopProfileMutation = gql`
mutation StartStopProfile($id: Int!, $action: String) {
  startStopProfile(id: $id, action: $action) {
    status
    error
    output
  }
}
`;
const setProfileConfigMutation = gql`
mutation setProfileConfiguration($id: Int!, $file_path: String!, $data: String!) {
  uploadContainerFile(id: $id, file_path: $file_path, data: $data) {
    status
    error
    filename
  }
}
`;
export function C2ProfilesCard(props) {
  let date = new Date();
  const theme = useTheme();
  const classes = useStyles(theme);
  const [openBuildingDialog, setOpenBuildingDialog] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownAnchorRef = React.useRef(null);
  const handleDropdownToggle = () => {
    setDropdownOpen((prevOpen) => !prevOpen);
  };
  const handleDropdownClose = (event) => {
    if (dropdownAnchorRef.current && dropdownAnchorRef.current.contains(event.target)) {
      return;
    }

    setDropdownOpen(false);
  };
  const [startStopProfile] = useMutation(startStopProfileMutation, {
        update: (cache, {data}) => {
            
        },
        onError: data => {
            console.error(data);
        },
        onCompleted: data => {
            setOutput(data.startStopProfile.output);
            setOpenProfileStartStopDialog(true);
        }
    });
    const onStartStopProfile = () => {
        if(props.running){
            snackActions.info("Submitting stop task..." );
        }else{
            snackActions.info("Submitting start task..." );
        }  
        startStopProfile({variables: {id: props.id, action: props.running ? "stop" : "start"}});
    }
    const [openProfileDialog, setOpenProfileDialog] = React.useState(false);
    const [openProfileConfigDialog, setOpenProfileConfigDialog] = React.useState(false);
    const [output, setOutput] = React.useState("");
    const [openProfileStartStopDialog, setOpenProfileStartStopDialog] = React.useState(false);
    const [openProfileSavedInstancesDialog, setOpenProfileSavedInstancesDialog] = React.useState(false);
    const [configSubmit] = useMutation(setProfileConfigMutation, {
        update: (cache, {data}) => {
            
        },
        onError: data => {
            console.error(data);
        },
        onCompleted: data => {
            //console.log(data);
            if(data.uploadContainerFile.status === "success"){
                snackActions.success("Updated file");
            }else{
                snackActions.error("Error updating: " + data.uploadContainerFile.error );
            }
        }
    });
    const onConfigSubmit = (content) => {
        configSubmit({variables: {id: props.id, file_path: "config.json", data: content}});
    }
  return (
    <Card className={classes.root} elevation={5} style={{maxWidth: "100%"}}>
          <StyledAvatar overlap="circular" color={props.container_running ? "success" : "error"} variant="dot" anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
            {props.is_p2p ? 
            (<FontAwesomeIcon icon={faLink}  style={{width: "100px", height: "100px", marginTop: "25px"}} />)
            : 
            (<WifiIcon style={{width: "100px", height: "100px", marginTop: "25px"}}/>)
            }
          </StyledAvatar>
        <div style={{maxWidth: "60%"}}>
          <Typography variant="h4" component="h1" style={{textAlign:"left", marginLeft: "10px", display: "inline-block"}}>{props.name}</Typography>
          {!props.is_p2p && props.running &&
            <Typography variant="h6" component="h1" style={{textAlign:"left", marginLeft: "10px", display: "inline-block", color:theme.palette.success.main}}>(Server Running)</Typography>
          }
          {!props.is_p2p && !props.running &&
            <Typography variant="h6" component="h1" style={{textAlign:"left", marginLeft: "10px", display: "inline-block", color:theme.palette.error.main}}>(Server Not Running)</Typography>
          }
          <CardContent style={{textAlign:"left"}}>
              <Typography variant="body1" component="p">
                <b>Author:</b> {props.author}
              </Typography>
              <Typography variant="body1" component="p">
                <b>Supported Agents:</b> {props.payloadtypec2profiles.map( (pt) => (pt.payloadtype.ptype + " ") )}
              </Typography>
              <Typography variant="body2" component="p">
                {props.description}
              </Typography>
              <Typography variant="body2" component="p">
               
              </Typography>
          </CardContent>
        </div>
        <div style={{display: "inline-flex", paddingRight: "10px", marginLeft: "auto", justifyContent: "space-evenly", alignItems: "stretch", flexDirection: "column", alignContent: "flex-end"}}>
            <Button size="small" variant="contained" color="primary" href={"/docs/c2-profiles/" + props.name.toLowerCase()} target="_blank">
              Docs
            </Button>
            <Button size="small" onClick={()=>{setOpenBuildingDialog(true);}} color="info" variant="contained">Build Info</Button>
            {openBuildingDialog &&
              <MythicDialog fullWidth={true} maxWidth="lg" open={openBuildingDialog} 
                onClose={()=>{setOpenBuildingDialog(false);}} 
                innerDialog={<C2ProfileBuildDialog {...props} onClose={()=>{setOpenBuildingDialog(false);}} payload_name={props.name} />}
            />
            }
            {openProfileStartStopDialog &&
              <MythicDialog fullWidth={true} maxWidth="lg" open={openProfileStartStopDialog} 
                onClose={()=>{setOpenProfileStartStopDialog(false);}} 
                innerDialog={<C2ProfileStartStopOutputDialog output={output} onClose={()=>{setOpenProfileStartStopDialog(false);}} payload_name={props.name} />}
            />
            }
            
            {props.container_running ? (
                   props.running ?
                   (
                    <ButtonGroup variant="contained" ref={dropdownAnchorRef} aria-label="split button" color={props.running ? "success" : "error"} >
                       <Button size="small" color={props.running ? "success" : "error"} onClick={onStartStopProfile} style={{width: "100%"}}>Stop Profile</Button>
                       <Button
                          size="small"
                          aria-controls={dropdownOpen ? 'split-button-menu' : undefined}
                          aria-expanded={dropdownOpen ? 'true' : undefined}
                          aria-label="select merge strategy"
                          aria-haspopup="menu"
                          color={props.running ? "success" : "error"}
                          onClick={handleDropdownToggle}
                        >
                          <ArrowDropDownIcon />
                        </Button>
                      </ButtonGroup>
                   )
                   :
                   (
                     props.is_p2p ? (
                      null
                     ) : (
                      <ButtonGroup variant="contained" ref={dropdownAnchorRef} aria-label="split button" color={props.running ? "success" : "error"} >
                        <Button size="small" onClick={onStartStopProfile} color={props.running ? "success" : "error"} style={{width: "100%"}}>Start Profile</Button>
                        <Button
                          size="small"
                          aria-controls={dropdownOpen ? 'split-button-menu' : undefined}
                          aria-expanded={dropdownOpen ? 'true' : undefined}
                          aria-label="select merge strategy"
                          aria-haspopup="menu"
                          color={props.running ? "success" : "error"}
                          onClick={handleDropdownToggle}
                        >
                          <ArrowDropDownIcon />
                        </Button>
                      </ButtonGroup>
                     )
                      
                   )
            ) : (
              <Button disabled color="secondary">Container Offline</Button>
            )}
             <Button size="small" variant="contained" color="primary" onClick={() => {setOpenProfileSavedInstancesDialog(true);}}><BookmarkIcon /> Saved Instances</Button>
             {openProfileDialog &&
              <MythicDialog fullWidth={true} maxWidth="lg" open={openProfileDialog} 
                onClose={()=>{setOpenProfileDialog(false);}} 
                innerDialog={<C2ProfileOutputDialog {...props} payload_name={props.name} onClose={()=>{setOpenProfileDialog(false);}} profile_id={props.id} />}
              />
             }
            {openProfileConfigDialog &&
            <MythicDialog fullWidth={true} maxWidth="lg" open={openProfileConfigDialog} 
              onClose={()=>{setOpenProfileConfigDialog(false);}} 
              innerDialog={<C2ProfileConfigDialog {...props} onConfigSubmit={onConfigSubmit} payload_name={props.name} onClose={()=>{setOpenProfileConfigDialog(false);}} profile_id={props.id} />}
            />
            }
            {openProfileSavedInstancesDialog &&
              <MythicDialog fullWidth={true} maxWidth="xl" open={openProfileSavedInstancesDialog} 
                onClose={()=>{setOpenProfileSavedInstancesDialog(false);}} 
                innerDialog={<C2ProfileSavedInstancesDialog {...props} onClose={()=>{setOpenProfileSavedInstancesDialog(false);}} />}
            />
            }
            
            <Popper open={dropdownOpen} anchorEl={dropdownAnchorRef.current} role={undefined} transition disablePortal style={{zIndex: 4}}>
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                  }}
                >
                  <Paper style={{backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light, color: "white"}}>
                    <ClickAwayListener onClickAway={handleDropdownClose}>
                      <MenuList id="split-button-menu">
                        <MenuItem key={"dropdownprofile" + props.id + "menu1"} onClick={()=>{setOpenProfileConfigDialog(true);}}>View/Edit Config</MenuItem>
                       {
                        props.running ? 
                        (<MenuItem key={"dropdownprofile" + props.id + "menu2"} onClick={()=>{setOpenProfileDialog(true);}}>View Stdout/Stderr</MenuItem>) : (null)
                       }
                      </MenuList>
                      
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </div>
    </Card>
  );
}
