module.exports.test = (uiTestCtx) => {
  describe('Login Page ("auth-fail")', function test() {
    const { config } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);

    this.timeout(Number(config.test_timeout));
    describe('given bad data', () => {
      it('Should find a login error message', (done) => {
        nightmare
          .goto(config.url)
          .wait(config.select.username)
          .insert(config.select.username, 'notgonnawork')
          .insert(config.select.password, 'invalid password')
          .wait('#clickable-login')
          .click('#clickable-login')
          .wait('div[class^="authErrorsWrapper"]') // failure
          .end()
          .then(done)
          .catch(done);
      });
    });
  });
};
