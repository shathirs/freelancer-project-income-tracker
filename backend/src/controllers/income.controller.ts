import type { Response } from 'express';
import { Income } from '../models/income.model.js';
import { Project } from '../models/project.model.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

type IncomeType = 'Payment' | 'Invoice';
type IncomeStatus = 'Paid' | 'Pending';

function readType(value?: string): IncomeType {
  return value === 'Invoice' ? 'Invoice' : 'Payment';
}

function readStatus(value?: string): IncomeStatus {
  return value === 'Paid' ? 'Paid' : 'Pending';
}

function readIncomeBody(body: {
  project?: string;
  type?: string;
  amount?: number | string;
  status?: string;
  date?: string;
}) {
  return {
    project: body.project?.trim() ?? '',
    type: readType(body.type),
    amount: Number(body.amount),
    status: readStatus(body.status),
    date: body.date ? new Date(body.date) : null,
  };
}

function projectName(project: unknown): string {
  return project && typeof project === 'object' && 'name' in project ? String(project.name) : '';
}

function clientName(project: unknown): string {
  if (!project || typeof project !== 'object' || !('client' in project)) {
    return '';
  }
  const client = project.client;
  return client && typeof client === 'object' && 'name' in client ? String(client.name) : '';
}

function clientIdOf(project: unknown): string {
  if (!project || typeof project !== 'object' || !('client' in project)) {
    return '';
  }
  const client = project.client;
  return client && typeof client === 'object' && '_id' in client ? String(client._id) : '';
}

const projectPopulate = {
  path: 'project',
  select: 'name client',
  populate: { path: 'client', select: 'name' },
} as const;

export async function listIncome(req: AuthRequest, res: Response): Promise<void> {
  const search = String(req.query['search'] ?? '').trim().toLowerCase();
  const status = String(req.query['status'] ?? '');
  const clientId = String(req.query['client'] ?? '');
  const from = String(req.query['from'] ?? '');
  const to = String(req.query['to'] ?? '');

  const filter: Record<string, unknown> = { user: req.userId };

  if (status === 'Paid' || status === 'Pending') {
    filter['status'] = status;
  }

  if (from || to) {
    const date: Record<string, Date> = {};
    if (from) {
      date['$gte'] = new Date(from);
    }
    if (to) {
      date['$lte'] = new Date(to);
    }
    filter['date'] = date;
  }

  const records = await Income.find(filter).populate(projectPopulate).sort({ date: -1 });

  const visible = records.filter((record) => {
    const matchesClient = !clientId || clientIdOf(record.project) === clientId;
    const matchesSearch =
      !search ||
      projectName(record.project).toLowerCase().includes(search) ||
      clientName(record.project).toLowerCase().includes(search);
    return matchesClient && matchesSearch;
  });

  res.json({ income: visible });
}

export async function createIncome(req: AuthRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const data = readIncomeBody(req.body);
  if (!data.project || !data.date || Number.isNaN(data.amount) || data.amount < 0) {
    res.status(400).json({ message: 'Project, date, and amount are required' });
    return;
  }

  const project = await Project.findOne({ _id: data.project, user: req.userId });
  if (!project) {
    res.status(400).json({ message: 'Project not found' });
    return;
  }

  const { date, ...rest } = data;
  const created = await Income.create({ ...rest, date, user: req.userId });
  const saved = await Income.findById(created._id).populate(projectPopulate);
  res.status(201).json({ income: saved });
}

export async function updateIncome(req: AuthRequest, res: Response): Promise<void> {
  const data = readIncomeBody(req.body);
  if (!data.project || !data.date || Number.isNaN(data.amount) || data.amount < 0) {
    res.status(400).json({ message: 'Project, date, and amount are required' });
    return;
  }

  const project = await Project.findOne({ _id: data.project, user: req.userId });
  if (!project) {
    res.status(400).json({ message: 'Project not found' });
    return;
  }

  const { date, ...rest } = data;
  const record = await Income.findOneAndUpdate(
    { _id: req.params['id'], user: req.userId },
    { ...rest, date },
    { new: true, runValidators: true },
  ).populate(projectPopulate);

  if (!record) {
    res.status(404).json({ message: 'Income record not found' });
    return;
  }

  res.json({ income: record });
}

export async function deleteIncome(req: AuthRequest, res: Response): Promise<void> {
  const record = await Income.findOneAndDelete({
    _id: req.params['id'],
    user: req.userId,
  });

  if (!record) {
    res.status(404).json({ message: 'Income record not found' });
    return;
  }

  res.json({ message: 'Income record deleted' });
}
