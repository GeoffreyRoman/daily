import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: 'postgresql-geoffreyr.alwaysdata.net',
    port: 5432,
    database: 'geoffreyr_pg',
    user: 'geoffreyr',
    password: 'dijqaV-ninte7-gecxar',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export default pool; 
