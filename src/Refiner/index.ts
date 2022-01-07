/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Test } from '../Test'
import { FilteringOptions, DataSetNode } from '../Contracts'

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
   * A set of pinned tests
   */
  private pinnedTests: Set<Test<DataSetNode>> = new Set()

  constructor(private filters: FilteringOptions) {}

  /**
   * Pin a test to be executed.
   */
  public pinTest(test: Test<DataSetNode>): void {
    this.pinnedTests.add(test)
  }

  /**
   * Returns a set of all the pinned tests
   */
  public getPinned(): Set<Test<DataSetNode>> {
    return this.pinnedTests
  }

  /**
   * Find if a test is pinned
   */
  public isPinned(test: Test<DataSetNode>): boolean {
    return this.pinnedTests.has(test)
  }

  /**
   * Returns the filters array for a given layer
   */
  public get(layer: 'test' | 'tags' | 'group'): string[] {
    if (layer === 'test') {
      this.filters.tests = this.filters.tests || []
      return this.filters.tests
    }

    if (layer === 'tags') {
      this.filters.tags = this.filters.tags || []
      return this.filters.tags
    }

    if (layer === 'group') {
      this.filters.groups = this.filters.groups || []
      return this.filters.groups
    }

    throw new Error(`Cannot apply filter. Invalid layer "${layer}"`)
  }

  /**
   * Add a filteration value to a given layer
   */
  public add(layer: 'test' | 'tags' | 'group', values: string[]): void {
    let filters = this.get(layer)
    filters.push(...values)
  }

  /**
   * Find if filters for a given layer + value has been applied or not
   */
  public has(layer: 'test' | 'tags' | 'group', value?: string): boolean {
    const filters = this.get(layer)

    /**
     * No filters have been applied. Hence we can return early
     */
    if (!filters.length) {
      return false
    }

    /**
     * Filters has been applied and there is no need to search
     * for a specific value
     */
    if (!value) {
      return true
    }

    return filters.includes(value)
  }

  /**
   * Returns the size of filters applied on a given layer
   */
  public size(layer: 'test' | 'tags' | 'group'): number {
    return this.get(layer).length
  }

  /**
   * Check if any of the defined values are applied as filters
   * on a given layer
   */
  public hasAny(layer: 'test' | 'tags' | 'group', values: string[]): boolean {
    const filters = this.get(layer)

    /**
     * No filters have been applied. Hence we can return early
     */
    if (!filters.length) {
      return false
    }

    return values.some((value) => filters.includes(value))
  }

  /**
   * Check if any of the defined values are applied as filters
   * on a given layer
   */
  public hasAll(layer: 'test' | 'tags' | 'group', values: string[]): boolean {
    const filters = this.get(layer)

    /**
     * No filters have been applied. Hence we can return early
     */
    if (!filters.length) {
      return false
    }

    return values.every((value) => filters.includes(value))
  }

  /**
   * Check if refiner allows a specific test or group to run by looking
   * at the applied filters
   */
  public allows(layer: 'test' | 'tags' | 'group', values: string | string[]): boolean {
    const filters = this.get(layer)

    /**
     * Allow when not filters for the given layer are applied
     */
    if (!filters.length) {
      return true
    }

    /**
     * Match string value
     */
    if (typeof values === 'string') {
      return filters.includes(values)
    }

    /**
     * Match for array of values
     */
    return values.some((value) => filters.includes(value))
  }
}
