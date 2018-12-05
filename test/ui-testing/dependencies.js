module.exports.test = (uiTestCtx, nightmare) => {
  describe('Checking for dependency issues on FOLIO UI App /about ("test-dependencies")', function start() {
    const { config, helpers } = uiTestCtx;
    this.timeout(Number(config.test_timeout));

    describe('Login > Click "About" link > Check for dependency errors > Logout\n', () => {
      it('should login', (done) => {
        helpers.login(nightmare, config, done);
      });
      it('should load "about" page', (done) => {
        nightmare
          .click('#clickable-settings')
          .click('a[href="/settings/about"]')
          .wait(555)
          .then(() => { done(); })
          .catch(done);
      });
      it('should check for "red" errors', (done) => {
        nightmare
          .evaluate(() => {
            const elements = document.querySelectorAll('li[style*=" red"]');
            const msgs = [];
            for (let x = 0; x < elements.length; x++) {
              msgs.push(elements[x].textContent);
            }
            if (msgs.length > 0) {
              msgs.push('Interfaces that are required but absent:');
            }
            return msgs;
          })
          .then((result) => {
            done();
            if (result !== null) {
              for (let x = 0; x < result.length; x++) {
                console.log('          WARN:', result[x]);
              }
            }
          })
          .catch(done);
      });
      it('should check for "orange" errors', (done) => {
        nightmare
          .evaluate(() => {
            const elements = document.querySelectorAll('li[style*="orange"]');
            const msgs = [];
            for (let x = 0; x < elements.length; x++) {
              msgs.push(`* ${elements[x].textContent}`);
            }
            if (msgs.length > 0) {
              msgs.unshift('Interfaces that are required but present only in an incompatible version:');
            }
            return msgs;
          })
          .then((result) => {
            done();
            if (result !== null) {
              for (let x = 0; x < result.length; x++) {
                console.log('          WARN:', result[x]);
              }
            }
          })
          .catch(done);
      });
      it('should logout', (done) => {
        helpers.logoutWithoutEnd(nightmare, config, done);
      });
    });
  });
};
