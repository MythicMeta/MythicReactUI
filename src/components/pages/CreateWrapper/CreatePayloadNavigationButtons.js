import React from 'react';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

/*
    Takes in props for Boolean of first/last
    Takes in props for canceled
    Takes in props for finished
*/
export function CreatePayloadNavigationButtons(props){

    return (
        <div >
            <Button
                disabled={props.first}
                color="primary"
                onClick={props.canceled}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color={props.last ? "success" : "primary"}
                onClick={props.finished}
                disabled={props.disableNext}
              >
                {props.last ? 'Create Wrapped Payload' : 'Next'}
              </Button>
              {props.last &&
              <React.Fragment>
                <Button
                  variant="contained"
                  color="warning"
                  style={{marginLeft: "10px"}}
                  onClick={props.startOver}
                >
                  Start Over
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  component={Link}
                  style={{marginLeft: "10px"}}
                  to={"/new/createpayload"}
                >
                  Create Another Payload
                </Button>
              </React.Fragment>
                
              }
        </div>
    );
} 
