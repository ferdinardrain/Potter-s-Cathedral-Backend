const pool = require('./config/database');

async function checkDatabase() {
    try {
        const tables = ['members', 'trash_members'];
        for (const table of tables) {
            console.log(`\n--- Checking table: ${table} ---`);
            const res = await pool.query(`
        SELECT count(*) FROM ${table};
      `);
            console.log(`Current row count: ${res.rows[0].count}`);

            // Check for triggers
            const triggers = await pool.query(`
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = $1;
      `, [table]);
            console.log(`Triggers:`, triggers.rows);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDatabase();
