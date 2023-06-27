/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Test } from './test/main.js'
import { Group } from './group/main.js'
import type { FilteringOptions } from './types.js'

/**
 * Exposes the API to refine unwanted tests based upon applied
 * filters.
 *
 * @example
 * const refiner = new Refiner({ tags: ['@slow'] })
 * refiner.allows('tags', ['@slow']) // true
 * refiner.allows('tags', ['@regression']) // false
 *
 * const refiner = new Refiner({ tags: [] })
 * refiner.allows('tags', ['@slow']) // true
 * refiner.allows('tags', ['@regression']) // true
 */
export class Refiner {
  /**
   * Controls if test tags should match all the defined
   * tags or not.
   *
   * Defaults to false
   */
  #shouldMatchAllTags: boolean = false

  /**
   * A set of pinned tests
   */
  #pinnedTests: Set<Test<any, any>> = new Set()

  /**
   * Available filters
   */
  #filters: Required<FilteringOptions> & { negatedTags: string[] } = {
    tags: [],
    tests: [],
    groups: [],
    negatedTags: [],
  }

  constructor(filters: FilteringOptions = {}) {
    if (filters.tags) {
      this.add('tags', filters.tags)
    }

    if (filters.tests) {
      this.add('tests', filters.tests)
    }

    if (filters.groups) {
      this.add('groups', filters.groups)
    }
  }

  /**
   * Find if the group is allowed to execute its tests.
   */
  #isGroupAllowed(group: Group<any>): boolean {
    const groupFilters = this.#filters.groups

    /**
     * Group filters exists and group title is not within the filters
     * list, then return false right away
     */
    if (groupFilters.length && !groupFilters.includes(group.title)) {
      return false
    }

    /**
     * By default the group is not allowed to be executed. However,
     * we go through all the tests within that group and if
     * one or more tests are allowed to run, then we will
     * allow the group to run as well.
     *
     * Basically, we are checking the children to find if the group
     * should run or not.
     */
    let allowGroup = false
    for (let test of group.tests) {
      allowGroup = this.allows(test)
      if (allowGroup) {
        break
      }
    }

    return allowGroup
  }

  /**
   * Find if the test is allowed to be executed by checking
   * for the test title filter
   */
  #isTestTitleAllowed(test: Test<any, any>): boolean {
    /**
     * All tests are allowed, when no filters are applied
     * on the test title
     */
    if (!this.#filters.tests.length) {
      return true
    }

    return this.#filters.tests.includes(test.title)
  }

  /**
   * Find if test is allowed by the negated tags filter
   */
  #allowedByNegatedTags(test: Test<any, any>): boolean {
    if (!this.#filters.negatedTags.length) {
      return true
    }

    /**
     * There should be zero matching negated tags
     */
    return this.#filters.negatedTags.every((tag) => !test.options.tags.includes(tag))
  }

  /**
   * Test if the test is allowed by the tags filter
   */
  #allowedByTags(test: Test<any, any>): boolean {
    if (!this.#filters.tags.length) {
      return true
    }

    /**
     * Find one or more matching tags
     */
    if (this.#shouldMatchAllTags) {
      return this.#filters.tags.every((tag) => test.options.tags.includes(tag))
    }
    return this.#filters.tags.some((tag) => test.options.tags.includes(tag))
  }

  /*
   * Find if the test is allowed to be executed by checking
   * for the test tags
   */
  #areTestTagsAllowed(test: Test<any, any>): boolean {
    return this.#allowedByTags(test) && this.#allowedByNegatedTags(test)
  }

  /*
   * Find if the test is allowed to be executed by checking
   * for the pinned tests
   */
  #isAllowedByPinnedTest(test: Test<any, any>): boolean {
    /**
     * All tests are allowed, when no tests are pinned
     */
    if (!this.#pinnedTests.size) {
      return true
    }

    return this.#pinnedTests.has(test)
  }

  /**
   * Enable/disable matching of all tags when filtering tests.
   * If "matchAll" is enabled, the test tags should match
   * all the user defined tags.
   *
   * Otherwise, any one match will pass the filter
   */
  matchAllTags(state: boolean): this {
    this.#shouldMatchAllTags = state
    return this
  }

  /**
   * Pin a test to be executed.
   */
  pinTest(test: Test<any, any>): void {
    this.#pinnedTests.add(test)
  }

  /**
   * Find if a test is pinned
   */
  isPinned(test: Test<any, any>): boolean {
    return this.#pinnedTests.has(test)
  }

  /**
   * Add a filter
   */
  add(layer: 'tests' | 'tags' | 'groups', values: string[]): void {
    if (layer === 'tags') {
      values.forEach((tag) => {
        if (tag.startsWith('!') || tag.startsWith('~')) {
          this.#filters.negatedTags.push(tag.slice(1))
        } else {
          this.#filters.tags.push(tag)
        }
      })
    } else {
      this.#filters[layer].push(...values)
    }
  }

  /**
   * Check if refiner allows a specific test or group to run by looking
   * at the applied filters
   */
  allows(testOrGroup: Test<any, any> | Group<any>): boolean {
    if (testOrGroup instanceof Group) {
      return this.#isGroupAllowed(testOrGroup)
    }

    /**
     * Do not run lone tests when group filter is applied. It is responsibility
     * of the runner to attach groups to tests.
     */
    if (this.#filters.groups.length && !testOrGroup.parent) {
      return false
    }

    /**
     * Layer 1
     */
    const isTestTitleAllowed = this.#isTestTitleAllowed(testOrGroup)
    if (!isTestTitleAllowed) {
      return false
    }

    /**
     * Layer 2
     */
    const areTestTagsAllowed = this.#areTestTagsAllowed(testOrGroup)
    if (!areTestTagsAllowed) {
      return false
    }

    /**
     * Layer 3
     */
    return this.#isAllowedByPinnedTest(testOrGroup)
  }
}
