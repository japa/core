/**
 * @module Core
 */

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import * as fg from 'fast-glob'

export class Loader {
  private _glob: string[] | string
  private _filterFn: (file: string) => void

  /**
   * Define the glob for the files
   */
  public files (glob: string[] | string): void {
    this._glob = glob
  }

  /**
   * Define a custom filter function to filter files
   */
  public filter (cb: (file: string) => void) {
    this._filterFn = cb
  }

  /**
   * Returns an array of sorted files based on the glob
   * pattern.
   */
  public async loadFiles (): Promise<string[]> {
    if (!this._glob) {
      return []
    }

    let filesPaths = await fg(this._glob, {
      absolute: true,
      onlyFiles: false,
    }) as string[]

    /**
     * If filterFn is defined, then filter the files
     */
    if (typeof (this._filterFn) === 'function') {
      filesPaths = filesPaths.filter((file) => this._filterFn(file))
    }

    return filesPaths.sort()
  }
}
