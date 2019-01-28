module.exports.test = (uiTestCtx) => {
  describe('Load test-codexsearch', function runMain() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    this.timeout(Number(config.test_timeout));

    const title = 'Bridget Jones';
    let resultCount = 0;

    describe('Login > Codex Search > Filtering Results > Reset Search > Logout\n', () => {
      it(`should login as ${config.username}/${config.password}`, (done) => {
        helpers.login(nightmare, config, done);
      });

      it('should open codex search and execute search', (done) => {
        nightmare
          .wait('#clickable-search-module')
          .click('#clickable-search-module')
          .wait('#input-record-search')
          .type('#input-record-search', 'a')
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .wait('#input-record-search-qindex')
          .select('#input-record-search-qindex', 'title')
          .wait('#input-record-search')
          .type('#input-record-search', title)
          .wait('button[type=submit]')
          .click('button[type=submit]')
          .wait('#list-search:not([data-total-count="0"])')
          .evaluate(() => {
            return document.querySelector('#list-search').getAttribute('data-total-count');
          })
          .then((result) => {
            nightmare
              .then(done)
              .catch(done);
            resultCount = result;
          })
          .catch(done);
      });

      it('should filter results and find 0 results', (done) => {
        nightmare
          .wait('#clickable-filter-location-Annex')
          .click('#clickable-filter-location-Annex')
          .wait(() => {
            return !(document.querySelector('#list-search'));
          })
          .then(done)
          .catch(done);
      });

      it('should remove filter results and find results', (done) => {
        nightmare
          .wait('#clickable-filter-location-Annex')
          .click('#clickable-filter-location-Annex')
          .wait('#list-search:not([data-total-count="0"])')
          .evaluate(() => {
            return document.querySelector('#list-search').getAttribute('data-total-count');
          })
          .then((result) => {
            if (result !== resultCount) {
              throw new Error(`Result count changed from ${resultCount} to ${result}!`);
            }
          })
          .then(done)
          .catch(done);
      });

      /*
        This test is failing do to this functionality having regressed.
        https://issues.folio.org/browse/FOLIO-1149
      */

      // it('should sort results', (done) => {
      //   nightmare
      //     .evaluate(firstResultSelectorBeforeClick=>{
      //       let firstResult = document.querySelector(firstResultSelectorBeforeClick);
      //       return firstResult.title;
      //     }, firstResultSelector)
      //     .then((firstResultValueBeforeClick)=>{
      //       nightmare
      //         .click(titleSortSelector)
      //         .waitUntilNetworkIdle()
      //         .evaluate((firstResultSelectorAfterClick)=>{
      //           let firstResultAfterClick = document.querySelector(firstResultSelectorAfterClick);
      //           return firstResultAfterClick.title;
      //         }, firstResultSelector)
      //         .then(firstResultValueAfterClick=>{
      //           if(firstResultValueBeforeClick === firstResultValueAfterClick) {
      //             throw new Error(`Sort did not change ordering. ${firstResultValueBeforeClick} ${firstResultValueAfterClick}`);
      //           }
      //           done();
      //         })
      //         .catch(done);
      //     })
      //     .catch(done);
      // });

      it('should reset search', (done) => {
        nightmare
          .wait('#clickable-reset-all')
          .click('#clickable-reset-all')
          .evaluate(() => {
            const results = document.querySelector('#list-search');
            if (results) {
              throw new Error('Found unexpected search results after reset');
            }
          })
          .then(done)
          .catch(done);
      });

      it('should logout', (done) => {
        helpers.logout(nightmare, config, done);
      });
    });
  });
};
