module.exports.test = function foo(uiTestCtx) {
  describe('User proxies ("new-proxy")', function bar() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);

    this.timeout(Number(config.test_timeout));
    let sponsorId = '';
    let proxyId = '';

    describe('Login > Find user two users > Add proxy to user 1 > Delete sponsor in user 2 > Logout\n', () => {
      before((done) => {
        helpers.login(nightmare, config, done); // logs in with the default admin credentials
      });

      after((done) => {
        helpers.logout(nightmare, config, done);
      });

      it('should navigate to users', (done) => {
        helpers.clickApp(nightmare, done, 'users');
      });

      it('should find an active user (sponsor)', (done) => {
        helpers.findActiveUserBarcode(nightmare, 'faculty')
          .then(bc => {
            done();
            console.log(`\t    Found sponsor ${bc}`);
            sponsorId = bc;
          })
          .catch(done);
      });

      it('should add a proxy to sponsor', (done) => {
        const selector = '#list-plugin-find-user [role="row"][aria-rowindex="2"] [role="gridcell"]:nth-child(3)';
        nightmare
          .wait('#input-user-search')
          .type('#input-user-search', '0')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .wait('[class^="noResultsMessage"]')
          .insert('#input-user-search', sponsorId)
          .wait('#submit-user-search')
          .click('#submit-user-search')
          .wait('#list-users[data-total-count="1"]')
          .wait('#list-users [role=rowgroup] a[data-row-inner]')
          .click('#list-users [role=rowgroup] a[data-row-inner]')
          .wait('#clickable-edituser')
          .click('#clickable-edituser')
          .wait('#accordion-toggle-button-proxyAccordion')
          .click('#accordion-toggle-button-proxyAccordion')
          .wait('#proxyAccordion #clickable-plugin-find-proxy')
          .click('#proxyAccordion #clickable-plugin-find-proxy')
          .wait('#OverlayContainer input[name=query]')
          // .insert('#OverlayContainer input[name=query]', proxyId)
          // .wait('#OverlayContainer button[type=submit]')
          // .click('#OverlayContainer button[type=submit]')
          .wait('#OverlayContainer #clickable-filter-active-active')
          .click('#OverlayContainer #clickable-filter-active-active')
          .wait('#OverlayContainer #clickable-filter-pg-undergrad')
          .click('#OverlayContainer #clickable-filter-pg-undergrad')
          .wait(() => !document.querySelectorAll('#OverlayContainer [class^="noResultsMessage"]').length)
          .wait('#list-plugin-find-user [role="row"][aria-rowindex="2"]')
          .evaluate((s) => {
            return document.querySelector(s).textContent;
          }, selector)
          .then(barcode => {
            nightmare
              .wait('#list-plugin-find-user [role="row"][aria-rowindex="2"] [role=gridcell]')
              .click('#list-plugin-find-user [role="row"][aria-rowindex="2"] [role=gridcell]')
              .wait('#clickable-save')
              .click('#clickable-save')
              .wait(() => !document.querySelector('#form-user'))
              .then(done)
              .catch(done);
            proxyId = barcode;
          })
          .catch(done);
      });

      it('should delete a sponsor of user 2', (done) => {
        nightmare
          // put some junk in the search field to get the reset button
          // so we can click it and be sure the field is clear before
          // entering new data.
          .wait('#input-user-search')
          .type('#input-user-search', '0')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .wait('[class^="noResultsMessage"]')
          .insert('#input-user-search', proxyId)
          .wait('#submit-user-search')
          .click('#submit-user-search')
          .wait('#list-users[data-total-count="1"]')
          .wait('#list-users [role=rowgroup] a[data-row-inner]')
          .click('#list-users [role=rowgroup] a[data-row-inner]')
          .wait('#accordion-toggle-button-proxySection')
          .wait('#clickable-edituser')
          .click('#clickable-edituser')
          .wait('#accordion-toggle-button-proxyAccordion')
          .click('#accordion-toggle-button-proxyAccordion')
          .wait('#proxyAccordion div[class*=sectionActions] button')
          .click('#proxyAccordion div[class*=sectionActions] button')
          .wait('#OverlayContainer [role="dialog"]')
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
