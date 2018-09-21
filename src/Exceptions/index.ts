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

/**
 * Raised when test or hook times out
 */
export class TimeoutException extends Error {}

/**
 * Raised when regression test passes instead of failing
 */
export class RegressionException extends Error {}

/**
 * Raised when assertion planning fails
 */
export class InvalidAssertionsCount extends Error {}
