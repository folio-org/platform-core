# Change history for platform-core

## 1.4.0 (IN PROGRESS)

* Update integration tests to accommodate MCL aria changes, STRIPES-596

## [1.3.0](https://github.com/folio-org/platform-core/tree/v1.3.0-SNAPSHOT) (2019-01-23)

* Upgrade to `stripes` framework `v2.0.0`, STRIPES-577


## [1.2.2](https://github.com/folio-org/platform-core/tree/v1.2.2-SNAPSHOT) (2019-01-17)

* Manually click the search button in tests. Refs STCOM-354.
* Don't use the search button in OverlayContainers; that submits the underlying forms in addition.
* Wait for elements instead of timers, if possible. Refs UITEST-55.


## [1.1.0](https://github.com/folio-org/platform-core/tree/v1.1.0) (2018-10-09)
* Upgrade platform and all modules to versions targeting stripes framework 1.0, FOLIO-1547


## [1.0.9](https://github.com/folio-org/platform-core/tree/v1.0.9) (2018-09-26)
*


## 1.0.0
* New platform created for building and testing core modules
* Move cross-module tests from `ui-testing` into `platform-core`, UITEST-22
* Update package scripts to pass working directory token with --run, UITEST-36
* Disable tests not currently in invoked by ui-testing, UITEST-35
