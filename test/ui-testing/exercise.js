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

    let initialRules = '';
    const overdueFinePolicyName = `test-overdue-fine-policy-${Math.floor(Math.random() * 10000)}`;
    const lostItemFeePolicyName = `test-lost-item-policy-${Math.floor(Math.random() * 10000)}`;
    const noticePolicyName = `test-notice-policy-${Math.floor(Math.random() * 10000)}`;

    describe('Login > Update settings > Find user > Create inventory record > Create holdings record > Create item record > Checkout item > Confirm checkout > Checkin > Confirm checkin > Logout\n', function descStart() {
      it(`should login as ${config.username}/${config.password}`, (done) => {
        helpers.login(nightmare, config, done);
      });

      describe('it should configure settings', () => {
        it('should navigate to settings', (done) => {
          helpers.clickSettings(nightmare, done);
        });

        it('should configure checkout for barcode and username', (done) => {
          helpers.circSettingsCheckoutByBarcodeAndUsername(nightmare, config, done);
        });

        describe('addOverdueFinePolicy', function foo() {
          helpers.addOverdueFinePolicy(nightmare, overdueFinePolicyName);
        });

        describe('addLostItemFeePolicy', function foo() {
          helpers.addLostItemFeePolicy(nightmare, lostItemFeePolicyName, 10, 'm');
        });

        describe('addNoticePolicy', function foo() {
          helpers.addNoticePolicy(nightmare, noticePolicyName);
        });

        describe('it should configure circulation rules', function foo() {
          it('set new rules circulation rules', (done) => {
            const rules = `priority: t, s, c, b, a, m, g\nfallback-policy: l one-hour r hold-only n ${noticePolicyName} o ${overdueFinePolicyName} i ${lostItemFeePolicyName} \nm book: l example-loan-policy r allow-all n ${noticePolicyName} o ${overdueFinePolicyName} i ${lostItemFeePolicyName} `;
            helpers.setCirculationRules(nightmare, rules)
              .then(oldRules => {
                initialRules = oldRules;
              })
              .then(done)
              .catch(done);
          });
        });
      });

      describe('exercise loans', function foo() {
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
            .wait('#ModuleMainHeading')
            .click('#ModuleMainHeading')
            .insert('#input-user-search', userBarcode)
            .wait('button[type=submit]')
            .click('button[type=submit]')
            .wait('#list-users[aria-rowcount="2"]')
            .wait('#list-users a[data-row-inner="0"]')
            .click('#list-users a[data-row-inner="0"]')
            .wait('#clickable-viewcurrentloans')
            .evaluate(() => document.querySelector('#clickable-viewcurrentloans').textContent)
            .then((result) => {
              if (Number(result.replace(/^(\d+).*/, '$1')) !== openLoans + 1) {
                throw new Error('Open loan count did not change.');
              }
            })
            .then(done)
            .catch(done);
        });

        it(`should find ${barcode} in open loans`, (done) => {
          nightmare
            // here's a fun game to play! This test has been passing for weeks
            // but now it's broken! A selector in the it-block above already
            // establishes that #clickable-viewcurrentloans is present on the
            // page, but unless we pause than then wait for it here, NOTHING
            // happens when you click it! Isn't that a fun game boys and girls?
            .wait(1000)
            .wait('#clickable-viewcurrentloans')
            .click('#clickable-viewcurrentloans')
            .wait('#list-loanshistory [role="gridcell"]')
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
      });

      describe('it should restore settings', () => {
        it('should navigate to settings', (done) => {
          helpers.clickSettings(nightmare, done);
        });

        it('should restore the circulation rules', (done) => {
          helpers.setCirculationRules(nightmare, initialRules)
            .then(() => done())
            .catch(done);
        });

        describe('remove Overdue Fine Policy', function foo() {
          helpers.removeOverdueFinePolicy(nightmare, overdueFinePolicyName);
        });

        describe('remove Lost Item Fee Policy', function foo() {
          helpers.removeLostItemFeePolicy(nightmare, lostItemFeePolicyName);
        });

        describe('remove Notice Policy', function foo() {
          helpers.removeNoticePolicy(nightmare, noticePolicyName);
        });
      });
    });

    describe('it should log out', () => {
      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
