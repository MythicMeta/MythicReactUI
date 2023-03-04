import { snackActions } from '../utilities/Snackbar';

export const UploadTaskFile = async (file, comment) => {
  let formData = new FormData();
  formData.append("file", file);
  formData.append("comment", comment);
  snackActions.info("Uploading " + file.name + " to Mythic...", {autoHideDuration: 2000});
  try{
    const upload_response = await fetch('/api/v1.4/task_upload_file_webhook', {
      method: 'POST',
      body: formData,
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    });
    try{
      const upload_result = upload_response.json().then(data => {
          //console.log(data);
          return data?.agent_file_id || data?.error || null;
        }).catch(error => {
          console.log(upload_response);
          snackActions.warning("Error: " + upload_response.statusText + "\nError Code: " + upload_response.status);
          console.log("Error trying to get json response", error.toString());
          return null;
        });
        return upload_result;
    }catch(error){
      snackActions.error(error.toString());
      return null;
    }
  }catch(error){
      snackActions.error(error.toString());
      return null;
  }
}