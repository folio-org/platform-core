// const startPage = require('./100-startpage');
// const authSuccess = require('./110-auth-success');
const authFail = require('./120-auth-fail');
// const calendarTest = require('./calendarTest');
const codexSearch = require('./codex-search');
const dependencies = require('./dependencies');
const exercise = require('./exercise');
// const inventorySearch = require('./inventorySearch');
const loanRenewal = require('./loan_renewal');
const newProxy = require('./new_proxy');
// const location = require('./location');
// const profilePictures = require('./profile-pictures');
// const stub = require('./stub');
// const vendor = require('./vendor');


module.exports.test = (uiTestCtx) => {
  const allTests = [
    // startPage,
    // authSuccess,
    authFail,
    codexSearch,
    dependencies,
    exercise,
    // inventorySearch,
    loanRenewal,
    newProxy
    // location,
    // profilePictures,
    // stub,
    // TODO: Move these. They are not included in platform-core
    // calendarTest,
    // vendor
  ];

  allTests.forEach(testModule => testModule.test(uiTestCtx));
};
