#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/a476d3191398d247d6398eae87a8c809ec3f6444aa2257f8871212f4fa01a615/contract';
import endContract from '../../snapshots/a476d3191398d247d6398eae87a8c809ec3f6444aa2257f8871212f4fa01a615/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/daf050b1034eeca8342d8560df0415404d332f8ae4283d19f54548ad57f990b8/contract';
import startContract from '../../snapshots/daf050b1034eeca8342d8560df0415404d332f8ae4283d19f54548ad57f990b8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'user',
        column: 'password',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
