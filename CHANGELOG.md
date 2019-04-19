## [2.0.10](https://github.com/thetutlage/japa/compare/v2.0.9...v2.0.10) (2019-04-19)


### Code Refactoring

* **slimrunner:** call hooks before loading test files ([e231d80](https://github.com/thetutlage/japa/commit/e231d80))


### BREAKING CHANGES

* **slimrunner:** The Runner class hooks support has been removed, since calling
hooks after loading the test files beats it's purpose.

Anyone using `Runner` class to build their own runtime has to add support for before
and after hooks like `slimRunner`



## [2.0.9](https://github.com/thetutlage/japa/compare/v2.0.8...v2.0.9) (2019-04-03)



## [2.0.8](https://github.com/thetutlage/japa/compare/2.0.7...2.0.8) (2019-03-23)


### Features

* **Runner:** add option to define before and after hooks ([12186db](https://github.com/thetutlage/japa/commit/12186db))
* **slimRunner:** expose before and after hooks via configure options ([fec01bb](https://github.com/thetutlage/japa/commit/fec01bb))

The runner hooks can be defined inside the `configure` method object.

```js
const { configure } = require('japa')

configure({
  before: [
    async (runner) => {
      // setup db
    }
  ],
  after: [
    async (runner) => {
      // cleanup db
    }  
  ]
})
```

<a name="2.0.7"></a>
## [2.0.7](https://github.com/thetutlage/japa/compare/v2.0.6...v2.0.7) (2019-01-01)



<a name="2.0.6"></a>
## [2.0.6](https://github.com/thetutlage/japa/compare/v2.0.5...v2.0.6) (2018-10-20)


### Bug Fixes

* **assert:** copy missing chai interfaces ([1e3da2c](https://github.com/thetutlage/japa/commit/1e3da2c))
* **reporter:** check for groups length and tests total to decide status ([e19b0ba](https://github.com/thetutlage/japa/commit/e19b0ba))



<a name="2.0.5"></a>
## [2.0.5](https://github.com/thetutlage/japa/compare/v2.0.4...v2.0.5) (2018-10-10)



<a name="2.0.4"></a>
## [2.0.4](https://github.com/thetutlage/japa/compare/v2.0.3...v2.0.4) (2018-10-04)


### Bug Fixes

* **slimRunner:** exit process with error when there are errors ([88d41f9](https://github.com/thetutlage/japa/commit/88d41f9))



<a name="2.0.3"></a>
## [2.0.3](https://github.com/thetutlage/japa/compare/v2.0.2...v2.0.3) (2018-09-27)



<a name="2.0.2"></a>
## [2.0.2](https://github.com/thetutlage/japa/compare/v2.0.1...v2.0.2) (2018-09-25)


### Bug Fixes

* **package:** use chai as the main dependency ([e020428](https://github.com/thetutlage/japa/commit/e020428))
* **slimRunner:** exit process with correct signals ([4d187f1](https://github.com/thetutlage/japa/commit/4d187f1))


### Features

* **api:** export api module for custom test runners ([d626168](https://github.com/thetutlage/japa/commit/d626168))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/thetutlage/japa/compare/v2.0.0...v2.0.1) (2018-09-22)


### Bug Fixes

* **package:** remove bin path ([e37ad00](https://github.com/thetutlage/japa/commit/e37ad00))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/thetutlage/japa/compare/v1.0.6...v2.0.0) (2018-09-22)


### Features

* add quick runner to run tests as node scripts ([3ef3b9b](https://github.com/thetutlage/japa/commit/3ef3b9b))
* add tests store ([de20fa1](https://github.com/thetutlage/japa/commit/de20fa1))
* re-write in typescript ([9a6f2a9](https://github.com/thetutlage/japa/commit/9a6f2a9))
* track failing hooks in reporter report ([9a78366](https://github.com/thetutlage/japa/commit/9a78366))
* **bail:** add support for bailing tests ([4c55187](https://github.com/thetutlage/japa/commit/4c55187))
* **callable:** callable allow post run hooks to decide test status ([a39d0f0](https://github.com/thetutlage/japa/commit/a39d0f0))
* **grep:** add support for greping tests ([162e691](https://github.com/thetutlage/japa/commit/162e691))
* **group:** add passing per test options via group.test ([f6806b3](https://github.com/thetutlage/japa/commit/f6806b3))
* **loader:** add loader for running multiple test files ([08b4840](https://github.com/thetutlage/japa/commit/08b4840))
* **reporter:** add list reporter to be used with the slim runner ([8942c90](https://github.com/thetutlage/japa/commit/8942c90))
* **runner:** add slim runner to use japa as immediate test runner ([80d48c2](https://github.com/thetutlage/japa/commit/80d48c2))
* **runner:** implement the test runner ([c05a44e](https://github.com/thetutlage/japa/commit/c05a44e))
* **slimRunner:** exlcude run and toJSON methods from test and group ([41e4921](https://github.com/thetutlage/japa/commit/41e4921))
* **test:** allow skipping tests in various env ([8213ec2](https://github.com/thetutlage/japa/commit/8213ec2))

<a name="1.0.6"></a>
## [1.0.6](https://github.com/thetutlage/japa/compare/v1.0.5...v1.0.6) (2018-01-08)


### Features

* **callable:** allow closure inside done ([4d2adca](https://github.com/thetutlage/japa/commit/4d2adca))



<a name="1.0.5"></a>
## [1.0.5](https://github.com/thetutlage/japa/compare/v1.0.4...v1.0.5) (2017-09-26)



<a name="1.0.4"></a>
## [1.0.4](https://github.com/thetutlage/japa/compare/v1.0.3...v1.0.4) (2017-08-17)


### Features

* out of the box support for embed api ([6a9ed2e](https://github.com/thetutlage/japa/commit/6a9ed2e))
* **assertion:** expose api to extend chai ([66e09a7](https://github.com/thetutlage/japa/commit/66e09a7))
* **test:** add support for custom arg to test callback ([f92c8cb](https://github.com/thetutlage/japa/commit/f92c8cb))



<a name="1.0.3"></a>
## [1.0.3](https://github.com/thetutlage/japa/compare/v1.0.2...v1.0.3) (2017-04-01)


### Bug Fixes

* **middleware:** do not pass next to wrapFn ([de5d1c4](https://github.com/thetutlage/japa/commit/de5d1c4))
* **middleware:** read bail value from the util module ([f24d2d7](https://github.com/thetutlage/japa/commit/f24d2d7))


### Features

* **reporter:** show custom message when zero tests ran ([6ce1d59](https://github.com/thetutlage/japa/commit/6ce1d59))



<a name="1.0.2"></a>
## [1.0.2](https://github.com/thetutlage/japa/compare/v1.0.1...v1.0.2) (2017-04-01)


### Features

* **cli:** add cli file to be used for configuring test files ([3b47016](https://github.com/thetutlage/japa/commit/3b47016))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/thetutlage/japa/compare/v1.0.0...v1.0.1) (2017-02-23)


### Features

* **runner:** add support for grep ([0bada8e](https://github.com/thetutlage/japa/commit/0bada8e))
