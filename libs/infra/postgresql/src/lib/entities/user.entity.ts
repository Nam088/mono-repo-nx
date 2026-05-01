import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';

@Unique({ properties: ['email'] })
@Entity({ tableName: 'users' })
export class UserEntity {
    @PrimaryKey({ type: 'string' })
    id: string = uuidv4();

    @Property({ type: 'string', length: 120 })
    email!: string;

    @Property({ type: 'string', length: 120 })
    name!: string;

    @Property({ type: 'string', length: 255, fieldName: 'password_hash' })
    passwordHash!: string;
}
