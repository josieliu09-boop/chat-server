const express = require('express')
const cors = require('cors')
const pool = require('./db')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'server is running' })
})

// 保存消息
app.post('/messages', async (req, res) => {
  const { session_id, role, content } = req.body
  const result = await pool.query(
    'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING *',
    [session_id, role, content]
  )
  res.json(result.rows[0])
})

// 获取某个会话的消息
app.get('/messages/:session_id', async (req, res) => {
  const { session_id } = req.params
  const result = await pool.query(
    'SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC',
    [session_id]
  )
  res.json(result.rows)
})

app.listen(3000, () => {
  console.log('server started on port 3000')
})
//保存会话
app.post('/sessions',async(req,res)=>{
  const {id,title}=req.body
  await pool.query(
    'INSERT INTO sessions(id,title) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET title =$2',
  [id,title]
  )
  res.json({success:true})
})

//获取所有会话
app.get('/sessions',async(req,res)=>{
  const result = await pool.query(
    'SELECT * FROM sessions ORDER BY created_at ASC'
  )
  res.json(result.rows)
}

)