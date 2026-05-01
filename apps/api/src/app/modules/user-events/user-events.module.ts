import { Module } from '@nestjs/common';

import { UserEventsConsumerService } from './user-events-consumer.service';

@Module({
    providers: [UserEventsConsumerService],
})
export class UserEventsModule {}
