import React, { useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Badge from '@material-ui/core/Badge';
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
const StyledAvatar = withStyles((theme) => ({
    badge: {
        boxShadow: "0 0 0 2px white",
        '&::after': {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          animation: '$ripple 1.2s infinite ease-in-out',
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
}))(Badge);

export function PayloadTypeCard(props) {
  const classes = useStyles();
  const [wrappedPayloads, setWrappedPayloads] = React.useState("");
  const [openBuildingDialog, setOpenBuildingDialog] = React.useState(false);
  const [supportedOS, setSupportedOS] = React.useState("");
  let date = new Date();
  let now = date.getTime() + date.getTimezoneOffset() * 60000;
  let heartbeat = new Date(props.last_heartbeat);
  let difference = (now - heartbeat.getTime()) / 1000;
  const running = difference < 30 ? 'running' : 'notrunning';
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
        <StyledAvatar overlap="circle" classes={{badge: classes[running]}} invisible={false} anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
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
                    innerDialog={<PayloadTypeBuildDialog {...props} payload_name={props.ptype} />}
                 />
          </div>
    </Card>
  );
}
