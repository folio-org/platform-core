/* eslint-disable no-console */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^type" }] */

module.exports.test = (uiTestCtx) => {
  describe('Exercise users, inventory, checkout, checkin, settings ("exercise")', function descRoot() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    this.timeout(Number(config.test_timeout));


    describe('Login > Update settings > Find user > Create inventory record > Create holdings record > Create item record > Checkout item > Confirm checkout > Checkin > Confirm checkin > Logout\n', function descStart() {
      let userBarcode;
      let openLoans;
      let closedLoans;

      it(`should login as ${config.username}/${config.password}`, (done) => {
        helpers.login(nightmare, config, done);
      });

      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users');
      });

      it('should find an active user', (done) => {
        helpers.findActiveUserBarcode(nightmare, 'faculty')
          .then(bc => {
            done();
            console.log(`\t    Found user ${bc}`);
            userBarcode = bc;
          })
          .catch(done);
      });

      it('should find current loans count', (done) => {
        nightmare
          .wait('#ModuleMainHeading')
          .click('#ModuleMainHeading')
          .wait('#input-user-search')
          .insert('#input-user-search', userBarcode)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait('#list-users[aria-rowcount="2"]')
          .wait('#list-users a[data-row-inner="0"]')
          .click('#list-users a[data-row-inner="0"]')
          .wait('#clickable-viewcurrentloans')
          .evaluate(() => document.querySelector('#clickable-viewcurrentloans').textContent)
          .then((result) => {
            console.log(result);
            openLoans = Number(result.replace(/^(\d+).*/, '$1'));
            done();
            console.log(`          Open loans: ${openLoans}`);
          })
          .catch(done);
      });

      it('should find closed loans count', (done) => {
        nightmare
          .wait(222)
          .evaluate(() => document.querySelector('#clickable-viewclosedloans').textContent)
          .then((result) => {
            closedLoans = Number(result.replace(/^(\d+).*/, '$1'));
            console.log(result);
            done();
            console.log(`          Closed loans: ${closedLoans}`);
          })
          .catch(done);
      });

      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
