import React from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Badge from '@material-ui/core/Badge';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';

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

export function TranslationContainerCard(props) {
  const classes = useStyles();
  let date = new Date();
  let now = date.getTime() + date.getTimezoneOffset() * 60000;
  let heartbeat = new Date(props.last_heartbeat);
  let difference = (now - heartbeat.getTime()) / 1000;
  const running = difference < 30 ? 'running' : 'notrunning';

  return (
    <Card className={classes.root} elevation={5}>
        <StyledAvatar overlap="circle" classes={{badge: classes[running]}} invisible={false} anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
            <FontAwesomeIcon icon={faLanguage} size="6x" style={{width: "125px", height: "125px"}} />
        </StyledAvatar>
        <div>
          <Typography variant="h4" component="h1" style={{textAlign:"left", marginLeft: "10px"}}>{props.name}</Typography>
          {props.payloadtypes.length > 0 ? (
              <Typography variant="body1" component="p">
                <b>Translated Payload Types:</b> {props.payloadtypes.map( (pt) => pt.ptype).join(", ")}
              </Typography>
          ): (null)}
        </div>
    </Card>
  );
}
