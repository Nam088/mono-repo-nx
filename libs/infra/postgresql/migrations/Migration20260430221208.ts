import { Migration } from '@mikro-orm/migrations';

export class Migration20260430221208 extends Migration {
    override up(): void | Promise<void> {
        this.addSql(
            `create table "users" ("id" varchar(255) not null, "email" varchar(120) not null, "name" varchar(120) not null, primary key ("id"));`,
        );
    }
}
