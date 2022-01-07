import React, { useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-xcode';
import {useTheme} from '@material-ui/core/styles';

export const ResponseDisplayPlaintext = (props) =>{
  const theme = useTheme();
  const [plaintextView, setPlaintextView] = React.useState(props.plaintext);
  useEffect( () => {
    try{
      const newPlaintext = JSON.stringify(JSON.parse(props.plaintext), null, 4);
      setPlaintextView(newPlaintext);
    }catch(error){
      //console.log("trying to JSONify plaintext error", error);
      setPlaintextView(props.plaintext);
    }
  }, [props.plaintext])
  return (
    <AceEditor 
        mode="json"
        theme={theme.palette.type === "dark" ? "monokai" : "xcode"}
        fontSize={14}
        showGutter={true}
        height={"100px"}
        highlightActiveLine={true}
        value={plaintextView}
        width={"100%"}
        minLines={2}
        maxLines={50}
        readOnly
        setOptions={{
          showLineNumbers: true,
          tabSize: 4,
          useWorker: false
        }}/>
  )
      
}