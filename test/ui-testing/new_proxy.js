/* global it describe Nightmare before after */
module.exports.test = function foo(uiTestCtx, nightmare) {
  describe('Module test: new_proxy', function bar() {
    const { config, helpers: { login, openApp, logoutWithoutEnd }, meta: { testVersion } } = uiTestCtx;

    this.timeout(Number(config.test_timeout));

    describe('Login > Find user two users > Add proxy to user 1 > Delete sponsor in user 2 > Logout\n', () => {
      let userIds = [];
      let proxyId = '';
      before((done) => {
        login(nightmare, config, done); // logs in with the default admin credentials
      });
      after((done) => {
        logoutWithoutEnd(nightmare, config, done);
      });

      it('should open app and find version tag', (done) => {
        nightmare
          .use(openApp(nightmare, config, done, 'users', testVersion))
          .then(result => result)
          .catch(done);
      });

      it('should get active user barcodes', (done) => {
        nightmare
          .wait('#clickable-users-module')
          .click('#clickable-users-module')
          .wait('#input-user-search')
          .type('#input-user-search', '0')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .wait('#clickable-filter-pg-faculty')
          .click('#clickable-filter-pg-faculty')
          .wait('#list-users div[role="listitem"]:nth-child(1)')
          .evaluate(() => {
            const ubc = [];
            const list = document.querySelectorAll('#list-users div[role="listitem"]');
            list.forEach((node) => {
              const status = node.querySelector('a div:nth-child(1)').innerText;
              const barcode = node.querySelector('a div:nth-child(3)').innerText;
              const uuid = node.querySelector('a').href.replace(/.+?([^/]+)\?.*/, '$1');
              if (barcode && status.match(/Active/)) {
                ubc.push({
                  barcode,
                  uuid,
                });
              }
            });
            return ubc;
          })
          .then((result) => {
            done();
            userIds = result;
          })
          .catch(done);
      });

      it('should add a proxy for user 1', (done) => {
        const selector = '#OverlayContainer #list-users div[role="listitem"]:nth-child(1) div[role=gridcell]:nth-child(4)';
        nightmare
          .wait('#input-user-search')
          .type('#input-user-search', '0')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .insert('#input-user-search', userIds[0].barcode)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait('#clickable-edituser')
          .click('#clickable-edituser')
          .wait('#accordion-toggle-button-proxy')
          .click('#accordion-toggle-button-proxy')
          .wait('#proxy #clickable-plugin-find-user')
          .click('#proxy #clickable-plugin-find-user')

          // you'd think we could just execute a search here,
          // but clicking the "search" button in the modal submits
          // the underlying user-edit form in addition to this form,
          // so we lose the ability to capture the proxy we just found.
          .wait('#OverlayContainer #clickable-filter-pg-undergrad')
          .click('#OverlayContainer #clickable-filter-pg-undergrad')
          .wait('#OverlayContainer #list-users div[role="listitem"]:nth-child(1)')
          .evaluate((s) => {
            const pid = document.querySelector(s).innerText;
            return pid;
          }, selector)
          .then(text => {
            nightmare
              .click('#OverlayContainer #list-users div[role="listitem"]:nth-child(1) a')
              .wait('#clickable-updateuser')
              .click('#clickable-updateuser');
            done();
            proxyId = text;
          })
          .catch(done);
      });

      it(`should delete a sponsor of user 2 (${proxyId})`, (done) => {
        nightmare
          .wait(2222)
          // put some junk in the search field to get the reset button
          // so we can click it and be sure the field is clear before
          // entering new data.
          .type('#input-user-search', 'asdf')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .type('#input-user-search', proxyId)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait('#list-users[data-total-count="1"]')
          .evaluate((pid) => {
            const node = Array.from(
              document.querySelectorAll('#list-users div[role="listitem"] > a > div[role="gridcell"]')
            ).find(e => e.textContent === pid);
            if (node) {
              node.parentElement.click();
            } else {
              throw new Error(`Could not find the user ${pid} to edit`);
            }
          }, proxyId)
          .then(() => {
            nightmare
              .wait('#accordion-toggle-button-proxySection')
              .wait('#clickable-edituser')
              .click('#clickable-edituser')
              .wait('#accordion-toggle-button-proxy')
              .click('#accordion-toggle-button-proxy')
              .wait(`#proxy a[href*="${userIds[0].uuid}"]`)
              .xclick(`id("proxy")//a[contains(@href, "${userIds[0].uuid}")]/../../../..//button`)
              .wait('#clickable-deleteproxies-confirmation-confirm')
              .click('#clickable-deleteproxies-confirmation-confirm')
              .wait('#clickable-updateuser')
              .click('#clickable-updateuser')
              .then(() => { done(); })
              .catch(done);
          })
          .catch(done);
      });
    });
  });
};
