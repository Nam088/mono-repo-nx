import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';

@Unique({ properties: ['messageId', 'consumerName'] })
@Entity({ tableName: 'processed_messages' })
export class ProcessedMessageEntity {
    @PrimaryKey({ type: 'string' })
    id: string = uuidv4();

    @Property({ type: 'string', length: 120, fieldName: 'message_id' })
    messageId!: string;

    @Property({ type: 'string', length: 120, fieldName: 'consumer_name' })
    consumerName!: string;

    @Property({ type: 'datetime', fieldName: 'processed_at' })
    processedAt: Date = new Date();
}
