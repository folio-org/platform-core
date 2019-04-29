/* eslint-disable no-console */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^type" }] */

module.exports.test = (uiTestCtx) => {
  describe('Exercise users, inventory, checkout, checkin, settings ("exercise")', function descRoot() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    this.timeout(Number(config.test_timeout));

    let username = '';
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

      let initialRules = '';
      it('should configure default circulation rules', (done) => {
        nightmare
          .wait(config.select.settings)
          .click(config.select.settings)
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/rules"]')
          .click('a[href="/settings/circulation/rules"]')
          .wait('#form-loan-rules')
          .wait(1000)
          .evaluate(() => {
            const defaultRules = document.getElementsByClassName('CodeMirror')[0].CodeMirror.getValue();
            const value = 'priority: t, s, c, b, a, m, g\nfallback-policy: l one-hour r hold-only n basic-notice-policy \nm book: l example-loan-policy r allow-all n alternate-notice-policy';
            document.getElementsByClassName('CodeMirror')[0].CodeMirror.setValue(value);
            return defaultRules;
          })
          .then((rules) => {
            nightmare
              .wait('#clickable-save-loan-rules')
              .click('#clickable-save-loan-rules')
              .then(done)
              .catch(done);
            initialRules = rules;
          })
          .catch(done);
      });

      it('should find an active user', (done) => {
        nightmare
          .wait('#clickable-users-module')
          .click('#clickable-users-module')
          .wait('#clickable-filter-active-active')
          .click('#clickable-filter-active-active')
          .wait('#clickable-filter-pg-faculty')
          .click('#clickable-filter-pg-faculty')
          .wait('#list-users:not([data-total-count="0"])')
          .wait('#list-users div[role="row"][aria-rowindex="2"]')
          .evaluate(() => {
            const ubc = [];
            const list = document.querySelectorAll('#list-users div[role="row"]');
            list.forEach((node) => {
              const status = node.querySelector('div:nth-child(1)').innerText;
              const barcode = node.querySelector('div:nth-child(3)').innerText;
              const un = node.querySelector('div:nth-child(5)').innerText;
              const anchor = node.querySelector('a');
              if (anchor && barcode && RegExp(/^\d+$/).test(barcode) && status.match(/Active/)) {
                const uuid = anchor.href.replace(/.+?([^/]+)\?.*/, '$1');
                ubc.push({
                  barcode,
                  uuid,
                  username: un,
                });
              }
            });
            return ubc;
          })
          .then((result) => {
            done();
            username = result[0].username;
            userBarcode = result[0].barcode;
            console.log(`          Found user ${username}/${userBarcode}`);
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
          .wait('#list-users[data-total-count="1"]')
          .wait('#list-users div[role="row"][aria-rowindex="2"] > a')
          .click('#list-users div[role="row"][aria-rowindex="2"] > a')
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

      it(`should check out ${barcode}`, (done) => {
        nightmare
          .wait(1111)
          .wait('#clickable-checkout-module')
          .click('#clickable-checkout-module')
          .wait('#input-patron-identifier')
          .type('#input-patron-identifier', userBarcode)
          .wait(1000)
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
          .wait('#input-item-barcode')
          .type('#input-item-barcode', barcode)
          .wait('#clickable-add-item')
          .click('#clickable-add-item')
          .wait(bc => {
            return !!(Array.from(document.querySelectorAll('#list-items-checked-out div[role="row"] div[role="gridcell"]'))
              .find(e => `${bc}` === e.textContent)); // `${}` forces string interpolation for numeric barcodes
          }, barcode)
          .then(done)
          .catch(e => {
            console.error(e);
            done();
          });
      });

      it('should change open-loan count', (done) => {
        nightmare
          .wait(1111)
          .wait('#clickable-users-module')
          .click('#clickable-users-module')
          .wait('#input-user-search')
          .insert('#input-user-search', userBarcode)
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .insert('#input-user-search', userBarcode)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait('#list-users[data-total-count="1"]')
          .wait('#list-users div[role="row"][aria-rowindex="2"] > a')
          .click('#list-users div[role="row"][aria-rowindex="2"] > a')
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
            return !!(Array.from(document.querySelectorAll('#list-loanshistory div[role="gridcell"]'))
              .find(e => e.textContent === `${bc}`));
          }, barcode)
          .wait('div[class*="LayerRoot"] button[icon="times"][class*="iconButton"]')
          .click('div[class*="LayerRoot"] button[icon="times"][class*="iconButton"]')
          .wait(parseInt(process.env.FOLIO_UI_DEBUG, 10) ? parseInt(config.debug_sleep, 10) : 555) // debugging
          .then(done)
          .catch(done);
      });

      it(`should check in ${barcode}`, (done) => {
        nightmare
          .wait('#clickable-checkin-module')
          .click('#clickable-checkin-module')
          .wait('#input-item-barcode')
          .insert('#input-item-barcode', barcode)
          .wait('#clickable-add-item')
          .click('#clickable-add-item')
          .wait('#list-items-checked-in')
          .wait(bc => {
            return !!(Array.from(document.querySelectorAll('#list-items-checked-in div[role="gridcell"]'))
              .find(e => e.textContent === `${bc}`));
          }, barcode)
          .then(done)
          .catch(done);
      });

      it('should change closed-loan count', (done) => {
        nightmare
          .wait('#clickable-users-module')
          .click('#clickable-users-module')
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
            return !!(Array.from(document.querySelectorAll('#list-loanshistory div[role="gridcell"]'))
              .find(e => e.textContent === `${bc}`));
          }, barcode)
          .wait('div[class*="LayerRoot"] button[icon="times"][class*="iconButton"]')
          .click('div[class*="LayerRoot"] button[icon="times"][class*="iconButton"]')
          .wait(parseInt(process.env.FOLIO_UI_DEBUG, 10) ? parseInt(config.debug_sleep, 10) : 555) // debugging
          .then(done)
          .catch(done);
      });

      it('should restore initial circulation rules', (done) => {
        nightmare
          .wait(config.select.settings)
          .click(config.select.settings)
          .wait('a[href="/settings/circulation"]')
          .click('a[href="/settings/circulation"]')
          .wait('a[href="/settings/circulation/rules"]')
          .click('a[href="/settings/circulation/rules"]')
          .wait('#form-loan-rules')
          .wait(1000)
          .evaluate((r) => {
            document.getElementsByClassName('CodeMirror')[0].CodeMirror.setValue(r);
            return r;
          }, initialRules)
          .then(() => {
            nightmare
              .wait('#clickable-save-loan-rules')
              .click('#clickable-save-loan-rules')
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
