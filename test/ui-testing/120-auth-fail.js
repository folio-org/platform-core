module.exports.test = (uiTestCtx) => {
  describe('Login Page ("test-bad-login")', function test() {
    const { config } = uiTestCtx;
    this.timeout(Number(config.test_timeout));
    const nightmare = new Nightmare(config.nightmare);

    describe('given bad data', () => {
      it('Should find a login error message', (done) => {
        nightmare
          .goto(config.url)
          .wait(config.select.username)
          .insert(config.select.username, 'notgonnawork')
          .insert(config.select.password, 'invalid password')
          .click('#clickable-login')
          .wait('div[class^="formMessage"]') // failure
          .wait(parseInt(process.env.FOLIO_UI_DEBUG, 10) ? parseInt(config.debug_sleep, 10) : 0) // debugging
          .end()
          .then(() => { done(); })
          .catch(done);
      });
    });
  });
};
