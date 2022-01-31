import React from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { MobileStepper } from '@material-ui/core';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import {useTheme} from '@material-ui/core/styles';

export function ResponseDisplayScreenshotModal({onClose, images, startIndex}) {
    const [zoom, setZoom] = React.useState(false);
    const theme = useTheme();
    const [activeStep, setActiveStep] = React.useState(startIndex ? startIndex : 0);
    const maxSteps = images?.length || 1;
    const toggleZoom = () => {
      setZoom(!zoom);
    }
    const handleNext = () => {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };
  
    const handleBack = () => {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };
  return (
    <React.Fragment>
        <DialogContent dividers={true} style={{padding: 0}}>
          <div style={{height: "calc(80vh)", display: zoom ? "" : "flex", alignItems: zoom ? "" : "center" , background: theme.palette.type === "dark" ? "rgb(44, 52, 60)" : "grey"}}>
            <img onClick={toggleZoom} src={"/api/v1.4/files/screencaptures/" + images[activeStep]} style={{width: zoom ? "" : "100%", cursor: zoom ? "zoom-out" : "zoom-in", overflow: "auto"}} />
          </div>
        </DialogContent>
        <MobileStepper
          variant="text"
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          nextButton={
            <Button
              size="small"
              onClick={handleNext}
              disabled={activeStep === maxSteps - 1}
            >
              Next
              {<KeyboardArrowRight />}
            </Button>
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
              {<KeyboardArrowLeft />}
              Back
            </Button>
          }
        />
        <DialogActions>
          <Button variant="contained" onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

