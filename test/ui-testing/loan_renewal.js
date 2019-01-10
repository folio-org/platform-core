/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^type" }] */

const moment = require('moment');

module.exports.test = (uiTestCtx, nightmareX) => {
  describe('Tests to validate the loan renewals', function descRoot() {
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

    const findUserNameCell = (username) => {
      const usernameCell = Array.from(
        document.querySelectorAll('#list-users div[role="listitem"]')
      ).find(e => e.childNodes[0].children[4].textContent === `${username}`);
      usernameCell.querySelector('a').click();
    };

    const tickRenewCheckbox = (fbarcode) => {
      const barcodeCell = Array.from(
        document.querySelectorAll('#list-loanshistory div[role="gridcell"]')
      ).find(e => e.textContent === `${fbarcode}`);
      barcodeCell.parentElement.querySelector('input[type="checkbox"]').click();
    };


    describe('Login > Update settings > Create loan policy > Apply Loan rule > Find Active user > Create inventory record > Create holdings record > Create item record > Checkout item > Confirm checkout > Renew success > Renew failure > Renew failure > create fixedDueDateSchedule > Assign fdds to loan policy > Renew failure > Edit loan policy > Renew failure > Check in > delete loan policy > delete fixedDueDateSchedule > logout\n', function descStart() {
      let userid = 'user';
      const uselector = "#list-users div[role='listitem']:nth-of-type(1) > a > div:nth-of-type(5)";
      const policyName = `test-policy-${Math.floor(Math.random() * 10000)}`;
      const scheduleName = `test-schedule-${Math.floor(Math.random() * 10000)}`;
      const renewalLimit = 1;
      const loanPeriod = 2;
      const nextMonthValue = moment().add(65, 'days').format('YYYY-MM-DD');
      const tomorrowValue = moment().add(3, 'days').format('YYYY-MM-DD');
      const dayAfterValue = moment().add(4, 'days').format('YYYY-MM-DD');
      const debugSleep = parseInt(process.env.FOLIO_UI_DEBUG, 10) ? parseInt(config.debug_sleep, 10) : 0;
      let loanRules = '';

      it(`should login as ${config.username}/${config.password}`, (done) => {
        helpers.login(nightmare, config, done);
      });

      it('should configure checkout for barcode and username', (done) => {
        helpers.circSettingsCheckoutByBarcodeAndUsername(nightmare, config, done);
      });

      it(`should create a new loan policy(${policyName}) with renewalLimit of 1`, (done) => {
        nightmare
          .wait(config.select.settings)
          .click(config.select.settings)
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/loan-policies"]')
          .click('a[href="/settings/circulation/loan-policies"]')
          .wait('#clickable-create-entry')
          .click('#clickable-create-entry')
          .wait('#input_policy_name')
          .type('#input_policy_name', policyName)
          .wait('select[name="loansPolicy.period.intervalId"]')
          .select('select[name="loansPolicy.period.intervalId"]', 'Minutes')
          .wait('input[name="loansPolicy.period.duration"')
          .type('input[name="loansPolicy.period.duration"', loanPeriod)
          .wait('#input_allowed_renewals')
          .type('#input_allowed_renewals', renewalLimit)
          .wait('#select_renew_from')
          .type('#select_renew_from', 'cu')
          .wait('#clickable-save-fixedDueDateSchedule')
          .click('#clickable-save-fixedDueDateSchedule')
          .wait(1000)
          .evaluate(() => {
            const sel = document.querySelector('div[class^="textfieldError"]');
            if (sel) {
              throw new Error(sel.textContent);
            }
          })
          .then(done)
          .catch(done);
      });

      it('Apply the loan policy created as a loan rule to material-type book', (done) => {
        nightmare
          .wait(config.select.settings)
          .click(config.select.settings)
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/loan-rules"]')
          .click('a[href="/settings/circulation/loan-rules"]')
          .wait('#form-loan-rules')
          .wait(1000)
          .evaluate((policy) => {
            loanRules = document.getElementsByClassName('CodeMirror')[0].CodeMirror.getValue();
            const value = `priority: t, s, c, b, a, m, g \nfallback-policy: example-loan-policy \nm book: ${policy}`;
            document.getElementsByClassName('CodeMirror')[0].CodeMirror.setValue(value);
          }, policyName)
          .then(() => {
            nightmare
              .wait('#clickable-save-loan-rules')
              .click('#clickable-save-loan-rules')
              .wait(Math.max(555, debugSleep)); // debugging
            done();
          })
          .catch(done);
      });

      it('should find an active user ', (done) => {
        nightmare
          .wait(1111)
          .click('#clickable-users-module')
          .wait('#input-user-search')
          .type('#input-user-search', '0')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .wait('#clickable-filter-pg-faculty')
          .click('#clickable-filter-pg-faculty')
          .wait(uselector)
          .evaluate(selector => document.querySelector(selector).textContent, uselector)
          .then((result) => {
            done();
            userid = result;
            console.log(`          Found user ${userid}`);
          })
          .catch(done);
      });
      const barcode = helpers.createInventory(nightmare, config, 'Soul station / Hank Mobley');

      it(`should check out ${barcode} to ${userid}`, (done) => {
        nightmare
          .click('#clickable-checkout-module')
          .wait('#input-patron-identifier')
          .type('#input-patron-identifier', userid)
          .wait(111)
          .wait('#clickable-find-patron')
          .click('#clickable-find-patron')
          .wait(() => {
            const err = document.querySelector('#patron-form div[class^="textfieldError"]');
            const yay = document.querySelector('#patron-form ~ div a > strong');
            if (err) {
              throw new Error(err.textContent);
            } else if (yay) {
              return true;
            } else {
              return false;
            }
          })
          .wait(222)
          .wait('#input-item-barcode')
          .insert('#input-item-barcode', barcode)
          .wait(222)
          .wait('#clickable-add-item')
          .click('#clickable-add-item')
          .evaluate(() => {
            const sel = document.querySelector('div[class^="textfieldError"]');
            if (sel) {
              throw new Error(sel.textContent);
            }
          })
          .then(() => {
            nightmare
              .click('#section-item button')
              .wait(Math.max(555, debugSleep)) // debugging
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

      it(`should find ${barcode} in ${userid}'s open loans`, (done) => {
        nightmare
          .click('#clickable-users-module')
          .wait('#input-user-search')
          .type('#input-user-search', '0')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .insert('#input-user-search', userid)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait('#list-users div[role="gridcell"]')
          .evaluate(findUserNameCell, userid)
          .then(() => {
            nightmare
              .wait('#clickable-viewcurrentloans')
              .click('#clickable-viewcurrentloans')
              .wait('#list-loanshistory:not([data-total-count="0"])')
              .wait(findBarcodeCell, barcode)
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

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
              .evaluate((policy) => {
                const errorMsg = document.querySelectorAll('#bulk-renewal-modal div[role="gridcell"]')[0].textContent;
                if (errorMsg === null) {
                  throw new Error('Should throw an error as the renewalLimit is reached');
                } else if (!errorMsg.match('Item not renewedloan has reached its maximum number of renewals')) {
                  throw new Error('Expected only the renewal failure error message');
                }
              }, policyName)
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

      it('Edit loan policy, renew from system date should fail the renewal', (done) => {
        nightmare
          .click(config.select.settings)
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/loan-policies"]')
          .click('a[href="/settings/circulation/loan-policies"]')
          .wait('div.hasEntries')
          .evaluate((pn) => {
            const index = Array.from(
              document.querySelectorAll('#ModuleContainer div.hasEntries a div')
            ).findIndex(e => e.textContent === pn);

            if (index === -1) {
              throw new Error(`Could not find the loan policy ${pn} to edit`);
            }

            // CSS selectors are 1-based, which is just totally awesome.
            return index + 1;
          }, policyName)
          .then((entryIndex) => {
            nightmare
              .wait(`#ModuleContainer div.hasEntries a:nth-of-type(${entryIndex})`)
              .click(`#ModuleContainer div.hasEntries a:nth-of-type(${entryIndex})`)
              .wait('#clickable-edit-item')
              .click('#clickable-edit-item')
              .wait('#input_allowed_renewals')
              .type('#input_allowed_renewals', 2)
              .wait('#select_renew_from')
              .type('#select_renew_from', 'sy')
              .wait('#clickable-save-fixedDueDateSchedule')
              .click('#clickable-save-fixedDueDateSchedule')
              .wait(1000)
              .evaluate(() => {
                const sel = document.querySelector('div[class^="textfieldError"]');
                if (sel) {
                  throw new Error(sel.textContent);
                }
              })
              .then(() => {
                nightmare
                  .wait('#clickable-users-module')
                  .click('#clickable-users-module')
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
                        } else if (!errorMsg.match('Item not renewedrenewal at this time would not change the due date')) {
                          throw new Error('Expected only the renewal failure error message');
                        }
                      })
                      .then(done)
                      .catch(done);
                  })
                  .catch(done);
              })
              .catch(done);
          })
          .catch(done);
      });

      it('should create a new fixedDueDateSchedule', (done) => {
        nightmare
          .wait(config.select.settings)
          .click(config.select.settings)
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/fixed-due-date-schedules"]')
          .click('a[href="/settings/circulation/fixed-due-date-schedules"]')
          .wait('#clickable-create-entry')
          .click('#clickable-create-entry')
          .wait('#input_schedule_name')
          .type('#input_schedule_name', scheduleName)
          .wait('input[name="schedules[0].from"]')
          .insert('input[name="schedules[0].from"]', tomorrowValue)
          .wait('input[name="schedules[0].to"]')
          .insert('input[name="schedules[0].to"]', dayAfterValue)
          .wait('input[name="schedules[0].due"]')
          .insert('input[name="schedules[0].due"]', nextMonthValue)
          .wait('#clickable-save-fixedDueDateSchedule')
          .click('#clickable-save-fixedDueDateSchedule')
          .wait(1000)
          .evaluate(() => {
            const sel = document.querySelector('div[class^="feedbackError"]');
            if (sel) {
              throw new Error(sel.textContent);
            }
          })
          .then(done)
          .catch(done);
      });

      it(`Assign the fixedDueDateSchedule(${scheduleName}) to the loan policy`, (done) => {
        nightmare
          .wait('a[href="/settings/circulation/loan-policies"]')
          .click('a[href="/settings/circulation/loan-policies"]')
          .wait('div.hasEntries')
          .evaluate((pn) => {
            const index = Array.from(
              document.querySelectorAll('#ModuleContainer div.hasEntries a div')
            ).findIndex(e => e.textContent === pn);

            if (index === -1) {
              throw new Error(`Could not find the loan policy ${pn} to edit`);
            }

            // CSS selectors are 1-based, which is just totally awesome.
            return index + 1;
          }, policyName)
          .then((entryIndex) => {
            nightmare
              .wait(`#ModuleContainer div.hasEntries a:nth-of-type(${entryIndex})`)
              .click(`#ModuleContainer div.hasEntries a:nth-of-type(${entryIndex})`)
              .wait('#clickable-edit-item')
              .click('#clickable-edit-item')
              .wait('#input_loan_profile')
              .type('#input_loan_profile', 'fi')
              .wait('#input_loansPolicy_fixedDueDateSchedule')
              .type('#input_loansPolicy_fixedDueDateSchedule', scheduleName)
              .wait('#clickable-save-fixedDueDateSchedule')
              .click('#clickable-save-fixedDueDateSchedule')
              .wait(1000)
              .evaluate(() => {
                const sel = document.querySelector('div[class^="feedbackError"]');
                if (sel) {
                  throw new Error(sel.textContent);
                }
              })
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

      it('Renewal should fail as renewal date falls outside of the date ranges', (done) => {
        nightmare
          .wait(555)
          .wait('#clickable-users-module')
          .click('#clickable-users-module')
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
                } else if (!errorMsg.match('Item not renewedrenewal date falls outside of the date ranges in the loan policy')) {
                  throw new Error('Expected Loan cannot be renewed because: renewal date falls outside of the date ranges in the loan policy error message');
                }
              })
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

      // it('Edit the loan policy to renewalLimit of 1', (done) => {
      //   nightmare
      //     .wait(222)
      //     .xclick('//span[.="Settings"]')
      //     .wait(222)
      //     .xclick('id("ModuleContainer")//a[.="Circulation"]')
      //     .wait(222)
      //     .xclick('id("ModuleContainer")//a[.="Loan policies"]')
      //     .wait(222)
      //     .xclick(`id("ModuleContainer")//a[.="${policyName}"]`)
      //     .wait('#clickable-edit-item')
      //     .click('#clickable-edit-item')
      //     .wait('#input_allowed_renewals')
      //     .evaluate(() => {
      //       document.querySelector('#input_allowed_renewals').value = '';
      //     })
      //     .wait(111)
      //     .type('#input_allowed_renewals', 1)
      //     .xclick('//button[.="Save and close"]')
      //     .wait(1000)
      //     .evaluate(() => {
      //       const sel = document.querySelector('div[class^="textfieldError"]');
      //       if (sel) {
      //         throw new Error(sel.textContent);
      //       }
      //     })
      //     .then(done)
      //     .catch(done);
      // });
      //
      // it('Renew and verify the consolidated error messages', (done) => {
      //   nightmare
      //     .wait(555)
      //     .wait('#clickable-users-module')
      //     .click('#clickable-users-module')
      //     .wait(`div[title="${barcode}"]`)
      //     .evaluate((fbarcode) => {
      //       const ele = document.querySelector(`div[title="${fbarcode}"]`);
      //       ele.parentElement.querySelector('input[type="checkbox"]').click();
      //     }, barcode)
      //     .wait(333)
      //     .wait('button[title="Renew"]')
      //     .click('button[title="Renew"]')
      //     .wait('#renewal-failure-modal')
      //     .evaluate(() => {
      //       const errorMsg = document.querySelector('#renewal-failure-modal > div:nth-of-type(2) > p').innerText;
      //       if (errorMsg === null) {
      //         throw new Error('Should throw an error as the renewalLimit is reached');
      //       } else if (errorMsg !== 'Loan cannot be renewed because: renewal date falls outside of the date ranges in the loan policy and loan has reached its maximum number of renewals.') {
      //         throw new Error('Expected Loan cannot be renewed because: renewal date falls outside of the date ranges in the loan policy and loan has reached its maximum number of renewals.');
      //       }
      //     })
      //     .then(done)
      //     .catch(done);
      // });

      it(`should check in ${barcode}`, (done) => {
        nightmare
          .click('#clickable-checkin-module')
          .wait('#input-item-barcode')
          .insert('#input-item-barcode', barcode)
          .wait('#clickable-add-item')
          .click('#clickable-add-item')
          .wait('#list-items-checked-in')
          .evaluate((fbarcode) => {
            const a = document.querySelector(`#list-items-checked-in div[aria-label*= "Barcode: ${fbarcode}"]`);
            if (a === null) {
              throw new Error('Item barcode not found');
            }
          }, barcode)
          .then(done)
          .catch(done);
      });

      it('should restore the loan rules', (done) => {
        nightmare
          .wait(config.select.settings)
          .click(config.select.settings)
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/loan-rules"]')
          .click('a[href="/settings/circulation/loan-rules"]')
          .wait('#form-loan-rules')
          .wait(1000)
          .evaluate(() => {
            document.getElementsByClassName('CodeMirror')[0].CodeMirror.setValue(loanRules);
          })
          .then(() => {
            nightmare
              .wait('#clickable-save-loan-rules')
              .click('#clickable-save-loan-rules')
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

      it('should delete the loan policy', (done) => {
        nightmare
          .click(config.select.settings)
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/loan-policies"]')
          .click('a[href="/settings/circulation/loan-policies"]')
          .wait('div.hasEntries')
          .evaluate((pn) => {
            const node = Array.from(
              document.querySelectorAll('#ModuleContainer div.hasEntries a div')
            ).find(e => e.textContent === pn);
            if (node) {
              node.parentElement.click();
            } else {
              throw new Error(`Could not find the loan policy ${pn} to edit`);
            }
          }, policyName)
          .then(() => {
            nightmare
              .wait('#clickable-edit-item')
              .click('#clickable-edit-item')
              .wait('#clickable-delete-entry')
              .click('#clickable-delete-entry')
              .wait('#clickable-delete-item-confirmation-confirm')
              .click('#clickable-delete-item-confirmation-confirm')
              .wait(3000)
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

      it('should delete the fixedDueDateSchedule', (done) => {
        nightmare
          .click(config.select.settings)
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/fixed-due-date-schedules"]')
          .click('a[href="/settings/circulation/fixed-due-date-schedules"]')
          .wait('div.hasEntries')
          .wait((sn) => {
            const index = Array.from(
              document.querySelectorAll('#ModuleContainer div.hasEntries a div')
            ).findIndex(e => e.textContent === sn);

            return index >= 0;
          }, scheduleName)
          .evaluate((sn) => {
            const index = Array.from(
              document.querySelectorAll('#ModuleContainer div.hasEntries a div')
            ).findIndex(e => e.textContent === sn);

            if (index === -1) {
              throw new Error(`Could not find the fixed due date schedule ${sn} to delete`);
            }

            // CSS selectors are 1-based, which is just totally awesome.
            return index + 1;
          }, scheduleName)
          .then((entryIndex) => {
            nightmare
              .wait(`#ModuleContainer div.hasEntries a:nth-of-type(${entryIndex})`)
              .click(`#ModuleContainer div.hasEntries a:nth-of-type(${entryIndex})`)
              .wait('#generalInformation')
              .wait('#fixedDueDateSchedule')
              .wait('#clickable-edit-item')
              .click('#clickable-edit-item')
              .wait('#clickable-delete-item')
              .click('#clickable-delete-item')
              .wait('#clickable-deletefixedduedateschedule-confirmation-confirm')
              .click('#clickable-deletefixedduedateschedule-confirmation-confirm')
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
