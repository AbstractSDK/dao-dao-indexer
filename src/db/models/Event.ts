import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'

import { Contract } from './Contract'

@Table({
  timestamps: true,
  indexes: [
    // Only one event can happen to a key for a given contract at a given block
    // height. This ensures events are not duplicated if they attempt exporting
    // multiple times.
    {
      unique: true,
      fields: ['blockHeight', 'contractAddress', 'key'],
    },
  ],
})
export class Event extends Model {
  @AllowNull(false)
  @ForeignKey(() => Contract)
  @Column
  contractAddress: string

  @BelongsTo(() => Contract)
  contract: Contract

  @AllowNull(false)
  @Column
  blockHeight: bigint

  @AllowNull(false)
  @Column
  blockTimeUnixMicro: bigint

  // Key is stored as a comma separated list of uint8 values that represents a
  // byte array. The byte array datatype doesn't allow for prefix queries, so we
  // have to manually encode binary data in a format that allows for
  // database-level prefix queries (i.e. LIKE prefix%). We want database-level
  // prefixing so we can efficiently query for all values in a map.
  @AllowNull(false)
  @Column(DataType.TEXT)
  key: string

  // JSON encoded value.
  @AllowNull
  @Column(DataType.TEXT)
  value: string

  @AllowNull(false)
  @Column
  delete: boolean
}
