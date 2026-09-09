// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  buildNumber: require('../../package.json').version + '-dev',
  production: true,
  uas_front: '',
  backend:'',
  OrderManagement:'',
  backendINV: '',
  DemandsManagement: '',
};


