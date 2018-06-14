/* global it describe */
module.exports.test = (uiTestCtx) => {
  describe(`Load ${uiTestCtx.config.url} ("stub")`, function runMain() {
    const { config, helpers } = uiTestCtx;
    this.timeout(Number(config.test_timeout));
    const nightmare = new Nightmare(config.nightmare);

    describe('Do something', () => {
      it('should login', (done) => {
        helpers.login(nightmare, config, done);
      });

      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
