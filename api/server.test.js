const server = require('./server');
const request = require('supertest');
const db = require('../data/dbConfig');

const testuser1 = { username: "someperson", password: "1234"}

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
    let res = await request(server).post('/api/auth/register').send({ username: "someperson"});
    expect(res.text).toMatch('username and password required')
  })
  test('POST api/auth/register will accept valid username or password and respond correctly', async () => {
    let res = await request(server).post('/api/auth/register').send(testuser1);
    expect(res.body).toMatchObject({ id: 1, username: "someperson" })
  })
  test('POST api/auth/login will not work if user is missing from the database and responds with correct message', async () => {
    await request(server).post('/api/auth/register').send(testuser1)
    let res = await request(server).post('/api/auth/login').send({ username: "adifferentperson", password: "1234"});
    expect(res.text).toMatch("invalid credentials")
  })
  test('POST api/auth/login will respond with welcome message if username and password are correct', async () => {
    await request(server).post('/api/auth/register').send(testuser1)
    let res = await request(server).post('/api/auth/login').send(testuser1);
    expect(res.body).toMatchObject({ message: `Welcome, ${testuser1.username}` })
  })
  test('GET /api/jokes will reject a user without a token or with an invalid token', async () => {
    let res = await request(server).get('/api/jokes');
    expect(res.body).toMatchObject({message: "token required"})
  })
  test('GET /api/jokes will return an array of jokes if user has a valid token', async () => {
    await request(server).post('/api/auth/register').send(testuser1)
    let res = await request(server).post('/api/auth/login').send(testuser1);
    let res2 = await request(server).get('/api/jokes').set('Authorization', res.body.token )
    expect(res2.body).toHaveLength(3)
    expect(res2.body).toContainEqual({"id": "0189hNRf2g", "joke": "I'm tired of following my dreams. I'm just going to ask them where they are going and meet up with them later."})
  })
})
