const { Pool } = require('pg')

const pool = new Pool({
  database: process.env.DATABASE_NAME || 'chatdb',
  user: process.env.DATABASE_USER || 'liuqian'
})

module.exports = pool