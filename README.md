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


## Tests
Tests are run using FOLIO's `ui-testing` framework.  Please refer to [ui-testing](https://github.com/folio-org/ui-testing) for more information on available options. All examples below require the platform to be built and running at the URL provided.

### Run all platform and app tests
```
$ yarn test --url http://localhost:3000
```

### Run platform (cross-module) tests only
```
$ yarn test-platform --url http://localhost:3000
```

### Run app module tests only
```
$ yarn test-apps --url http://localhost:3000
```

### Run selected tests
The `test-module` package script, combined with ui-testing's `--run` option, can be used for running specific tests for the platform and/or apps.  Use `WD` when referencing platform tests, otherwise use the module app module name.

Example platform test:
```
$ yarn test-module --run WD:loan_renewal --url http://localhost:3000
```

Example users test:
```
$ yarn test-module --run users:new_user --url http://localhost:3000
```
