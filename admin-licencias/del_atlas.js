const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_ELPRDz15qjxn@ep-soft-hat-aii9jukd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
    await client.connect();
    try {
        const resUser = await client.query('DELETE FROM "User" WHERE username = $1 RETURNING id', ['atlas']);
        console.log('Deleted Users:', resUser.rows);
        const resEmis = await client.query('DELETE FROM "Emisor" WHERE subdominio = $1 RETURNING id', ['atlas']);
        console.log('Deleted Emisores:', resEmis.rows);
    } catch (e) {
        console.error('SQL Error:', e);
    }
    await client.end();
}

run().catch(console.error);
