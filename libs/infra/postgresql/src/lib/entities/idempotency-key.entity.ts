import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';

export type IdempotencyStatus = 'processing' | 'completed' | 'failed';

@Unique({ properties: ['idempotencyKey', 'operation'] })
@Entity({ tableName: 'idempotency_keys' })
export class IdempotencyKeyEntity {
    @PrimaryKey({ type: 'string' })
    id: string = uuidv4();

    @Property({ type: 'string', length: 160, fieldName: 'idempotency_key' })
    idempotencyKey!: string;

    @Property({ type: 'string', length: 80 })
    operation!: string;

    @Property({ type: 'string', length: 64, fieldName: 'request_hash' })
    requestHash!: string;

    @Property({ type: 'string', length: 20 })
    status: IdempotencyStatus = 'processing';

    @Property({ type: 'number', nullable: true, fieldName: 'response_code' })
    responseCode?: number;

    @Property({ type: 'json', nullable: true, fieldName: 'response_body' })
    responseBody?: Record<string, unknown>;

    @Property({ type: 'datetime', fieldName: 'created_at' })
    createdAt: Date = new Date();

    @Property({ type: 'datetime', fieldName: 'updated_at', onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Property({ type: 'datetime', nullable: true, fieldName: 'completed_at' })
    completedAt?: Date;
}
