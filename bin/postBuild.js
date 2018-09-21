/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const fs = require('fs')
const { join } = require('path')

fs.copyFileSync(join(__dirname, '../src/', 'Assert/index.d.ts'), join(__dirname, '../build/src', 'Assert/index.d.ts'))
