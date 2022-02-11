import React, {useState} from 'react';
import {useQuery, gql} from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Typography } from '@mui/material';
import {useTheme} from '@mui/material/styles';

export const allTokenDataFragment = gql`
fragment allTokenData on token {
    id
    Address
    AppContainer
    AppContainerNumber
    AppContainerSid
    AppId
    AppModelPolicies
    AppModelPolicyDictionary
    AttributesFlags
    AuditPolicy
    AuthenticationId_id
    BnoIsolationPrefix
    CanSynchronize
    Capabilities
    CreationTime
    DefaultDacl
    DenyOnlyGroups
    DeviceClaimAttributes
    DeviceGroups
    Elevated
    ElevationType
    EnabledGroups
    ExpirationTime
    Filtered
    Flags
    FullPath
    GrantedAccess
    GrantedAccessGeneric
    GrantedAccessMask
    GroupCount
    Groups
    Handle
    HandleReferenceCount
    HasRestrictions
    ImpersonationLevel
    Inherit
    IntegrityLevel
    IntegrityLevelSid
    IsClosed
    IsContainer
    IsPseudoToken
    IsRestricted
    IsSandbox
    LogonSid
    LowPrivilegeAppContainer
    MandatoryPolicy
    ModifiedId
    Name
    NoChildProcess
    NotLow
    NtType
    NtTypeName
    Origin
    Owner
    PackageFullName
    PackageIdentity
    PackageName
    PointerReferenceCount
    PrimaryGroup
    PrivateNamespace
    Privileges
    ProcessUniqueAttribute
    ProtectFromClose
    Restricted
    RestrictedDeviceClaimAttributes
    RestrictedDeviceGroups
    RestrictedSids
    RestrictedSidsCount
    RestrictedUserClaimAttributes
    SandboxInert
    Sddl
    SecurityAttributes
    SecurityDescriptor
    SessionId
    Source
    ThreadID
    TokenId
    TokenType
    TrustLevel
    UIAccess
    User
    UserClaimAttributes
    VirtualizationAllowed
    VirtualizationEnabled
    WriteRestricted
    task_id
    logonsession {
      id
      LogonId
      UserName
      LogonDomain
      LogonType
      SessionId
      Sid
      LogonTime
      LogonServer
      DnsDomainName
      Upn
      UserFlags
      LastSuccessfulLogon
      LastFailedLogon
      FailedAttemptCountSinceLastSuccessfulLogon
      LogonScript
      ProfilePath
      HomeDirectory
      HomeDirectoryDrive
      LogoffTime
      KickOffTime
      PasswordLastSet
      PasswordCanChange
      PasswordMustChange
      task_id
      authenticationpackages {
        id
        Name
        task_id
      }
    }
}
`;
const getTokenInfo = gql`
${allTokenDataFragment}
query getTokenInfo ($token_id: Int!) {
  token_by_pk(id: $token_id) {
    ...allTokenData
  }
}
`;

