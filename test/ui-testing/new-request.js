module.exports.test = function uiTest(uiTestCtx) {
  describe('New request ("new-request")', function modTest() {
    const { config, helpers: { login, clickApp, clickSettings, createInventory, setCirculationRules, checkout, logout } } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);

    const servicePoint = 'Circ Desk 1';

    this.timeout(Number(config.test_timeout));

    describe('Login > Open module "Requests" > Create new request > Logout', () => {
      let userbc = null;
      let userbcRequestor = null;
      const nextMonthValue = new Date().valueOf() + 2419200000;
      const nextMonth = new Date(nextMonthValue).toLocaleDateString('en-US');
      before((done) => {
        login(nightmare, config, done); // logs in with the default admin credentials
      });

      after((done) => {
        logout(nightmare, config, done);
      });

      let initialRules = '';

      it('should navigate to settings', (done) => {
        clickSettings(nightmare, done);
      });

      it('should configure default circulation rules', (done) => {
        const newRules = 'priority: t, s, c, b, a, m, g\nfallback-policy: l one-hour r hold-only n basic-notice-policy o overdue-test\nm book: l example-loan-policy r allow-all n alternate-notice-policy o overdue-test';
        setCirculationRules(nightmare, newRules)
          .then(oldRules => {
            initialRules = oldRules;
          })
          .then(done)
          .catch(done);
      });

      it('should navigate to users', (done) => {
        clickApp(nightmare, done, 'users', 1000);
      });

      it('should find an active user barcode for checkout', (done) => {
        const listitem = '#list-users [aria-rowindex="4"] [role=gridcell]:nth-of-type(3)';
        nightmare
          .wait('#clickable-filter-active-active')
          .click('#clickable-filter-active-active')
          .wait('#list-users[data-total-count]')
          .evaluate(() => {
            return document.querySelector('#list-users').getAttribute('data-total-count');
          })
          .then((count) => {
            nightmare
              .wait('#clickable-filter-pg-undergrad')
              .click('#clickable-filter-pg-undergrad')
              .wait(`#list-users:not([data-total-count="${count}"])`)
              .wait(listitem)
              .evaluate((bcode) => {
                return document.querySelector(bcode).textContent;
              }, listitem)
              .then((result) => {
                done();
                userbc = result;
                console.log(`        Found ${userbc}`);
              })
              .catch(done);
          })
          .catch(done);
      });

      it('should find an active user barcode for request', (done) => {
        const listitem = '#list-users [aria-rowIndex="5"] [role=gridcell]:nth-of-type(3)';
        nightmare
          .evaluate((bcode) => {
            return document.querySelector(bcode).textContent;
          }, listitem)
          .then((result) => {
            done();
            userbcRequestor = result;
            console.log(`        Found ${userbcRequestor}`);
          })
          .catch(done);
      });

      const itembc = createInventory(nightmare, config, 'Request title');

      it('should navigate to checkout', (done) => {
        clickApp(nightmare, done, 'checkout', 1000);
      });

      it('should check out newly created item', (done) => {
        checkout(nightmare, done, itembc, userbc);
      });

      it('should navigate to requests', (done) => {
        clickApp(nightmare, done, 'requests', 1000);
      });

      it('should add a new "Hold" request', (done) => {
        nightmare
          .wait('#clickable-newrequest')
          .click('#clickable-newrequest')
          .insert('input[name="item.barcode"]', itembc)
          .wait('#clickable-select-item')
          .click('#clickable-select-item')
          .wait('#section-item-info a[href^="/inventory/view/"]')
          .wait('select[name="requestType"]')
          .select('select[name="requestType"]', 'Hold')
          .wait('input[name="requester.barcode"]')
          .insert('input[name="requester.barcode"]', userbcRequestor)
          .wait('#clickable-select-requester')
          .click('#clickable-select-requester')
          .wait('#section-requester-info a[href^="/users/view/"]')
          .wait('select[name="fulfilmentPreference"]')
          .select('select[name="fulfilmentPreference"]', 'Hold Shelf')
          .wait('input[name="requestExpirationDate"]')
          .insert('input[name="requestExpirationDate"]', nextMonth)

          .evaluate((servicePointName) => {
            const node = Array.from(
              document.querySelectorAll('select[name="pickupServicePointId"] option')
            ).find(e => e.text.startsWith(servicePointName));
            if (node) {
              return node.value;
            }

            throw new Error(`Could not find the ID for the servicePoint ${servicePointName} ${node}`);
          }, servicePoint)
          .then((servicePointId) => {
            nightmare
              .select('select[name="pickupServicePointId"]', servicePointId)
              .wait('input[name="requestExpirationDate"]')
              .insert('input[name="requestExpirationDate"]', nextMonth)
              .wait('#clickable-save-request')
              .click('#clickable-save-request')
              .wait(() => !document.querySelector('#clickable-save-request'))
              .wait(3333)
              .then(done)
              .catch(done);
          })
          .catch(done);
      });

      it('should find new request in requests list', (done) => {
        nightmare
          .wait('#input-request-search')
          .insert('#input-request-search', itembc)
          .wait('button[type="submit"]')
          .click('button[type="submit"]')
          .wait('#list-requests[data-total-count="1"]')
          .then(done)
          .catch(done);
      });

      it('should navigate to settings', (done) => {
        clickSettings(nightmare, done);
      });

      it('should restore initial circulation rules', (done) => {
        setCirculationRules(nightmare, initialRules)
          .then(() => done())
          .catch(done);
      });
    });
  });
};
