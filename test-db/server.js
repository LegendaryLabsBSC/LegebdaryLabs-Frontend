require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const {MongoClient} = require('mongodb')
const {ObjectId} = require('mongodb')

const app = express()

const port = process.env.PORT || 3001;
const HOST = process.env.MODE === 'dev' ? process.env.HOST_DEV : process.env.HOST_PROD
const MONGO_URL = `mongodb://admin:password@localhost:27017`
const MONGO_OPTIONS = { useUnifiedTopology: true, authSource: 'admin' }
// DBs
const DATABASE = 'test'
// Tables
const USER_TABLE = 'users'
const TEST_TABLE = 'test'
// Endpoints
const USERS_ENDPOINT = '/api/users'
const POSITION_ENDPOINT = '/api/positions'
const TEST_ENDPOINT = '/api/test'

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

async function getUsers(response,client) {
  const responses = []
  const cursor = client.db(DATABASE).collection(USER_TABLE).find()
  await cursor.forEach( el => {
    responses.push(el)
  })
  response.send(responses)
}

async function populate(client,body) {
  await client.db(DATABASE).collection(body.table).insertMany(body.records)
}

async function logout(client) {
  await client.db(DATABASE).collection(USER_TABLE).updateOne(
    {signedIn:true},
    { $set: {signedIn:false} }
  )
}
async function login(client,_id) {
  await client.db(DATABASE).collection(USER_TABLE).updateOne(
    {_id: ObjectId(_id)},
    { $set: {signedIn:true} }
  )
}

async function test(client) {
  await client.db(DATABASE).collection(TEST_TABLE).insertOne({
    "this": 'this',
    "is": 'is',
    "a": 'a',
    "test": 'test',
  })
}

async function deletePosition(client,_id) {
  await client.db(DATABASE).collection(TEST_TABLE).deleteOne({_id: ObjectId(_id)})
}

async function changePassword(client,_id,newPassword) {
  await client.db(DATABASE).collection(USER_TABLE).updateOne(
    {_id: ObjectId(_id)},
    { $set: {
        password:newPassword,
        signedIn:false
      } 
    }
  )
}

async function updateCash(client,_id,tradeValue) {
  await client.db(DATABASE).collection(USER_TABLE).updateOne(
    {_id: ObjectId(_id)},
    { $inc: { cash: tradeValue * -1 } }
  )
}

app.get(USERS_ENDPOINT, (req, res) => {
  console.log('GET user  ',req.body)
  MongoClient.connect(MONGO_URL, MONGO_OPTIONS, (err, client) => {
    if (err) throw err  
    getUsers(res, client)      
  })
})

app.put(USERS_ENDPOINT, (req, res) => {
  console.log('PUT   ',req.body)  
  MongoClient.connect(MONGO_URL, MONGO_OPTIONS, (err, client) => {
    if (err) throw err
    if (req.body.function === 'logout'){logout(client)}
    if (req.body.function === 'login'){login(client, req.body._id)}
    if (req.body.function === 'changePassword'){changePassword(client, req.body._id, req.body.newPassword)}
    if (req.body.function === 'populate'){populate(client, req.body)}
    if (req.body.function === 'updateCash'){updateCash(client, req.body._id, req.body.tradeValue)}
  })
})

app.post(TEST_ENDPOINT, (req, res) => {
  MongoClient.connect(MONGO_URL, MONGO_OPTIONS, (err, client) => {
    if (err) throw err  
    test(client)      
  })
  console.log('POST  ',req.body);
  res.send({"hey":"buddy"})
})

app.get(TEST_ENDPOINT, (req, res) => {
  res.send({"hey":"buddy"})
})

app.delete(POSITION_ENDPOINT, (req, res) => {
  console.log('DELETE',req.body);
  MongoClient.connect(MONGO_URL, MONGO_OPTIONS, (err, client) => {
    if (err) throw err  
    deletePosition(client, req.body._id)      
  })
})

app.listen(port, () => console.log(`Listening on port ${port}`))