export function TaskTokenDialog(props) {
    const theme = useTheme();
    const [tokenData, setTokenData] = useState([]);
    const [logonsessionData, setLogonSessionData] = useState([]);
    const [authenticationData, setAuthenticationData] = useState([]);
    const tokenKeys = [
        "Address",
        "AppContainer",
        "AppContainerNumber",
        "AppContainerSid",
        "AppId",
        "AppModelPolicies",
        "AppModelPolicyDictionary",
        "AttributesFlags",
        "AuditPolicy",
        "AuthenticationId_id",
        "BnoIsolationPrefix",
        "CanSynchronize",
        "Capabilities",
        "CreationTime",
        "DefaultDacl",
        "DenyOnlyGroups",
        "DeviceClaimAttributes",
        "DeviceGroups",
        "Elevated",
        "ElevationType",
        "EnabledGroups",
        "ExpirationTime",
        "Filtered",
        "Flags",
        "FullPath",
        "GrantedAccess",
        "GrantedAccessGeneric",
        "GrantedAccessMask",
        "GroupCount",
        "Groups",
        "Handle",
        "HandleReferenceCount",
        "HasRestrictions",
        "ImpersonationLevel",
        "Inherit",
        "IntegrityLevel",
        "IntegrityLevelSid",
        "IsClosed",
        "IsContainer",
        "IsPseudoToken",
        "IsRestricted",
        "IsSandbox",
        "LogonSid",
        "LowPrivilegeAppContainer",
        "MandatoryPolicy",
        "ModifiedId",
        "Name",
        "NoChildProcess",
        "NotLow",
        "NtType",
        "NtTypeName",
        "Origin",
        "Owner",
        "PackageFullName",
        "PackageIdentity",
        "PackageName",
        "PointerReferenceCount",
        "PrimaryGroup",
        "PrivateNamespace",
        "Privileges",
        "ProcessUniqueAttribute",
        "ProtectFromClose",
        "Restricted",
        "RestrictedDeviceClaimAttributes",
        "RestrictedDeviceGroups",
        "RestrictedSids",
        "RestrictedSidsCount",
        "RestrictedUserClaimAttributes",
        "SandboxInert",
        "Sddl",
        "SecurityAttributes",
        "SecurityDescriptor",
        "SessionId",
        "Source",
        "ThreadID",
        "TokenId",
        "TokenType",
        "TrustLevel",
        "UIAccess",
        "User",
        "UserClaimAttributes",
        "VirtualizationAllowed",
        "VirtualizationEnabled",
        "WriteRestricted",
        "task_id"
    ]
    const logonsessionKeys = [
      "LogonId",
      "UserName",
      "LogonDomain",
      "LogonType",
      "SessionId",
      "Sid",
      "LogonTime",
      "LogonServer",
      "DnsDomainName",
      "Upn",
      "UserFlags",
      "LastSuccessfulLogon",
      "LastFailedLogon",
      "FailedAttemptCountSinceLastSuccessfulLogon",
      "LogonScript",
      "ProfilePath",
      "HomeDirectory",
      "HomeDirectoryDrive",
      "LogoffTime",
      "KickOffTime",
      "PasswordLastSet",
      "PasswordCanChange",
      "PasswordMustChange",
      "task_id"
    ]
    const authenticationpackageKeys = [
      "Name",
      "task_id"
    ]
    useQuery(getTokenInfo, {
        variables: {token_id: props.token_id},
        onCompleted: data => {
            if(data.token_by_pk !== null){
                setTokenData(data.token_by_pk);
                const reducedTokenData = tokenKeys.reduce( (prev, key) => {
                  if(data.token_by_pk[key] !== undefined && data.token_by_pk[key] !== null && data.token_by_pk[key] !== ""){
                    return [...prev, {"name": key, "value": data.token_by_pk[key]}]
                  }
                  else{
                    return [...prev];
                  }
                }, []);
                setTokenData(reducedTokenData);
                if(data.token_by_pk.logonsession !== null){
                  const reducedLogonSessionData = logonsessionKeys.reduce( (prev, key) => {
                    if(data.token_by_pk.logonsession[key] !== undefined && data.token_by_pk.logonsession[key] !== null && data.token_by_pk.logonsession[key] !== ""){
                      return [...prev, {"name": key, "value": data.token_by_pk.logonsession[key]}]
                    }
                    else{
                      return [...prev];
                    }
                  }, []);
                  setLogonSessionData(reducedLogonSessionData);
                  if (data.token_by_pk.logonsession.authenticationpackages.length > 0){
                    const reducedAuthenticationData = data.token_by_pk.logonsession.authenticationpackages.map( (pkg) => {
                      const packageData = authenticationpackageKeys.reduce( (prev, key) => {
                        if(pkg[key] !== undefined && pkg[key] !== null && pkg[key] !== ""){
                          return [...prev, {"name": key, "value": pkg[key]}];
                        }else{
                          return [...prev];
                        }
                      }, []);
                      return packageData;
                    })
                    
                    setAuthenticationData(reducedAuthenticationData);
                  }
                }
                
            }
        },
        onError: data => {
            snackActions.error(data)
        },
        fetchPolicy: "network-only"
    });
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Token Information</DialogTitle>
        <DialogContent dividers={true}>
        <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                  Token Data
              </Typography>
            </Paper>
          <Paper elevation={5} style={{position: "relative"}} variant={"elevation"}>
            <TableContainer component={Paper} className="mythicElement">
              <Table size="small" style={{"tableLayout": "fixed", "maxWidth": "calc(100vw)", "overflow": "scroll"}}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Token Property</TableCell>
                            <TableCell>Token Value</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                      {tokenData.map( (element, index) => (
                        <TableRow key={'row' + index}>
                          <TableCell>{element.name}</TableCell>
                          <TableCell>{element.value === true ? ("True") : (element.value === false ? ("False") : (element.value) ) }</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
              </TableContainer>
          </Paper>
        
        {logonsessionData.length > 0 &&
          <React.Fragment>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
              <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                  Associated Logon Session Data
              </Typography>
            </Paper>
            
            <Paper elevation={5} style={{position: "relative", marginTop: "20px"}} variant={"elevation"}>
              <TableContainer component={Paper} className="mythicElement">
                <Table size="small" style={{"tableLayout": "fixed", "maxWidth": "calc(100vw)", "overflow": "scroll"}}>
                      <TableHead>
                          <TableRow>
                              <TableCell>Logon Session Property</TableCell>
                              <TableCell>Logon Session Value</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                        {logonsessionData.map( (element, index) => (
                          <TableRow key={'logondatarow' + index}>
                            <TableCell>{element.name}</TableCell>
                            <TableCell>{element.value === true ? ("True") : (element.value === false ? ("False") : (element.value) ) }</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                  </Table>
                </TableContainer>
            </Paper>
          </React.Fragment>
        }
        {authenticationData.map( authpkg => (
            <React.Fragment key={"authpkg" + authpkg.id}>
              <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                <Typography variant="h6" style={{textAlign: "left", display: "inline-block", marginLeft: "20px", color: theme.pageHeaderColor}}>
                    Associated Authentication Package
                </Typography>
              </Paper>
              
              <Paper elevation={5} style={{position: "relative", marginTop: "20px"}} variant={"elevation"}>
                <TableContainer component={Paper} className="mythicElement">
                  <Table size="small" style={{"tableLayout": "fixed", "maxWidth": "calc(100vw)", "overflow": "scroll"}}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Authentication Package Property</TableCell>
                                <TableCell>Authentication Package Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                          {authpkg.map( (element, index) => (
                            <TableRow key={'authpackage' + authpkg.id + "row" + index}>
                              <TableCell>{element.name}</TableCell>
                              <TableCell>{element.value === true ? ("True") : (element.value === false ? ("False") : (element.value) ) }</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                    </Table>
                  </TableContainer>
              </Paper>
            </React.Fragment>
        ))
        }
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
    </React.Fragment>
  );
}

