const morgan = require('morgan')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const express = require('express')
const cors = require('cors')
const pool = require('./db')

const app = express()
app.use(helmet())
app.use(morgan('dev'))
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://react-chat-demo-sigma.vercel.app' : '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'authorization']
}))
app.use(express.json())
//限流规则
const loginLimiter = rateLimit({
  WindowMs: 15 * 60 * 1000,//15分钟
  max: 10,//最多10次请求
  message: { message: 'Too many requests,please try again later' }
})

const authRouter = require('./auth')
const authMiddleware = require('./middleware')
app.use('/auth', loginLimiter, authRouter)

app.get('/', (req, res) => {
  res.json({ message: 'server is running' })
})


// 保存消息
app.post('/messages', authMiddleware, async (req, res, next) => {
  try {
    const { session_id, role, content } = req.body
    const user_id = req.user.id
    const result = await pool.query(
      'INSERT INTO messages (session_id, role, content,user_id) VALUES ($1, $2, $3,$4) RETURNING *',
      [session_id, role, content, user_id]
    )
    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// 获取某个会话的消息
app.get('/messages/:session_id', authMiddleware, async (req, res, next) => {
  try {
    const { session_id } = req.params
    const user_id = req.user.id
    const page = parseInt(req.query.page)|| 1
    const limit = parseInt(req.query.limit)|| 20
    const offset = (page - 1) * limit
    const result = await pool.query(
      'SELECT * FROM messages WHERE session_id = $1 AND user_id=$2 ORDER BY created_at ASC LIMIT $3 OFFSET $4',
      [session_id, user_id,limit,offset]
    )
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

app.listen(3000, () => {
  console.log('server started on port 3000')
})
//保存会话
app.post('/sessions', authMiddleware, async (req, res, next) => {
  try {
    const { id, title } = req.body
    const user_id = req.user.id
    await pool.query(
      'INSERT INTO sessions(id,title,user_id) VALUES ($1,$2,$3) ON CONFLICT(id) DO UPDATE SET title =$2',
      [id, title, user_id]
    )
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

//获取所有会话
app.get('/sessions', authMiddleware, async (req, res, next) => {
  try {
    const user_id = req.user.id
    const result = await pool.query(
      'SELECT * FROM sessions where user_id=$1 ORDER BY created_at ASC',
      [user_id]
    )
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
}

)

//删除会话
app.delete('/sessions/:id', authMiddleware, async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { id } = req.params
    const user_id = req.user.id
    await client.query('BEGIN')
    await client.query('DELETE FROM messages WHERE session_id = $1 AND user_id = $2', [id, user_id])
    await client.query('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [id, user_id])
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: 'Something went wrong'
  })

})
