/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^type" }] */

const moment = require('moment');

module.exports.test = (uiTestCtx) => {
  describe('Tests to validate the loan renewals ("loan-renewal")', function descRoot() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    this.timeout(Number(config.test_timeout));

    // note the comparison uses string interpolation because we want to
    // force string context and barcodes may appear numeric.
    const findBarcodeCell = (fbarcode) => {
      return !!(Array.from(
        document.querySelectorAll('#list-loanshistory div[role="gridcell"]')
      ).find(e => e.textContent === `${fbarcode}`));
    };

    const tickRenewCheckbox = (fbarcode) => {
      const barcodeCell = Array.from(
        document.querySelectorAll('#list-loanshistory div[role="gridcell"]')
      ).find(e => e.textContent === `${fbarcode}`);
      barcodeCell.parentElement.querySelector('input[type="checkbox"]').click();
    };

    let initialRules = '';
    let userid = 'user';
    const policyName = `test-policy-${Math.floor(Math.random() * 10000)}`;
    const scheduleName = `test-schedule-${Math.floor(Math.random() * 10000)}`;
    const noticePolicyName = `test-notice-policy-${Math.floor(Math.random() * 10000)}`;
    // const requestPolicyName = `test-request-policy-${Math.floor(Math.random() * 10000)}`;
    const requestPolicyName = 'allow-all';
    const overdueFinePolicyName = `test-overdue-fine-policy-${Math.floor(Math.random() * 10000)}`;
    const lostItemFeePolicyName = `test-lost-item-fee-policy-${Math.floor(Math.random() * 10000)}`;

    const renewalLimit = 1;
    const loanPeriod = 2;

    // note the format MUST match that expected by the locale
    // otherwise the fixed-due-date-schedule dates will not register
    const nextMonthValue = moment()
      .add(65, 'days')
      .format('MM/DD/YYYY');
    const tomorrowValue = moment()
      .add(3, 'days')
      .format('MM/DD/YYYY');
    const dayAfterValue = moment()
      .add(4, 'days')
      .format('MM/DD/YYYY');
    let barcode = '';

    describe('Login', () => {
      it(`should login as ${config.username}/${config.password}`, (done) => {
        helpers.login(nightmare, config, done);
      });
    });

    describe('Update settings', () => {
      it('should navigate to settings', (done) => {
        helpers.clickSettings(nightmare, done);
      });

      it('should configure checkout for barcode and username', (done) => {
        helpers.circSettingsCheckoutByBarcodeAndUsername(nightmare, config, done);
      });

      it('should configure US English locale and timezone', (done) => {
        helpers.setUsEnglishLocale(nightmare, config, done);
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

      describe('addLoanPolicy', function foo() {
        helpers.addLoanPolicy(nightmare, policyName, loanPeriod, renewalLimit);
      });

      // describe('addRequestPolicy', function foo() {
      //   helpers.addRequestPolicy(nightmare, requestPolicyName);
      // });

      describe('Create fixed due date schedule', () => {
        helpers.addFixedDueDateSchedule(nightmare, scheduleName, tomorrowValue, dayAfterValue, nextMonthValue);
      });

      describe('it should configure circulation rules', function foo() {
        it('set new rules circulation rules', (done) => {
          const rules = `priority: t, s, c, b, a, m, g \nfallback-policy: l example-loan-policy r ${requestPolicyName} n ${noticePolicyName} o ${overdueFinePolicyName} i ${lostItemFeePolicyName}\nm book: l ${policyName} r ${requestPolicyName} n ${noticePolicyName} o ${overdueFinePolicyName} i ${lostItemFeePolicyName}`;
          helpers.setCirculationRules(nightmare, rules)
            .then(oldRules => {
              initialRules = oldRules;
            })
            .then(done)
            .catch(done);
        });
      });
    });

    describe('Find Active user', () => {
      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users');
      });

      it('should find an active user ', (done) => {
        helpers.findActiveUserBarcode(nightmare, 'faculty')
          .then(bc => {
            done();
            console.log(`\t    Found user ${bc}`);
            userid = bc;
          })
          .catch(done);
      });
    });

    describe(
      'Create inventory > holdings > item records',
      () => {
        barcode = helpers.createInventory(nightmare, config, 'Soul station / Hank Mobley');
      }
    );

    describe('Checkout item', () => {
      // if we don't wait a second after creating the item record,
      // we seem to get stuck there and cannot navigate to checkout.
      // does this make any sense at all? no. no it does not. and yet.
      it('should navigate to checkout', (done) => {
        helpers.clickApp(nightmare, done, 'checkout', 1000);
      });

      it(`should check out ${barcode} to ${userid}`, (done) => {
        helpers.checkout(nightmare, done, barcode, userid);
      });
    });

    describe('Confirm checkout', () => {
      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users');
      });

      it(`should find ${barcode} in ${userid}'s open loans`, (done) => {
        nightmare
          .wait('#input-user-search')
          .type('#input-user-search', '0')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .insert('#input-user-search', userid)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait('#list-users[data-total-count="1"] [role=rowgroup] a[data-row-inner]')
          .click('#list-users[data-total-count="1"] [role=rowgroup] a[data-row-inner]')
          .wait('#clickable-viewcurrentloans')
          .click('#clickable-viewcurrentloans')
          .wait('#list-loanshistory:not([data-total-count="0"])')
          .wait(findBarcodeCell, barcode)
          .then(done)
          .catch(done);
      });
    });

    describe('Renew success', () => {
      it('should renew the loan and succeed', (done) => {
        nightmare
          .wait('#list-loanshistory')
          .wait(findBarcodeCell, barcode)
          .evaluate(tickRenewCheckbox, barcode)
          .then(() => {
            nightmare
              .wait('#renew-all')
              .click('#renew-all')
              .wait('div[class^="calloutBase"]')
              .then(done)
              .catch(done);
          })
          .catch(done);
      });
    });

    describe('Renew failure', () => {
      it('should renew the loan second time and hit the renewal limit', (done) => {
        nightmare
          .wait('#list-loanshistory')
          .wait(findBarcodeCell, barcode)
          .evaluate(tickRenewCheckbox, barcode)
          .then(() => {
            nightmare
              .wait('#renew-all')
              .click('#renew-all')
              .wait('#bulk-renewal-modal')
              .wait(333)
              .evaluate(() => {
                const errorMsg = document.querySelectorAll('#bulk-renewal-modal [role="gridcell"]')[0].textContent;
                if (errorMsg === null) {
                  throw new Error('Should throw an error as the renewalLimit is reached');
                } else if (!errorMsg.match('Item not renewed:loan at maximum renewal number')) {
                  throw new Error('Expected only the renewal failure error message');
                }
              }, policyName)
              .then(done)
              .catch(done);
          })
          .catch(done);
      });
    });

    describe('Renew failure', () => {
      it('should navigate to settings', (done) => {
        helpers.clickSettings(nightmare, done);
      });

      it('should reach "loan policy settings" page', (done) => {
        nightmare
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/loan-policies"]')
          .click('a[href="/settings/circulation/loan-policies"]')
          .then(done)
          .catch(done);
      });

      it('edit loan policy to renew from system date', (done) => {
        nightmare
          .wait('div.hasEntries')
          .evaluate((pn) => {
            const index = Array.from(
              document.querySelectorAll('#ModuleContainer div.hasEntries a[class^=NavListItem]')
            )
              .findIndex(e => e.textContent === pn);

            if (index === -1) {
              throw new Error(`Could not find the loan policy ${pn} to edit`);
            }

            // CSS selectors are 1-based, which is just totally awesome.
            return index + 1;
          }, policyName)
          .then((entryIndex) => {
            nightmare
              .wait(`#ModuleContainer div.hasEntries div:nth-of-type(${entryIndex}) a[class^=NavListItem]`)
              .click(`#ModuleContainer div.hasEntries div:nth-of-type(${entryIndex}) a[class^=NavListItem]`)
              .wait('#dropdown-clickable-edit-item')
              .click('#dropdown-clickable-edit-item')
              .wait('#input_allowed_renewals')
              .type('#input_allowed_renewals', 2)
              .wait('#select_renew_from')
              .select('#select_renew_from', 'SYSTEM_DATE')
              .wait('#footer-save-entity')
              .click('#footer-save-entity')
              .wait(1000)
              .evaluate(() => {
                const sel = document.querySelector('div[class^="textfieldError"]');
                if (sel) {
                  throw new Error(sel.textContent);
                }
              })
              .wait(() => !document.querySelector('#footer-save-entity'))
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users', 1000);
      });

      it('should fail the renewal', (done) => {
        nightmare
          .wait(findBarcodeCell, barcode)
          .evaluate(tickRenewCheckbox, barcode)
          .then(() => {
            nightmare
              .wait('#renew-all')
              .click('#renew-all')
              .wait('#bulk-renewal-modal')
              .wait(1000)
              .evaluate(() => {
                const expectedMessage = 'Item not renewed:renewal would not change the due date';
                const errorMsg = document.querySelectorAll('#bulk-renewal-modal div[role="gridcell"]')[0].textContent;
                if (errorMsg === null) {
                  throw new Error('Should throw an error as the renewalLimit is reached');
                } else if (!errorMsg.match(expectedMessage)) {
                  throw new Error(`Expected "${expectedMessage}"; got "${errorMsg}"`);
                }
              })
              .then(done)
              .catch(done);
          })
          .catch(done);
      });
    });

    describe('Assign fixed due date schedule to loan policy', () => {
      it('should navigate to settings', (done) => {
        helpers.clickSettings(nightmare, done);
      });

      it(`assign the fixed due date schedule (${scheduleName}) to the loan policy`, (done) => {
        nightmare
          .wait('a[href="/settings/circulation/loan-policies"]')
          .click('a[href="/settings/circulation/loan-policies"]')
          .wait('div.hasEntries')
          .evaluate((pn) => {
            const index = Array.from(
              document.querySelectorAll('#ModuleContainer div.hasEntries a[class^=NavListItem]')
            )
              .findIndex(e => e.textContent === pn);

            if (index === -1) {
              throw new Error(`Could not find the loan policy ${pn} to edit`);
            }

            // CSS selectors are 1-based, which is just totally awesome.
            return index + 1;
          }, policyName)
          .then((entryIndex) => {
            nightmare
              .wait(`#ModuleContainer div.hasEntries div:nth-of-type(${entryIndex}) a[class^=NavListItem]`)
              .click(`#ModuleContainer div.hasEntries div:nth-of-type(${entryIndex}) a[class^=NavListItem]`)
              .wait('#dropdown-clickable-edit-item')
              .click('#dropdown-clickable-edit-item')
              .wait('#input_loan_profile')
              .type('#input_loan_profile', 'fi')
              .wait('#input_loansPolicy_fixedDueDateSchedule')
              .type('#input_loansPolicy_fixedDueDateSchedule', scheduleName)
              .wait('select[name="loansPolicy.closedLibraryDueDateManagementId"]')
              .type('select[name="loansPolicy.closedLibraryDueDateManagementId"]', 'keep')
              .wait('#footer-save-entity')
              .click('#footer-save-entity')
              .wait(1000)
              .evaluate(() => {
                const sel = document.querySelector('div[class^="feedbackError"]');
                if (sel) {
                  throw new Error(sel.textContent);
                }
              })
              .wait(() => !document.querySelector('#footer-save-entity'))
              .then(done)
              .catch(done);
          })
          .catch(done);
      });
    });

    describe('Renew failure', () => {
      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users', 555);
      });

      it('Renewal should fail as renewal date falls outside of the date ranges', (done) => {
        nightmare
          .wait(findBarcodeCell, barcode)
          .evaluate(tickRenewCheckbox, barcode)
          .then(() => {
            nightmare
              .wait('#renew-all')
              .click('#renew-all')
              .wait('#bulk-renewal-modal')
              .evaluate(() => {
                const errorMsg = document.querySelectorAll('#bulk-renewal-modal div[role="gridcell"]')[0].textContent;
                if (errorMsg === null) {
                  throw new Error('Should throw an error as the renewalLimit is reached');
                } else if (!errorMsg.match('Item not renewed:renewal date falls outside of date ranges in fixed loan policy')) {
                  throw new Error('Expected Loan cannot be renewed because: renewal date falls outside of the date ranges in the loan policy error message');
                }
              })
              .then(done)
              .catch(done);
          })
          .catch(done);
      });
    });

    describe('Check in', () => {
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
            return !!(Array.from(document.querySelectorAll('#list-items-checked-in div[role="gridcell"]'))
              .find(e => e.textContent === `${bc}`));
          }, barcode)
          .wait(1000)
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

      describe('remove Loan Policy', () => {
        helpers.removeLoanPolicy(nightmare, policyName);
      });

      describe('remove Fixed Due Date schedule', () => {
        helpers.removeFixedDueDateSchedule(nightmare, scheduleName);
      });
    });

    describe('logout', () => {
      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
