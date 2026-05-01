import { Migration } from '@mikro-orm/migrations';

export class Migration20260501110600 extends Migration {
    override up(): void | Promise<void> {
        this.addSql(`alter table "users" add column "password_hash" varchar(255) not null default '';`);
        this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);
        this.addSql(`alter table "users" alter column "password_hash" drop default;`);

        this.addSql(
            `create table "idempotency_keys" ("id" varchar(255) not null, "idempotency_key" varchar(160) not null, "operation" varchar(80) not null, "request_hash" varchar(64) not null, "status" varchar(20) not null, "response_code" int null, "response_body" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "completed_at" timestamptz null, constraint "idempotency_keys_pkey" primary key ("id"));`,
        );
        this.addSql(
            `alter table "idempotency_keys" add constraint "idempotency_keys_idempotency_key_operation_unique" unique ("idempotency_key", "operation");`,
        );

        this.addSql(
            `create table "outbox_events" ("id" varchar(255) not null, "aggregate_type" varchar(80) not null, "aggregate_id" varchar(120) not null, "event_type" varchar(80) not null, "payload" jsonb not null, "status" varchar(20) not null, "retry_count" int not null default 0, "next_retry_at" timestamptz null, "published_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "outbox_events_pkey" primary key ("id"));`,
        );
        this.addSql(`create index "outbox_events_status_index" on "outbox_events" ("status");`);
        this.addSql(`create index "outbox_events_next_retry_at_index" on "outbox_events" ("next_retry_at");`);
        this.addSql(`create index "outbox_events_created_at_index" on "outbox_events" ("created_at");`);

        this.addSql(
            `create table "processed_messages" ("id" varchar(255) not null, "message_id" varchar(120) not null, "consumer_name" varchar(120) not null, "processed_at" timestamptz not null, constraint "processed_messages_pkey" primary key ("id"));`,
        );
        this.addSql(
            `alter table "processed_messages" add constraint "processed_messages_message_id_consumer_name_unique" unique ("message_id", "consumer_name");`,
        );
    }
}
