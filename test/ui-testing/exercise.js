/* eslint-disable no-console */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^type" }] */

module.exports.test = (uiTestCtx) => {
  describe('Exercise users, inventory, checkout, checkin, settings ("exercise")', function descRoot() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    this.timeout(Number(config.test_timeout));

    let userBarcode = '';
    let openLoans = -1;
    let closedLoans = -1;

    describe('Login > Update settings > Find user > Create inventory record > Create holdings record > Create item record > Checkout item > Confirm checkout > Checkin > Confirm checkin > Logout\n', function descStart() {
      it(`should login as ${config.username}/${config.password}`, (done) => {
        helpers.login(nightmare, config, done);
      });

      it('should configure checkout for barcode and username', (done) => {
        helpers.circSettingsCheckoutByBarcodeAndUsername(nightmare, config, done);
      });

      it('should navigate to settings', (done) => {
        helpers.clickSettings(nightmare, done);
      });

      let initialRules = '';

      it('should configure circulation rules', (done) => {
        const rules = 'priority: t, s, c, b, a, m, g\nfallback-policy: l one-hour r hold-only n basic-notice-policy o test-overdue i fallback-lost-item-fee-policy \nm book: l example-loan-policy r allow-all n alternate-notice-policy o test-overdue i lost-item-fee-policy';
        helpers.setCirculationRules(nightmare, rules)
          .then(oldRules => {
            initialRules = oldRules;
          })
          .then(done)
          .catch(done);
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
          .wait('#input-user-search')
          .insert('#input-user-search', userBarcode)
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .insert('#input-user-search', userBarcode)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait('#list-users[aria-rowcount="2"]')
          .wait('#list-users a[role="row"][aria-rowindex="2"]')
          .click('#list-users a[role="row"][aria-rowindex="2"]')
          .wait('#clickable-viewcurrentloans')
          .evaluate(() => document.querySelector('#clickable-viewcurrentloans').textContent)
          .then((result) => {
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
            done();
            console.log(`          Closed loans: ${closedLoans}`);
          })
          .catch(done);
      });

      const barcode = helpers.createInventory(nightmare, config, 'Soul station / Hank Mobley');

      it('should navigate to checkout', (done) => {
        helpers.clickApp(nightmare, done, 'checkout', 1000);
      });

      it(`should check out ${barcode}`, (done) => {
        helpers.checkout(nightmare, done, barcode, userBarcode);
      });

      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users', 1000);
      });

      it('should change open-loan count', (done) => {
        nightmare
          .wait('#input-user-search')
          .insert('#input-user-search', userBarcode)
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .wait(1000)
          .insert('#input-user-search', userBarcode)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait(1000)
          .wait('#list-users[aria-rowcount="2"]')
          .wait('#list-users a[role="row"][aria-rowindex="2"]')
          .click('#list-users a[role="row"][aria-rowindex="2"]')
          .wait('#clickable-viewcurrentloans')
          .evaluate(() => document.querySelector('#clickable-viewcurrentloans').textContent)
          .then((result) => {
            if (Number(result.replace(/^(\d+).*/, '$1')) !== openLoans + 1) {
              throw new Error('Open loan count did not change.');
            }
            done();
          })
          .catch(done);
      });

      it(`should find ${barcode} in open loans`, (done) => {
        nightmare
          .wait('#clickable-viewcurrentloans')
          .click('#clickable-viewcurrentloans')
          .wait(bc => {
            return !!(Array.from(document.querySelectorAll('#list-loanshistory [role="gridcell"]'))
              .find(e => e.textContent === `${bc}`));
          }, barcode)
          .wait('#users-module-display button[icon="times"][class*="iconButton"]')
          .click('#users-module-display button[icon="times"][class*="iconButton"]')
          .wait('#pane-userdetails')
          .then(done)
          .catch(done);
      });

      it('should navigate to checkin', (done) => {
        helpers.clickApp(nightmare, done, 'checkin');
      });

      it(`should check in ${barcode}`, (done) => {
        nightmare
          .wait('#input-item-barcode')
          .insert('#input-item-barcode', barcode)
          .wait('#clickable-add-item')
          .click('#clickable-add-item')
          .wait('#list-items-checked-in')
          .wait(bc => {
            return !!(Array.from(document.querySelectorAll('#list-items-checked-in [role="gridcell"]'))
              .find(e => e.textContent === `${bc}`));
          }, barcode)
          .wait('#clickable-end-session')
          .click('#clickable-end-session')
          .wait(() => {
            return !document.querySelector('#list-items-checked-in');
          })
          .then(done)
          .catch(done);
      });

      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users', 2000);
      });

      it('should change closed-loan count', (done) => {
        nightmare
          .wait('#pane-userdetails')
          .wait('#clickable-viewclosedloans')
          .evaluate(() => document.querySelector('#clickable-viewclosedloans').textContent)
          .then((result) => {
            if (Number(result.replace(/^(\d+).*/, '$1')) !== closedLoans + 1) {
              throw new Error('Close loan count did not change.');
            }
            done();
          })
          .catch(done);
      });

      it(`should confirm ${barcode} in closed loans`, (done) => {
        nightmare
          .wait('#clickable-viewclosedloans')
          .click('#clickable-viewclosedloans')
          .wait(bc => {
            return !!(Array.from(document.querySelectorAll('#list-loanshistory [role="gridcell"]'))
              .find(e => e.textContent === `${bc}`));
          }, barcode)
          .wait('#users-module-display button[icon="times"][class*="iconButton"]')
          .click('#users-module-display button[icon="times"][class*="iconButton"]')
          .wait(parseInt(process.env.FOLIO_UI_DEBUG, 10) ? parseInt(config.debug_sleep, 10) : 555) // debugging
          .then(done)
          .catch(done);
      });

      it('should navigate to settings', (done) => {
        helpers.clickSettings(nightmare, done);
      });

      it('should restore the circulation rules', (done) => {
        helpers.setCirculationRules(nightmare, initialRules)
          .then(() => done())
          .catch(done);
      });

      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
