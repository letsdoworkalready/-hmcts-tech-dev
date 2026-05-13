import { app } from '../../main/app';

import { expect } from 'chai';
import nock from 'nock';
import request from 'supertest';

const apiOrigin = 'http://localhost:4000';

function minimalTask(overrides: Record<string, unknown>) {
  return {
    id: 1,
    title: 'Task',
    description: '',
    status: 'TODO',
    dueDateTime: '2026-06-01T12:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 'Test',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'Test',
    ...overrides,
  };
}

describe('Tasks routes', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('GET /tasks', () => {
    it('redirects to welcome when not signed in', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).to.equal(302);
      expect(res.headers.location).to.equal('/welcome');
    });

    it('returns 200 with kanban when signed in and API returns tasks', async () => {
      nock(apiOrigin)
        .get('/tasks')
        .reply(200, [minimalTask({ id: 1, title: 'Kanban card title', status: 'TODO' })]);

      const agent = request.agent(app);
      await agent.post('/welcome').send('actorName=RouteTester').expect(302);

      const res = await agent.get('/tasks').expect(200);
      expect(res.text).to.contain('Kanban card title');
      expect(res.text).to.contain('Kanban view');
    });

    it('returns 200 with list filters when view=list and tasks exist', async () => {
      nock(apiOrigin)
        .get('/tasks')
        .reply(200, [
          minimalTask({ id: 1, title: 'Earlier', dueDateTime: '2026-06-01T12:00:00.000Z' }),
          minimalTask({ id: 2, title: 'Later', dueDateTime: '2026-06-20T12:00:00.000Z' }),
        ]);

      const agent = request.agent(app);
      await agent.post('/welcome').send('actorName=ListTester').expect(302);

      const res = await agent.get('/tasks?view=list').expect(200);
      expect(res.text).to.contain('Filters');
      expect(res.text).to.contain('Earlier');
      expect(res.text).to.contain('Later');
      const earlierPos = res.text.indexOf('Earlier');
      const laterPos = res.text.indexOf('Later');
      expect(earlierPos).to.be.lessThan(laterPos);
    });

    it('returns 200 with error banner when the task API fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      nock(apiOrigin).get('/tasks').reply(503, { message: 'Service unavailable' });

      const agent = request.agent(app);
      await agent.post('/welcome').send('actorName=ErrorTester').expect(302);

      try {
        const res = await agent.get('/tasks').expect(200);
        expect(res.text).to.contain('Could not load tasks');
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('GET /tasks/new', () => {
    it('redirects to welcome when not signed in', async () => {
      const res = await request(app).get('/tasks/new');
      expect(res.status).to.equal(302);
      expect(res.headers.location).to.equal('/welcome');
    });
  });
});
