import { test } from 'node:test'
// @ts-ignore
import { tap } from 'node:test/reporters'
import { fsReadAll } from '@poppinss/utils'

test
  .run({
    files: await fsReadAll(new URL('../test', import.meta.url), { pathType: 'absolute' }),
  })
  // @ts-ignore
  .compose(tap)
  .pipe(process.stdout)
