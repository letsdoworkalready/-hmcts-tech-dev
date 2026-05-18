import { Application, Request, Response } from 'express';

import axios from 'axios';
import { requireActor } from '../middleware/requireActor';
import {
  consumeErrorFlash,
  consumeSuccessFlash,
  setErrorFlash,
  setSuccessFlash,
} from '../utils/flashSuccess';

const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

const jsonHeaders = { 'Content-Type': 'application/json' };

interface TaskResponse {
  id: number;
  title: string;
  description?: string;
  status: string;
  dueDateTime: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

type FieldErrors = { title?: string; description?: string; status?: string; dueDateTime?: string };
type FormError = { text: string; href: string };

interface ApiErrorBody {
  message?: string;
  errors?: unknown[];
}

const ALLOWED_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

type TaskFormBody = {
  title?: string;
  description?: string;
  status?: string;
  dueDateTime?: string;
};

function actorHeader(req: Request): Record<string, string> {
  return { 'X-Actor-Name': req.session.actorName! };
}

function formatForInput(isoString: string): string {
  if (!isoString) return '';
  return isoString.slice(0, 16);
}

function toFieldErrors(errors: FormError[]): FieldErrors {
  const map: FieldErrors = {};
  for (const e of errors) {
    if (e.href === '#title') map.title = e.text;
    if (e.href === '#description') map.description = e.text;
    if (e.href === '#status') map.status = e.text;
    if (e.href === '#dueDateTime') map.dueDateTime = e.text;
  }
  return map;
}

function logApiError(context: string, err: unknown): void {
  if (axios.isAxiosError(err)) {
    console.error(`[${context}] API error ${err.response?.status}:`, JSON.stringify(err.response?.data ?? err.message));
  } else {
    console.error(`[${context}] Unexpected error:`, err);
  }
}

/** datetime-local value to ISO string for the API; null if invalid */
function toIsoUtc(dueDateTimeRaw: string): string | null {
  const d = new Date(dueDateTimeRaw);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

/** Server-side checks aligned with API constraints (mandatory fields, lengths, allowed status). */
function validateTaskForm(
  body: TaskFormBody,
  options: { requireFutureDue: boolean }
): { errors: FormError[]; isoDue: string | null } {
  const errors: FormError[] = [];
  const { title, description, status, dueDateTime } = body;

  if (!title?.trim()) errors.push({ text: 'Enter a title', href: '#title' });
  else if (title.trim().length > 255) errors.push({ text: 'Title must be 255 characters or fewer', href: '#title' });

  if (typeof description === 'string' && description.length > 1000) {
    errors.push({ text: 'Description must be 1000 characters or fewer', href: '#description' });
  }

  if (!status) errors.push({ text: 'Select a status', href: '#status' });
  else if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    errors.push({ text: 'Select a valid status', href: '#status' });
  }

  let isoDue: string | null = null;
  if (!dueDateTime) errors.push({ text: 'Enter a due date and time', href: '#dueDateTime' });
  else {
    isoDue = toIsoUtc(dueDateTime);
    if (!isoDue) errors.push({ text: 'Enter a valid due date and time', href: '#dueDateTime' });
    else if (options.requireFutureDue && new Date(isoDue).getTime() <= Date.now()) {
      errors.push({ text: 'Due date and time must be in the future', href: '#dueDateTime' });
    }
  }

  return { errors, isoDue };
}

function buildFormErrorsFromAxios(err: unknown): { errorList: FormError[]; fieldErrors: FieldErrors } {
  if (!axios.isAxiosError(err)) {
    const t = 'An unexpected error occurred. Please try again.';
    return { errorList: [{ text: t, href: '#title' }], fieldErrors: { title: t } };
  }
  if (err.code === 'ECONNREFUSED') {
    const t = 'Could not connect to the task service. Is the backend running?';
    return { errorList: [{ text: t, href: '#title' }], fieldErrors: { title: t } };
  }

  const data = err.response?.data as ApiErrorBody | undefined;
  const rawErrors = data?.errors;

  if (Array.isArray(rawErrors) && rawErrors.length > 0) {
    const errorList: FormError[] = [];
    const fieldErrors: FieldErrors = {};
    for (const item of rawErrors) {
      if (typeof item !== 'string') continue;
      const sep = ': ';
      const p = item.indexOf(sep);
      const fieldName = p >= 0 ? item.slice(0, p) : '';
      const text = p >= 0 ? item.slice(p + sep.length) : item;
      let href = '#title';
      if (fieldName === 'description') href = '#description';
      else if (fieldName === 'status') href = '#status';
      else if (fieldName === 'dueDateTime') href = '#dueDateTime';
      errorList.push({ text, href });
      if (href === '#title') fieldErrors.title = text;
      if (href === '#description') fieldErrors.description = text;
      if (href === '#status') fieldErrors.status = text;
      if (href === '#dueDateTime') fieldErrors.dueDateTime = text;
    }
    if (errorList.length > 0) {
      return { errorList, fieldErrors };
    }
  }

  const msg = typeof data?.message === 'string' ? data.message : '';
  if (msg) {
    const lower = msg.toLowerCase();
    let href = '#title';
    if (lower.includes('due date') || lower.includes('duedate') || lower.includes('future')) {
      href = '#dueDateTime';
    } else if (lower.includes('status')) {
      href = '#status';
    } else if (lower.includes('description')) {
      href = '#description';
    }
    const fieldErrors: FieldErrors = {};
    if (href === '#title') fieldErrors.title = msg;
    if (href === '#description') fieldErrors.description = msg;
    if (href === '#status') fieldErrors.status = msg;
    if (href === '#dueDateTime') fieldErrors.dueDateTime = msg;
    return { errorList: [{ text: msg, href }], fieldErrors };
  }

  const fallback = 'An unexpected error occurred. Please try again.';
  return { errorList: [{ text: fallback, href: '#title' }], fieldErrors: { title: fallback } };
}

const LIST_STATUS_VALUES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
type ListStatusValue = (typeof LIST_STATUS_VALUES)[number];

function parseListIncludedStatuses(query: Request['query']): Set<ListStatusValue> {
  const raw = query.status;
  if (raw === undefined) {
    if (query.listFilter === '1') {
      return new Set();
    }
    return new Set(LIST_STATUS_VALUES);
  }
  const arr = Array.isArray(raw) ? raw : [raw];
  const set = new Set<ListStatusValue>();
  for (const s of arr) {
    if (typeof s === 'string' && LIST_STATUS_VALUES.includes(s as ListStatusValue)) {
      set.add(s as ListStatusValue);
    }
  }
  return set;
}

function parseListSort(query: Request['query']): 'due-asc' | 'due-desc' {
  return query.sort === 'due-desc' ? 'due-desc' : 'due-asc';
}

function applyListViewTransforms(tasks: TaskResponse[], query: Request['query']): TaskResponse[] {
  const included = parseListIncludedStatuses(query);
  const sort = parseListSort(query);
  const filtered = tasks.filter(t => included.has(t.status as ListStatusValue));
  return [...filtered].sort((a, b) => {
    const ta = new Date(a.dueDateTime).getTime();
    const tb = new Date(b.dueDateTime).getTime();
    const aNa = Number.isNaN(ta);
    const bNa = Number.isNaN(tb);
    if (aNa && bNa) return a.id - b.id;
    if (aNa) return 1;
    if (bNa) return -1;
    const cmp = sort === 'due-desc' ? tb - ta : ta - tb;
    if (cmp !== 0) return cmp;
    return a.id - b.id;
  });
}

export default function (app: Application): void {
  app.get('/tasks', requireActor, async (req: Request, res: Response) => {
    const view = req.query.view === 'list' ? 'list' : 'kanban';
    const successMessage = consumeSuccessFlash(req);
    const flashError = consumeErrorFlash(req);
    try {
      const { data: tasks } = await axios.get<TaskResponse[]>(`${apiBaseUrl}/tasks`);
      if (view === 'kanban') {
        res.render('tasks/kanban', {
          successMessage,
          apiError: flashError,
          tasks,
          columns: [
            { id: 'TODO', label: 'To do', tasks: tasks.filter(t => t.status === 'TODO') },
            { id: 'IN_PROGRESS', label: 'In progress', tasks: tasks.filter(t => t.status === 'IN_PROGRESS') },
            { id: 'DONE', label: 'Done', tasks: tasks.filter(t => t.status === 'DONE') },
          ],
          currentView: 'kanban',
        });
      } else {
        const totalTaskCount = tasks.length;
        const included = parseListIncludedStatuses(req.query);
        const displayTasks = applyListViewTransforms(tasks, req.query);
        res.render('tasks/list', {
          successMessage,
          apiError: flashError,
          tasks: displayTasks,
          totalTaskCount,
          currentView: 'list',
          listSort: parseListSort(req.query),
          statusFilter: {
            TODO: included.has('TODO'),
            IN_PROGRESS: included.has('IN_PROGRESS'),
            DONE: included.has('DONE'),
          },
        });
      }
    } catch (err) {
      logApiError('GET /tasks', err);
      const errorPayload = {
        tasks: [],
        apiError: flashError ?? 'Could not load tasks. Please try again.',
      };
      res.render(view === 'kanban' ? 'tasks/kanban' : 'tasks/list', {
        ...errorPayload,
        successMessage,
        columns: [
          { id: 'TODO', label: 'To do', tasks: [] },
          { id: 'IN_PROGRESS', label: 'In progress', tasks: [] },
          { id: 'DONE', label: 'Done', tasks: [] },
        ],
        currentView: view,
        totalTaskCount: 0,
        listSort: 'due-asc' as const,
        statusFilter: { TODO: true, IN_PROGRESS: true, DONE: true },
      });
    }
  });

  app.get('/tasks/new', requireActor, (_req: Request, res: Response) => {
    res.render('tasks/form', { mode: 'create', task: {}, errors: [], fieldErrors: {} });
  });

  app.post('/tasks', requireActor, async (req: Request, res: Response) => {
    const { title, description, status, dueDateTime } = req.body;
    const { errors, isoDue } = validateTaskForm(
      { title, description, status, dueDateTime },
      { requireFutureDue: true }
    );

    if (errors.length > 0) {
      res.render('tasks/form', { mode: 'create', task: req.body, errors, fieldErrors: toFieldErrors(errors) });
      return;
    }

    try {
      await axios.post(
        `${apiBaseUrl}/tasks`,
        { title, description, status, dueDateTime: isoDue },
        { headers: { ...jsonHeaders, ...actorHeader(req) } }
      );
      setSuccessFlash(req, 'Task created');
      res.redirect('/tasks');
    } catch (err: unknown) {
      logApiError('POST /tasks', err);
      const { errorList, fieldErrors } = buildFormErrorsFromAxios(err);
      res.render('tasks/form', { mode: 'create', task: req.body, errors: errorList, fieldErrors });
    }
  });

  app.get('/tasks/:id/edit', requireActor, async (req: Request, res: Response) => {
    try {
      const { data: task } = await axios.get<TaskResponse>(`${apiBaseUrl}/tasks/${req.params.id}`);
      res.render('tasks/form', {
        mode: 'edit',
        task: { ...task, dueDateTime: formatForInput(task.dueDateTime) },
        errors: [],
        fieldErrors: {},
      });
    } catch (err) {
      logApiError(`GET /tasks/${req.params.id}/edit`, err);
      res.redirect('/tasks');
    }
  });

  app.post('/tasks/:id/edit', requireActor, async (req: Request, res: Response) => {
    const { title, description, status, dueDateTime } = req.body;
    const { errors, isoDue } = validateTaskForm(
      { title, description, status, dueDateTime },
      { requireFutureDue: false }
    );

    if (errors.length > 0) {
      res.render('tasks/form', { mode: 'edit', task: { ...req.body, id: req.params.id }, errors, fieldErrors: toFieldErrors(errors) });
      return;
    }

    try {
      await axios.put(
        `${apiBaseUrl}/tasks/${req.params.id}`,
        { title, description, status, dueDateTime: isoDue },
        { headers: { ...jsonHeaders, ...actorHeader(req) } }
      );
      setSuccessFlash(req, 'Task updated');
      res.redirect('/tasks');
    } catch (err: unknown) {
      logApiError(`PUT /tasks/${req.params.id}`, err);
      const { errorList, fieldErrors } = buildFormErrorsFromAxios(err);
      res.render('tasks/form', {
        mode: 'edit',
        task: { ...req.body, id: req.params.id },
        errors: errorList,
        fieldErrors,
      });
    }
  });

  app.post('/tasks/:id/delete', requireActor, async (req: Request, res: Response) => {
    try {
      await axios.delete(`${apiBaseUrl}/tasks/${req.params.id}`, { headers: actorHeader(req) });
      setSuccessFlash(req, 'Task deleted');
    } catch (err) {
      logApiError(`DELETE /tasks/${req.params.id}`, err);
      setErrorFlash(req, 'Could not delete task. Please try again.');
    }
    res.redirect('/tasks');
  });

  app.post('/tasks/:id/status', requireActor, async (req: Request, res: Response) => {
    try {
      await axios.patch(
        `${apiBaseUrl}/tasks/${req.params.id}/status`,
        { status: req.body.status },
        { headers: { ...jsonHeaders, ...actorHeader(req) } }
      );
    } catch (err) {
      logApiError(`PATCH /tasks/${req.params.id}/status`, err);
    }
    res.redirect('/tasks');
  });
}
