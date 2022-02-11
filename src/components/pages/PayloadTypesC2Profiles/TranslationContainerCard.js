import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
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

export function TranslationContainerCard(props) {
  const classes = useStyles();
  let date = new Date();
  let now = date.getTime() + date.getTimezoneOffset() * 60000;
  let heartbeat = new Date(props.last_heartbeat);
  let difference = (now - heartbeat.getTime()) / 1000;
  const running = difference < 30 ? 'running' : 'notrunning';

  return (
    <Card className={classes.root} elevation={5}>
        <StyledAvatar overlap="circular" color={props.container_running ? "success" : "error"} variant="dot" anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
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
