import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';

@Entity({ tableName: 'users' })
export class UserEntity {
    @PrimaryKey({ type: 'string' })
    id: string = uuidv4();

    @Property({ type: 'string', length: 120 })
    email!: string;

    @Property({ type: 'string', length: 120 })
    name!: string;
}
