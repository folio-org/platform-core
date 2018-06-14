# FOLIO core platform

This is the "core" Stripes "platform". It consists simply of an
NPM [`package.json`](https://docs.npmjs.com/files/package.json) that
specifies the version of `@folio/stripes-core` and of any Stripes
modules you wish to make available as part of the "core" platform
to generate client bundles along with a utility for generating
module descriptors for each Stripes module.  

Please see the
[quick start guide](https://github.com/folio-org/stripes-core/blob/master/doc/quick-start.md)
for more information.

The `stripes.config.js` is a configuration for a specific tenant. In
general, a platform supports multiple tenants, each of which may
include a different set of the available modules.  You can copy the
`stripes.config.js` file to be your `stripes.config.js.local`
configuration file.

### install node packages first

    $ yarn install

### run the sample

    $ yarn start

or

    # make the service available to other users
    $ STRIPES_HOST=full.host.name yarn start


### run all tests
```
$ yarn test
```

### run a single test
```
$ yarn test-module --run :110-auth-success
```
