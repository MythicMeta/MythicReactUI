import React, {useState} from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import MythicTextField from '../../MythicComponents/MythicTextField';


export function TableFilterDialog({filterOptions, onSubmit, onClose, selectedColumn}) {
    const [description, setDescription] = useState("");
    
    const onCommitSubmit = () => {
        onSubmit({...filterOptions, [selectedColumn.key]: description});
        onClose();
    }
    const onChange = (name, value, error) => {
        setDescription(value);
    }
    React.useEffect( () => {
        if(filterOptions[selectedColumn.key]){
          setDescription(filterOptions[selectedColumn.key]);
        }
    }, [selectedColumn]);
  
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Filter {selectedColumn.name} Entries</DialogTitle>
        <DialogContent dividers={true}>
            <MythicTextField autoFocus onChange={onChange} value={description} onEnter={onCommitSubmit}/>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose} color="primary">
            Close
          </Button>
          <Button variant="contained" onClick={onCommitSubmit} color="secondary">
            Submit
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

