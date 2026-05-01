import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';

export type OutboxStatus = 'pending' | 'published' | 'failed';

@Entity({ tableName: 'outbox_events' })
export class OutboxEventEntity {
    @PrimaryKey({ type: 'string' })
    id: string = uuidv4();

    @Property({ type: 'string', length: 80, fieldName: 'aggregate_type' })
    aggregateType!: string;

    @Property({ type: 'string', length: 120, fieldName: 'aggregate_id' })
    aggregateId!: string;

    @Property({ type: 'string', length: 80, fieldName: 'event_type' })
    eventType!: string;

    @Property({ type: 'json' })
    payload!: Record<string, unknown>;

    @Index()
    @Property({ type: 'string', length: 20 })
    status: OutboxStatus = 'pending';

    @Property({ type: 'number', fieldName: 'retry_count' })
    retryCount = 0;

    @Index()
    @Property({ type: 'datetime', nullable: true, fieldName: 'next_retry_at' })
    nextRetryAt?: Date;

    @Property({ type: 'datetime', nullable: true, fieldName: 'published_at' })
    publishedAt?: Date;

    @Index()
    @Property({ type: 'datetime', fieldName: 'created_at' })
    createdAt: Date = new Date();

    @Property({ type: 'datetime', fieldName: 'updated_at', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}
