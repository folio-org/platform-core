module.exports.test = function uiTest(uiTestCtx) {
  describe('New request ("new-request")', function modTest() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);

    const servicePoint = 'Circ Desk 1';

    this.timeout(Number(config.test_timeout));

    describe('Login > Open module "Requests" > Create new request > Logout', () => {
      let userbc = null;
      let userbcRequestor = null;
      const nextMonthValue = new Date().valueOf() + 2419200000;
      const nextMonth = new Date(nextMonthValue).toLocaleDateString('en-US');
      before((done) => {
        helpers.login(nightmare, config, done); // logs in with the default admin credentials
      });

      after((done) => {
        helpers.logout(nightmare, config, done);
      });

      let initialRules = '';
      const overdueFinePolicyName = `test-overdue-fine-policy-${Math.floor(Math.random() * 10000)}`;
      const lostItemFeePolicyName = `test-lost-item-policy-${Math.floor(Math.random() * 10000)}`;
      const noticePolicyName = `test-notice-policy-${Math.floor(Math.random() * 10000)}`;

      describe('configure settings', () => {
        it('should navigate to settings', (done) => {
          helpers.clickSettings(nightmare, done);
        });

        describe('add Overdue Fine Policy', function foo() {
          helpers.addOverdueFinePolicy(nightmare, overdueFinePolicyName);
        });

        describe('add Lost Item Fee Policy', function foo() {
          helpers.addLostItemFeePolicy(nightmare, lostItemFeePolicyName, 10, 'm');
        });

        describe('add Notice Policy', function foo() {
          helpers.addNoticePolicy(nightmare, noticePolicyName);
        });

        describe('it should configure circulation rules', () => {
          it('should configure default circulation rules', (done) => {
            const newRules = `priority: t, s, c, b, a, m, g\nfallback-policy: l one-hour r hold-only n ${noticePolicyName} o ${overdueFinePolicyName} i ${lostItemFeePolicyName} \nm book: l example-loan-policy r allow-all n ${noticePolicyName} o ${overdueFinePolicyName} i ${lostItemFeePolicyName}`;
            helpers.setCirculationRules(nightmare, newRules)
              .then(oldRules => {
                initialRules = oldRules;
              })
              .then(done)
              .catch(done);
          });
        });
      });

      describe('exercise requests', () => {
        it('should navigate to users', (done) => {
          helpers.clickApp(nightmare, done, 'users', 1000);
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

        const itembc = helpers.createInventory(nightmare, config, 'Request title');

        it('should navigate to checkout', (done) => {
          helpers.clickApp(nightmare, done, 'checkout', 1000);
        });

        it('should check out newly created item', (done) => {
          helpers.checkout(nightmare, done, itembc, userbc);
        });

        it('should navigate to requests', (done) => {
          helpers.clickApp(nightmare, done, 'requests', 1000);
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
      });

      describe('restore settings', () => {
        it('should navigate to settings', (done) => {
          helpers.clickSettings(nightmare, done);
        });

        it('should restore initial circulation rules', (done) => {
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
  });
};
