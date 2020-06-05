/* eslint-disable no-console */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^type" }] */

module.exports.test = (uiTestCtx) => {
  describe('Create many requests ("many-requests")', function descRoot() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    this.timeout(Number(config.test_timeout));

    let barcodes = [];
    let userBarcode = '';
    let requesterBarcode = '';
    const count = 3;
    const servicePoint = 'Circ Desk 1';
    const nextMonthValue = new Date().valueOf() + 2419200000;
    const nextMonth = new Date(nextMonthValue).toLocaleDateString('en-US');

    let initialRules = '';
    const overdueFinePolicyName = `test-overdue-fine-policy-${Math.floor(Math.random() * 10000)}`;
    const lostItemFeePolicyName = `test-lost-item-policy-${Math.floor(Math.random() * 10000)}`;
    const noticePolicyName = `test-notice-policy-${Math.floor(Math.random() * 10000)}`;


    it(`should login as ${config.username}/${config.password}`, (done) => {
      helpers.login(nightmare, config, done);
    });

    describe(`create ${count} item records`, () => {
      barcodes = helpers.createNInventory(nightmare, config, 'So long and thanks for all the fish / Douglas Adams', count);
    });

    describe('retrieve active users', () => {
      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users');
      });

      it('should find a borrowing user', (done) => {
        helpers.findActiveUserBarcode(nightmare, 'undergrad')
          .then(bc => {
            done();
            console.log(`\t    Found user ${bc}`);
            userBarcode = bc;
          })
          .catch(done);
      });

      it('should find a requesting user', (done) => {
        helpers.findActiveUserBarcode(nightmare, 'graduate')
          .then(bc => {
            done();
            console.log(`\t    Found requester ${bc}`);
            requesterBarcode = bc;
          })
          .catch(done);
      });
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

    describe('checkout items', () => {
      helpers.checkoutList2(nightmare, barcodes, userBarcode);
    });

    describe('it should create requests', () => {
      it('should navigate to requests', (done) => {
        helpers.clickApp(nightmare, done, 'requests', 1000);
      });

      barcodes.forEach(barcode => {
        it('should add a new "Hold" request', (done) => {
          nightmare
            .wait('#clickable-newrequest')
            .click('#clickable-newrequest')
            .insert('input[name="item.barcode"]', barcode)
            .wait('#clickable-select-item')
            .click('#clickable-select-item')
            .wait('#section-item-info a[href^="/inventory/view/"]')
            .wait('select[name="requestType"]')
            .select('select[name="requestType"]', 'Hold')
            .wait('input[name="requester.barcode"]')
            .insert('input[name="requester.barcode"]', requesterBarcode)
            .wait('#clickable-select-requester')
            .click('#clickable-select-requester')
            .wait('#section-requester-info a[href^="/users/view/"]')
            .wait('select[name="fulfilmentPreference"]')
            .select('select[name="fulfilmentPreference"]', 'Hold Shelf')
            .wait('input[name="requestExpirationDate"]')
            .insert('input[name="requestExpirationDate"]', nextMonth)
            .wait('select[name="pickupServicePointId"]')
            .type('select[name="pickupServicePointId"]', servicePoint)
            .wait('input[name="requestExpirationDate"]')
            .insert('input[name="requestExpirationDate"]', nextMonth)
            .wait('#clickable-save-request')
            .click('#clickable-save-request')
            .wait(() => !document.querySelector('#clickable-save-request'))
            .then(done)
            .catch(done);
        });
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

    describe('logout', () => {
      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
