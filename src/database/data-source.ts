import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { validateEnv } from '../config/env/validation';

const env = validateEnv(process.env as Record<string, unknown>);

export default new DataSource({
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: ['error'],
    ssl: env.DB_SSL
    ? {
        rejectUnauthorized: false,
      }
    : false,
});