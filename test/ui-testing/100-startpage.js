module.exports.test = (uiTestCtx) => {
  describe(`Load ${uiTestCtx.config.url} ("test-simple")`, function test() {
    const { config } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    config.nightmare.gotoTimeout = 90000;

    // Recommended: 5s locally, 10s to remote server, 30s from airplane
    this.timeout(Number(config.test_timeout));

    describe('/ (Home Page)', () => {
      it('should load without error', (done) => {
        // your actual testing urls will likely be `http://localhost:port/path`
        nightmare.goto(config.url)
          .wait('#clickable-login')
          .wait(parseInt(process.env.FOLIO_UI_DEBUG, 10) ? parseInt(config.debug_sleep, 10) : 0) // debugging
          .end()
          .then(() => { done(); })
          .catch(done);
      });
    });
  });
};
