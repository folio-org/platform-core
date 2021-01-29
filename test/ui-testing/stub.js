module.exports.test = (uiTestCtx, nightmare) => {
  describe(`Load ${uiTestCtx.config.url} ("stub")`, function runMain() {
    const { config, helpers } = uiTestCtx;
    this.timeout(Number(config.test_timeout));

    describe('Do something', () => {
      it('should login', (done) => {
        helpers.login(nightmare, config, done);
      });

      it('should logout', (done) => {
        helpers.logoutWithoutEnd(nightmare, config, done);
      });
    });
  });
};
