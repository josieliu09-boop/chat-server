const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('./db')

const router = express.Router()
router.use(express.json())

router.post('/register',async(req,res)=>{
    const {email,password}=req.body
    const hashed = await bcrypt.hash(password,10)
    const result= await pool.query(
        'INSERT INTO users (email,password) VALUES ($1,$2) RETURNING id, email',
        [email,hashed]
    )
    res.json(result.rows[0])
})

router.post('/login',async(req,res)=>{
    console.log('request body:', req.body)
console.log('content-type:', req.headers['content-type'])

    const{email,password}=req.body
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    )
    const user = result.rows[0]
    if (!user) {
        return res.status(401).json({message:'user not found'})
    }
    const valid = await bcrypt.compare(password,user.password)
    if (!valid) {
        return res.status(401).json({message:'wrong password'})
    }
    const token = jwt.sign({id:user.id,email:user.email},'secret123',{expiresIn:'7d'})
    res.json({token})
})

module.exports = router