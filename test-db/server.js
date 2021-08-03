require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const {MongoClient} = require('mongodb')

const app = express()

const port = process.env.PORT || 3001;
const MONGO_URL = `mongodb://admin:password@localhost:27017`
const MONGO_OPTIONS = { useUnifiedTopology: true, authSource: 'admin' }
// DBs
const DATABASE = 'test'
// Tables
const TEST_TABLE = 'test'
// Endpoints
const TEST_ENDPOINT = '/api/test'

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

async function getNFTs(response,client) {
  const responses = []
  const cursor = client.db(DATABASE).collection(TEST_TABLE).find()
  await cursor.forEach( el => {
    responses.push(el)
  })
  response.send(responses)
}

async function test(client, body) {
  await client.db(DATABASE).collection(TEST_TABLE).insertOne({
    "red": body.red,
    "blue": body.blue,
    "green": body.green,
    "timestamp": new Date().toString(),
  })
}

app.get(TEST_ENDPOINT, (req, res) => {
  console.log('GET NFTs  ',req.body)
  MongoClient.connect(MONGO_URL, MONGO_OPTIONS, (err, client) => {
    if (err) throw err  
    getNFTs(res, client)      
  })
})

app.post(TEST_ENDPOINT, (req, res) => {
  MongoClient.connect(MONGO_URL, MONGO_OPTIONS, (err, client) => {
    if (err) throw err  
    test(client, req.body)      
  })
  console.log('POST  ',req.body);
})

app.listen(port, () => console.log(`Listening on port ${port}`))
