/* global it describe Nightmare before after */
module.exports.test = function foo(uiTestCtx) {
  describe('User proxies ("new-proxy")', function bar() {
    const { config, helpers: { login, clickApp, logout } } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);

    this.timeout(Number(config.test_timeout));

    describe('Login > Find user two users > Add proxy to user 1 > Delete sponsor in user 2 > Logout\n', () => {
      let userIds = [];
      let proxyId = '';
      before((done) => {
        login(nightmare, config, done); // logs in with the default admin credentials
      });
      after((done) => {
        logout(nightmare, config, done);
      });

      it('should navigate to users', (done) => {
        clickApp(nightmare, done, 'users');
      });

      it('should get active user barcodes', (done) => {
        nightmare
          .wait('#input-user-search')
          .type('#input-user-search', '0')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .wait('#clickable-filter-active-active')
          .click('#clickable-filter-active-active')
          .wait('#clickable-filter-pg-faculty')
          .click('#clickable-filter-pg-faculty')
          .wait('#list-users div[role="row"][aria-rowindex="2"]')
          .evaluate(() => {
            const ubc = [];
            const list = document.querySelectorAll('#list-users div[role="row"]');
            list.forEach((node) => {
              const status = node.querySelector('div:nth-child(1)').innerText;
              const barcode = node.querySelector('div:nth-child(3)').innerText;
              const anchor = node.querySelector('a');
              // there's no longer an easy way to skip the header row of an MCL
              // so the hack here is to make sure the barcode is numeric, which
              // it won't be in the header row. Kinda hacky but it works.
              if (anchor && barcode && RegExp(/^\d+$/).test(barcode) && status.match(/Active/)) {
                const uuid = anchor.href.replace(/.+?([^/]+)\?.*/, '$1');
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
        const selector = '#OverlayContainer #list-plugin-find-user [role="row"][aria-rowindex="2"] [role="gridcell"]:nth-child(3)';
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
          .wait('#proxy #clickable-plugin-find-proxy')
          .click('#proxy #clickable-plugin-find-proxy')

          // you'd think we could just execute a search here,
          // but clicking the "search" button in the modal submits
          // the underlying user-edit form in addition to this form,
          // so we lose the ability to capture the proxy we just found.
          .wait('#OverlayContainer #clickable-filter-active-active')
          .click('#OverlayContainer #clickable-filter-active-active')
          .wait('#OverlayContainer #clickable-filter-pg-undergrad')
          .click('#OverlayContainer #clickable-filter-pg-undergrad')
          .wait('#OverlayContainer #list-plugin-find-user:not([data-total-count="0"])')
          .evaluate((s) => {
            return document.querySelector(s).textContent;
          }, selector)
          .then(barcode => {
            nightmare
              .wait('#OverlayContainer #list-plugin-find-user [role="row"][aria-rowindex="2"]')
              .click('#OverlayContainer #list-plugin-find-user [role="row"][aria-rowindex="2"]')
              .wait('#clickable-save')
              .click('#clickable-save')
              .then(done)
              .catch(done);
            proxyId = barcode;
          })
          .catch(done);
      });

      it(`should delete a sponsor of user 2 (${proxyId})`, (done) => {
        nightmare
          // close the sponsor's detail pane
          // then search for the proxy
          .wait('#pane-userdetails button[icon="times"]')
          .click('#pane-userdetails button[icon="times"]')
          .wait(() => {
            return !(document.querySelector('#pane-userdetails'));
          })
          // put some junk in the search field to get the reset button
          // so we can click it and be sure the field is clear before
          // entering new data.
          .type('#input-user-search', 'asdf')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .wait('#pane-results div[class*=mclEmptyMessage]')
          .type('#input-user-search', proxyId)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait('#list-users[data-total-count="1"]')
          .wait('#list-users [role="row"][aria-rowindex="2"] > a')
          .click('#list-users [role="row"][aria-rowindex="2"] > a')
          .wait('#accordion-toggle-button-proxySection')
          .wait('#clickable-edituser')
          .click('#clickable-edituser')
          .wait('#accordion-toggle-button-proxy')
          .click('#accordion-toggle-button-proxy')
          .wait('#proxy div[class*=sectionActions] button')
          .click('#proxy div[class*=sectionActions] button')
          .wait('#OverlayContainer [role="dialog"]')
          .wait('#deletesponsors-confirmation-footer')
          .wait('#clickable-deletesponsors-confirmation-confirm')
          .click('#clickable-deletesponsors-confirmation-confirm')
          .wait('#clickable-save')
          .click('#clickable-save')
          .then(done)
          .catch(done);
      });
    });
  });
};
