import { app } from '../../main/app';

import { expect } from 'chai';
import request from 'supertest';

describe('Home route', () => {
  describe('GET /', () => {
    test('redirects to /welcome when no session', async () => {
      await request(app)
        .get('/')
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers['location']).to.equal('/welcome');
        });
    });
  });
});

describe('Welcome route', () => {
  describe('GET /welcome', () => {
    test('returns 200 with welcome page', async () => {
      await request(app)
        .get('/welcome')
        .expect(res => expect(res.status).to.equal(200));
    });
  });

  describe('POST /welcome', () => {
    test('redirects to /tasks when name is provided', async () => {
      await request(app)
        .post('/welcome')
        .send('actorName=Alice+Test')
        .expect(res => {
          expect(res.status).to.equal(302);
          expect(res.headers['location']).to.equal('/tasks');
        });
    });

    test('returns 200 with errors when name is empty', async () => {
      await request(app)
        .post('/welcome')
        .send('actorName=')
        .expect(res => expect(res.status).to.equal(200));
    });
  });
});

describe('Sign out route', () => {
  describe('POST /sign-out', () => {
    test('clears session and redirects to welcome', async () => {
      const agent = request.agent(app);
      await agent.post('/welcome').send('actorName=Alice').expect(302);
      const signOut = await agent.post('/sign-out').expect(303);
      expect(signOut.headers.location).to.equal('/welcome');
      await agent.get('/tasks').expect(res => {
        expect(res.status).to.equal(302);
        expect(res.headers.location).to.equal('/welcome');
      });
    });
  });
});
