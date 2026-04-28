const { Pool } = require('pg')

const pool = new Pool({
  database: 'chatdb',
  user: 'liuqian',
})

module.exports = pool