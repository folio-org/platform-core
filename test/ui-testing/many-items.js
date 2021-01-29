/* eslint-disable no-console */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^type" }] */

module.exports.test = (uiTestCtx) => {
  describe('Checkout many items to a single user ("many-items")', function descRoot() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    this.timeout(Number(config.test_timeout));

    let barcodes = [];
    let userBarcode = '';
    const count = 21;

    let initialRules = '';
    const overdueFinePolicyName = `test-overdue-fine-policy-${Math.floor(Math.random() * 10000)}`;
    const lostItemFeePolicyName = `test-lost-item-policy-${Math.floor(Math.random() * 10000)}`;
    const noticePolicyName = `test-notice-policy-${Math.floor(Math.random() * 10000)}`;

    it(`should login as ${config.username}/${config.password}`, (done) => {
      helpers.login(nightmare, config, done);
    });

    describe(`create ${count} item records`, () => {
      barcodes = helpers.createNInventory(nightmare, config, 'L’Apprenti sorcier / Paul Dukas', count);
    });

    describe('retrieve an active user', () => {
      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users');
      });

      it('should find an active user', (done) => {
        helpers.findActiveUserBarcode(nightmare, 'undergrad')
          .then(bc => {
            done();
            console.log(`\t    Found user ${bc}`);
            userBarcode = bc;
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
      it('should navigate to checkout', (done) => {
        helpers.clickApp(nightmare, done, 'checkout', 1000);
      });

      it(`should checkout ${count} items`, (done) => {
        helpers.checkoutList(nightmare, barcodes, userBarcode)
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

    describe('logout', () => {
      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
