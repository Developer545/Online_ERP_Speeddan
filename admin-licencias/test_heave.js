const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_ELPRDz15qjxn@ep-soft-hat-aii9jukd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
    await client.connect();
    try {
        const res1 = await client.query('SELECT id, subdominio FROM "Emisor" WHERE subdominio = $1', ['heave']);
        console.log('Emisor:', res1.rows);
        const res2 = await client.query('SELECT id, username, "passwordHash", "empresaId" FROM "User" WHERE username = $1', ['heave']);
        console.log('User:', res2.rows);
    } catch (e) {
        console.error('SQL Error:', e);
    }
    await client.end();
}

run().catch(console.error);
