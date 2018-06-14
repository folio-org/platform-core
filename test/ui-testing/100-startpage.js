module.exports.test = (uiTestCtx) => {
  describe(`Load ${uiTestCtx.config.url} ("test-simple")`, function () {
    const { config } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    nightmare.gotoTimeout = 90000;

    // Recommended: 5s locally, 10s to remote server, 30s from airplane
    this.timeout(Number(config.test_timeout));

    describe('/ (Home Page)', () => {
      it('should load without error', (done) => {
        // your actual testing urls will likely be `http://localhost:port/path`
        nightmare.goto(config.url)
          .wait('#clickable-login')
          .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 0) // debugging
          .end()
          .then(function (result) { done(); })
          .catch(done);
      });
    });
  });
}
