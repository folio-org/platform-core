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

    describe('checkout items', () => {
      it('should navigate to checkout', (done) => {
        helpers.clickApp(nightmare, done, 'checkout', 1000);
      });

      it(`should checkout ${count} items`, (done) => {
        helpers.checkoutList(nightmare, done, barcodes, userBarcode);
      });
    });

    describe('logout', () => {
      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
