// const startPage = require('./start-page');
// const authSuccess = require('./auth-success');
const authFail = require('./auth-fail');
// const calendarTest = require('./calendar');
const codexSearch = require('./codex-search');
const dependencies = require('./dependencies');
const exercise = require('./exercise');
// const inventorySearch = require('./inventory-search');
const loanRenewal = require('./loan-renewal');
const newProxy = require('./new-proxy');
const newRequest = require('./new-request');
const manyItems = require('./many-items');
// const location = require('./location');
// const profilePictures = require('./profile-pictures');
// const stub = require('./stub');
// const vendor = require('./vendor');


module.exports.test = (uiTestCtx, nightmare) => {
  const allTests = [
    // startPage,
    // authSuccess,
    authFail,
    codexSearch,
    dependencies,
    exercise,
    manyItems,
    // inventorySearch,
    loanRenewal,
    newProxy,
    newRequest
    // location,
    // profilePictures,
    // stub,
    // TODO: Move these. They are not included in platform-core
    // calendarTest,
    // vendor
  ];

  allTests.forEach(testModule => testModule.test(uiTestCtx, nightmare));
};
