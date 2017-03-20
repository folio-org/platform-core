const Nightmare = require('nightmare')
const assert = require('assert')
const config = require('./.folio-ui-config.js')

describe('Using the Folio UI App /trivial', function () {
  this.timeout('10s')

  let nightmare = null
  beforeEach(() => {
    // show true lets you see wth is actually happening :)
    nightmare = new Nightmare(config.nightmare)
  })

  describe('signing up and finishing setup', () => {
    let username = process.env.FOLIO_UI_USERNAME
    let password = process.env.FOLIO_UI_PASSWORD
    
    it('should work without timing out', done => {
      nightmare
      .goto(config.url)
      .type('input[name=username]', username)
      .type('input[name=password]', password)
      .click('button[type=submit]')
      .wait('h3')
      
      .click('a[title=Trivial] > span') // Hi Kurt
      .type("input[id=g]", "Ho")
      .type("input[id=n]", "Karl")
      .click('button[type=submit]')
      
      .wait('h3')
      //.wait(20000)
      .end()
      .then(result => { done() })
      .catch(done)
    })
  })
})


