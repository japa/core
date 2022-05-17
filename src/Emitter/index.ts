/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Emittery from 'emittery'
import { RunnerEvents } from '../Contracts'

/**
 * Runner emitter
 */
export class Emitter extends Emittery<RunnerEvents> {
  private errorHandler?: (error: any) => void | Promise<void>

  /**
   * Define onError handler invoked when `emit` fails
   */
  public onError(errorHandler: (error: any) => void | Promise<void>) {
    this.errorHandler = errorHandler
  }

  /**
   * Emit event
   */
  public async emit<Name extends keyof RunnerEvents>(
    eventName: Name,
    eventData?: RunnerEvents[Name],
    allowMetaEvents?: boolean
  ): Promise<void> {
    try {
      await (super.emit as any)(eventName, eventData!, allowMetaEvents)
    } catch (error) {
      if (this.errorHandler) {
        await this.errorHandler(error)
      } else {
        throw error
      }
    }
  }
}
