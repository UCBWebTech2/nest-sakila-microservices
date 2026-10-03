import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppConfigModule } from './config/config.module.js';
import { HealthModule } from './app/health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { StaffsModule } from './modules/staffs/staffs.module.js';
import { StoresModule } from './modules/stores/stores.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { RentalsModule } from './modules/rentals/rentals.module.js';

@Module({
    imports: [
        AppConfigModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            // Written to disk for editor/tooling introspection during local dev, where src/ exists
            // next to cwd. The Docker runner image only ships dist/ (no src/, no write access as
            // the non-root user) — `true` builds the schema in memory instead, which is all that's
            // needed at runtime either way.
            autoSchemaFile: existsSync(join(process.cwd(), 'src')) ? join(process.cwd(), 'src/schema.gql') : true,
            sortSchema:     true,
            playground:     true,
        }),
        HealthModule,
        DatabaseModule,
        StaffsModule,
        StoresModule,
        PaymentsModule,
        RentalsModule,
    ],
})
export class AppModule {}
