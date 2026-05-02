import { Migration } from '@mikro-orm/migrations';

export class Migration20260502120000 extends Migration {
    override up(): void | Promise<void> {
        this.addSql(`drop table if exists "processed_messages" cascade;`);
        this.addSql(`drop table if exists "outbox_events" cascade;`);
        this.addSql(`drop table if exists "idempotency_keys" cascade;`);
    }
}
