/* global it describe Nightmare before after */

module.exports.test = function uiTest(uiTestCtx) {
  describe('New request ("new-request")', function modTest() {
    const { config, helpers: { login, openApp, createInventory, logout }, meta: { testVersion } } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);

    this.timeout(Number(config.test_timeout));

    describe('Login > Open module "Requests" > Create new request > Logout', () => {
      let userbc = null;
      const nextMonthValue = new Date().valueOf() + 2419200000;
      const nextMonth = new Date(nextMonthValue).toLocaleDateString('en-US');
      before((done) => {
        login(nightmare, config, done); // logs in with the default admin credentials
      });

      after((done) => {
        logout(nightmare, config, done);
      });

      it('should open module "Requests" and find version tag ', (done) => {
        nightmare
          .use(openApp(nightmare, config, done, 'requests', testVersion))
          .then(result => result);
      });

      it('should find an active user barcode', (done) => {
        const listitem = '#list-users div[role="row"] > a';
        const bcodeNode = `${listitem} > div:nth-child(3)`;
        nightmare
          .wait(1111)
          .wait('#clickable-users-module')
          .click('#clickable-users-module')
          .wait('#clickable-filter-pg-faculty')
          .click('#clickable-filter-pg-faculty')
          .wait('#list-users:not([data-total-count="0"])')
          .wait(listitem)
          .evaluate((bcode) => {
            return document.querySelector(bcode).textContent;
          }, bcodeNode)
          .then((result) => {
            done();
            userbc = result;
            console.log(`        Found ${userbc}`);
          })
          .catch(done);
      });

      const itembc = createInventory(nightmare, config, 'Request title');

      it('should check out newly created item', (done) => {
        nightmare
          .wait(1111)
          .wait('#clickable-checkout-module')
          .click('#clickable-checkout-module')
          .wait('#section-patron #clickable-find-user')
          .click('#section-patron #clickable-find-user')
          .wait('#clickable-filter-pg-faculty')
          .click('#clickable-filter-pg-faculty')
          .wait('#list-users div[role="row"][aria-rowindex="2"]')
          .click('#list-users div[role="row"][aria-rowindex="2"] a')
          .wait(2222)
          .wait('#input-item-barcode')
          .insert('#input-item-barcode', itembc)
          .wait('#clickable-add-item')
          .click('#clickable-add-item')
          .wait('#list-items-checked-out')
          .wait('#clickable-done')
          .click('#clickable-done')
          .then(() => {
            done();
          })
          .catch(done);
      });

      it('should add a new "Hold" request', (done) => {
        nightmare
          .wait(1111)
          .wait('#clickable-requests-module')
          .click('#clickable-requests-module')
          .wait('#clickable-newrequest')
          .click('#clickable-newrequest')
          .insert('input[name="item.barcode"]', itembc)
          .wait('#clickable-select-item')
          .click('#clickable-select-item')
          .wait('#section-item-info a[href^="/inventory/view/"]')
          .wait('select[name="requestType"]')
          .select('select[name="requestType"]', 'Hold')
          .wait('input[name="requester.barcode"]')
          .insert('input[name="requester.barcode"]', userbc)
          .wait('#clickable-select-requester')
          .click('#clickable-select-requester')
          .wait('#section-requester-info a[href^="/users/view/"]')
          .wait('select[name="fulfilmentPreference"]')
          .select('select[name="fulfilmentPreference"]', 'Hold Shelf')
          .wait('input[name="requestExpirationDate"]')
          .insert('input[name="requestExpirationDate"]', nextMonth)
          .wait('#clickable-create-request')
          .click('#clickable-create-request')
          .wait(1111)
          .then(() => {
            done();
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
  });
};
