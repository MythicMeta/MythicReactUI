import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import { red } from '@material-ui/core/colors';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Link } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    width: `100%`,
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
  avatar: {
    backgroundColor: red[500],
  },
}));

export function QuickStartCard() {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className={classes.root} elevation={5}>
      <CardHeader
        avatar={
          <Avatar className={classes.avatar}>
            
          </Avatar>
        }
        title="Mythic Quick Start Guide"
        subheader="Expand this section to learn how to: Generate a Payload, Download the Payload, Get To Callbacks"
        style={{paddingBottom: 0, marginBottom: 0}}
      />
      <CardActions styl={{padding: 0, margin: 0}}>
        <IconButton
          className={clsx(classes.expand, {
            [classes.expandOpen]: expanded,
          })}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </IconButton>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent style={{margin: 0, paddingTop: 0}}>
          <ol>
            <li>
              Create a payload at <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" href={"/new/createpayload"}>Create -> Create Payload</Link>
              <ul>
                <li>Select Desired OS</li>
                <li>Select Payload Type and Supply Build Parameters</li>
                <li>Select Commands You Want Stamped Into The Agent</li>
                <li>Select C2 Profiles and Fill Out Parameters</li>
                <li>Name Your Payload</li>
                <li>Provide a Description</li>
                <li>Build Your Payload</li>
              </ul>
            </li>
            <li>Download Your Payload at <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" href={"/new/payloads"}>Operational Data -> Payloads</Link></li>
            <li>Run Your payload
              <ul>
                <li>For More Information About Your Agent, Check Out The <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" href={"/docs/agents"}>Internal Documentation</Link></li>
              </ul>
            </li>
            <li>Interact With Your Agent At <Link style={{wordBreak: "break-all"}} color="textPrimary" underline="always" target="_blank" href={"/new/callbacks"}>Active Callbacks</Link></li>
          </ol>
        </CardContent>
      </Collapse>
    </Card>
  );
}
