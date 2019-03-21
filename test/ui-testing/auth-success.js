module.exports.test = (uiTestCtx, nightmare) => {
  describe('Login Page ("auth-success")', function test() {
    const { config } = uiTestCtx;
    this.timeout(Number(config.test_timeout));

    describe('Login and logout without error', () => {
      it('Login successfully', (done) => {
        nightmare
          .goto(config.url)
          .wait(config.select.username)
          .type(config.select.username, config.username)
          .type(config.select.password, config.password)
          .click('#clickable-login')
          .wait('#clickable-logout')
          .then(() => { done(); })
          .catch(done);
      });

      it('Logout properly', (done) => {
        nightmare
          .click('#clickable-logout') // logout
          .wait('#clickable-login')
          .end()
          .then(() => { done(); })
          .catch(done);
      });
    });
  });
};
