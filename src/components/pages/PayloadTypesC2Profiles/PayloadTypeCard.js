import React, { useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {PayloadTypeBuildDialog} from './PayloadTypeBuildDialog';

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
    backgroundColor: '#44b700',
    color: '#44b700',
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

export function PayloadTypeCard(props) {
  const classes = useStyles();
  const [wrappedPayloads, setWrappedPayloads] = React.useState("");
  const [openBuildingDialog, setOpenBuildingDialog] = React.useState(false);
  const [supportedOS, setSupportedOS] = React.useState("");
  useEffect( () => {
    if( props.wrap_these_payload_types.length > 0){
      const wrapped = props.wrap_these_payload_types.map( (cur) => {
        return cur.wrapped.ptype;
      });
      setWrappedPayloads(wrapped.join(", "));
    }
    else{
      setWrappedPayloads("");
    }
    setSupportedOS(props.supported_os.split(",").join(", "));
  }, [props.wrap_these_payload_types, props.supported_os]);
  return (
    <Card className={classes.root} elevation={5}>
        <StyledAvatar overlap="circular" color={props.container_running ? "success" : "error"} variant="dot" anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
            <CardMedia
            className={classes.media}
            component="img"
            style={{width: "125px", height: "125", padding: "10px", objectFit: "unset"}}
            src={"/static/" + props.ptype + ".svg"}
          />
        </StyledAvatar>
        <div style={{maxWidth: "60%"}}>
          <Typography variant="h4" component="h1" style={{textAlign:"left", marginLeft: "10px"}}>{props.ptype}</Typography>
          <CardContent style={{textAlign:"left"}}>
              <Typography variant="body1" component="p">
                <b>Author:</b> {props.author}
              </Typography>
              <Typography variant="body1" component="p">
                <b>Supported Operating Systems:</b> {supportedOS}
              </Typography>
              
              {props.wrap_these_payload_types.length === 0 ? (null) : (
                <Typography variant="body1" component="p">
                  <b>Wrapped Payload Types:</b> {wrappedPayloads}
                </Typography>
              )}
              <Typography variant="body2" component="p">
                {props.note}
              </Typography>
          </CardContent>
        </div>
        <div style={{display: "inline-flex", paddingRight: "10px", marginLeft: "auto", justifyContent: "space-evenly", alignItems: "stretch", flexDirection: "column", alignContent: "flex-end"}}>
            <Button size="small" variant="contained" color="primary" href={props.wrapper ? "/docs/wrappers/" + props.ptype : "/docs/agents/" + props.ptype} target="_blank">
              Docs
            </Button>
            <Button size="small" onClick={()=>{setOpenBuildingDialog(true);}} color="primary" variant="contained">Building Info</Button>
              <MythicDialog fullWidth={true} maxWidth="lg" open={openBuildingDialog} 
                  onClose={()=>{setOpenBuildingDialog(false);}} 
                  innerDialog={<PayloadTypeBuildDialog {...props} onClose={()=>{setOpenBuildingDialog(false);}} payload_name={props.ptype} />}
                />
          </div>
    </Card>
  );
}
