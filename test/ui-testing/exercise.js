/* eslint-disable no-console */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^type" }] */

module.exports.test = (uiTestCtx) => {
  describe('Exercise users, inventory, checkout, checkin, settings ("test-exercise")', function descRoot() {
    const { config, helpers } = uiTestCtx;
    this.timeout(Number(config.test_timeout));
    const nightmare = new Nightmare(config.nightmare);

    describe('Login > Update settings > Find user > Create inventory record > Create holdings record > Create item record > Checkout item > Confirm checkout > Checkin > Confirm checkin > Logout\n', function descStart() {
      let userid = '';
      let userBarcode = '';
      let openLoans = -1;
      let closedLoans = -1;

      it(`should login as ${config.username}/${config.password}`, (done) => {
        helpers.login(nightmare, config, done);
      });

      it('should configure checkout for barcode and username', (done) => {
        helpers.circSettingsCheckoutByBarcodeAndUsername(nightmare, config, done);
      });

      it('should find an active user ', (done) => {
        nightmare
          .click('#clickable-users-module')
          .wait('#clickable-filter-pg-faculty')
          .click('#clickable-filter-pg-faculty')
          .wait('#list-users:not([data-total-count="0"])')
          .wait('#list-users div[role="listitem"]:nth-child(1)')
          .evaluate(() => {
            const ubc = [];
            const list = document.querySelectorAll('#list-users div[role="listitem"]');
            list.forEach((node) => {
              const status = node.querySelector('a div:nth-child(1)').innerText;
              const barcode = node.querySelector('a div:nth-child(3)').innerText;
              const username = node.querySelector('a div:nth-child(5)').innerText;
              const uuid = node.querySelector('a').href.replace(/.+?([^/]+)\?.*/, '$1');
              if (barcode && status.match(/Active/)) {
                ubc.push({
                  barcode,
                  uuid,
                  username,
                });
              }
            });
            return ubc;
          })
          .then((result) => {
            userid = result[0].username;
            userBarcode = result[0].barcode;
            done();
            console.log(`          Found user ${userid}/${userBarcode}`);
          })
          .catch(done);
      });

      it(`should find current loans count for ${userid}/${userBarcode}`, (done) => {
        nightmare
          .click(`#list-users a[aria-label*="Username: ${userid}"]`)
          .wait('#clickable-viewcurrentloans')
          .evaluate(() => document.querySelector('#clickable-viewcurrentloans').textContent)
          .then((result) => {
            openLoans = Number(result.replace(/^(\d+).*/, '$1'));
            done();
            console.log(`          Open loans: ${openLoans}`);
          })
          .catch(done);
      });

      it(`should find closed loans count for ${userid}`, (done) => {
        nightmare
          .evaluate(() => document.querySelector('#clickable-viewclosedloans').textContent)
          .then((result) => {
            closedLoans = Number(result.replace(/^(\d+).*/, '$1'));
            done();
            console.log(`          Closed loans: ${closedLoans}`);
          })
          .catch(done);
      });

      const barcode = helpers.createInventory(nightmare, config, 'Soul station / Hank Mobley');

      it(`should check out ${barcode} to ${userid}`, (done) => {
        nightmare
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
          .wait(`#list-items-checked-out div[aria-label*="Barcode: ${barcode}"]`)
          .then(done)
          .catch(e => {
            console.error(e);
            done();
          });
      });

      it('should change open-loan count', (done) => {
        nightmare
          .click('#clickable-users-module')
          .wait('#input-user-search')
          .insert('#input-user-search', userid)
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .insert('#input-user-search', userid)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait(`#list-users a[aria-label*="Barcode: ${userBarcode}"]`)
          .click(`#list-users a[aria-label*="Barcode: ${userBarcode}"]`)
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

      it(`should find ${barcode} in ${userid}'s open loans`, (done) => {
        nightmare
          .click('#clickable-users-module')
          .wait('#input-user-search')
          .insert('#input-user-search', userid)
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .insert('#input-user-search', userid)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait(`#list-users a[aria-label*="${userid}"]`)
          .click(`#list-users a[aria-label*="${userid}"]`)
          .wait('#clickable-viewcurrentloans')
          .click('#clickable-viewcurrentloans')
          .wait((fbarcode) => {
            const element = document.evaluate(`id("list-loanshistory")//div[.="${fbarcode}"]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (element.singleNodeValue) {
              return true;
            } else {
              return false;
            }
          }, barcode)
          .wait('div[class*="LayerRoot"] button[class*="paneHeaderCloseIcon"]')
          .click('div[class*="LayerRoot"] button[class*="paneHeaderCloseIcon"]')
          .wait(parseInt(process.env.FOLIO_UI_DEBUG, 10) ? parseInt(config.debug_sleep, 10) : 555) // debugging
          .then(done)
          .catch(done);
      });

      it(`should check in ${barcode}`, (done) => {
        nightmare
          .click('#clickable-checkin-module')
          .wait('#input-item-barcode')
          .insert('#input-item-barcode', barcode)
          .wait('#clickable-add-item')
          .click('#clickable-add-item')
          .wait('#list-items-checked-in')
          .evaluate(() => {
            const a = document.querySelector('#list-items-checked-in div[aria-label*="Status: Available"]');
            if (a === null) {
              throw new Error("Checkin did not return 'Available' status");
            }
          })
          .then(done)
          .catch(done);
      });

      it('should change closed-loan count', (done) => {
        nightmare
          .click('#clickable-users-module')
          .wait('#input-user-search')
          .insert('#input-user-search', userid)
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .insert('#input-user-search', userid)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait(`#list-users a[aria-label*="Barcode: ${userBarcode}"]`)
          .click(`#list-users a[aria-label*="Barcode: ${userBarcode}"]`)
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

      it(`should confirm ${barcode} in ${userid}'s closed loans`, (done) => {
        nightmare
          .wait('#clickable-viewclosedloans')
          .click('#clickable-viewclosedloans')
          .wait((fbarcode) => {
            const element = document.evaluate(`id("list-loanshistory")//div[.="${fbarcode}"]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (element.singleNodeValue) {
              return true;
            } else {
              return false;
            }
          }, barcode)
          .wait('div[class*="LayerRoot"] button[class*="paneHeaderCloseIcon"]')
          .click('div[class*="LayerRoot"] button[class*="paneHeaderCloseIcon"]')
          .wait(parseInt(process.env.FOLIO_UI_DEBUG, 10) ? parseInt(config.debug_sleep, 10) : 555) // debugging
          .then(done)
          .catch(done);
      });

      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
