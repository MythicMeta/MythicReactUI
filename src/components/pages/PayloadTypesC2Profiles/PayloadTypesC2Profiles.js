import React from 'react';
import {PayloadTypeContainerDisplay} from './PayloadTypeContainerDisplay';
import {C2ProfileContainerDisplay} from './C2ProfileContainerDisplay';
import {TranslationContainerDisplay} from './TranslationContainerDisplay';
import Grid from '@material-ui/core/Grid';

export function PayloadTypesC2Profiles(props){

    return (
      <React.Fragment>
        <Grid container spacing={0}>
          <Grid item xs={6}>
          <PayloadTypeContainerDisplay />
          </Grid>
          <Grid item xs={6}>
          <C2ProfileContainerDisplay />
          </Grid>
          <Grid item xs={12}>
          <TranslationContainerDisplay />
          </Grid>
        </Grid>
      </React.Fragment>
    );
}
