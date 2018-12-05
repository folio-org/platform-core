module.exports.test = (uiTestCtx, nightmare) => {
  describe('Login Page ("test-bad-login")', function test() {
    const { config } = uiTestCtx;
    this.timeout(Number(config.test_timeout));
    

    describe('given bad data', () => {
      it('Should find a login error message', (done) => {
        nightmare
          .goto(config.url)
          .wait(config.select.username)
          .insert(config.select.username, 'notgonnawork')
          .insert(config.select.password, 'invalid password')
          .click('#clickable-login')
          .wait('div[class^="AuthErrorsContainer"]') // failure
          .end()
          .then(done)
          .catch(done);
      });
    });
  });
};
