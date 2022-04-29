const server = require('./server');
const request = require('supertest');
const db = require('../data/dbConfig');



// Write your tests here
test('sanity', () => {
  expect(true).toBe(true)
})

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();   
});

afterAll(async () => {
  await db.destroy();
});

test('make sure our environment is set correctly', () => {
  expect(process.env.NODE_ENV).toBe('testing');
});

test('server is up', async () => {
  const res = await request(server).get('/');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ api: 'up' });
});

describe('HTTP API tests', () => {
  test('POST api/auth/register will not accept missing username or password and responds with correct message', async () => {
    let res = await request(server).post('api/auth/register').send({ username: "someperson"});
    console.log(res)
    expect(res).toContain('username and password required')
  })
  // test('POST api/auth/register will accept valid username or password and respond correctly', () => {

  // })
  // test('POST api/auth/login will not work if user is missing from the database and responds with correct message', () => {

  // })
  // test('POST api/auth/login will respond with welcome message if username and password are correct', () => {

  // })
  // test('GET /api/jokes will reject a user without a token or with an invalid token', () => {

  // })
  // test('GET /api/jokes will return an array of jokes if user has a valid token', () => {
  //   const res
  // })
})
