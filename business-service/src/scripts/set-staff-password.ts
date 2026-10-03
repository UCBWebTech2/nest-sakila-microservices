import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Client } from 'pg';

// One-off helper: gives an existing staff member a bcrypt password so they can log in.
//
// Why it exists: Sakila's own staff rows (Mike, Jon) keep the password as a SHA-1 hash, while the
// login of this ecosystem compares bcrypt. Until one of them gets a bcrypt hash nobody can sign in,
// and there is no public endpoint to create the first user (every route needs a token).
//
// It is a plain Node script — no shell features — so it behaves the same on Windows, macOS and Linux:
//   from the host:    npm run set-staff-password -- <username> <password>
//   inside Docker:    docker compose exec business-service node dist/scripts/set-staff-password.js <username> <password>
//
// Connection settings come from the same DB_* variables the service uses (the .env file on the host,
// the container's environment inside Docker).

const [username, password] = process.argv.slice(2);

if (!username || !password) {
    console.error('Usage: set-staff-password <username> <password>');
    console.error('Example: set-staff-password Mike MyPassword123');
    process.exit(1);
}

const client = new Client({
    host:     process.env.DB_HOST ?? 'localhost',
    port:     Number(process.env.DB_PORT ?? 5432),
    user:     process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'sakila',
});

try {
    await client.connect();
    const hash = await bcrypt.hash(password, 10);
    const result = await client.query(
        'UPDATE staff SET password = $1, last_update = now() WHERE username = $2 RETURNING staff_id',
        [hash, username],
    );

    if (result.rowCount === 0) {
        const existing = await client.query('SELECT username FROM staff ORDER BY staff_id');
        console.error(`No staff member with username "${username}". Existing usernames: ${existing.rows.map((r) => r.username).join(', ')}`);
        process.exitCode = 1;
    } else {
        console.log(`Password updated for "${username}". You can now log in with it.`);
    }
} catch (err) {
    console.error(`Could not update the password: ${(err as Error).message}`);
    console.error('Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME in this service\'s .env.');
    process.exitCode = 1;
} finally {
    await client.end().catch(() => undefined);
}
