import type { Response } from 'express';
import { Client } from '../models/client.model.js';
import { Project } from '../models/project.model.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold';

function readStatus(value?: string): ProjectStatus {
  if (value === 'Completed' || value === 'On Hold') {
    return value;
  }
  return 'In Progress';
}

function readProjectBody(body: {
  name?: string;
  client?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string | null;
  fee?: number | string;
  feeNote?: string;
}) {
  const fee = Number(body.fee);
  return {
    name: body.name?.trim() ?? '',
    client: body.client?.trim() ?? '',
    category: body.category?.trim() ?? '',
    status: readStatus(body.status),
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    fee,
    feeNote: body.feeNote?.trim() ?? '',
  };
}

export async function listProjects(req: AuthRequest, res: Response): Promise<void> {
  const search = String(req.query['search'] ?? '').trim();
  const status = String(req.query['status'] ?? '');
  const clientId = String(req.query['client'] ?? '');
  const sort = req.query['sort'] === 'oldest' ? 1 : -1;

  const filter: Record<string, unknown> = { user: req.userId };

  if (status === 'In Progress' || status === 'Completed' || status === 'On Hold') {
    filter['status'] = status;
  }

  if (clientId) {
    filter['client'] = clientId;
  }

  const projects = await Project.find(filter)
    .populate('client', 'name')
    .sort({ createdAt: sort });

  const visible = search
    ? projects.filter((project) => {
        const clientName =
          project.client && typeof project.client === 'object' && 'name' in project.client
            ? String(project.client.name)
            : '';
        const term = search.toLowerCase();
        return (
          project.name.toLowerCase().includes(term) ||
          clientName.toLowerCase().includes(term)
        );
      })
    : projects;

  res.json({ projects: visible });
}

export async function createProject(req: AuthRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const data = readProjectBody(req.body);
  if (!data.name || !data.client || !data.startDate || Number.isNaN(data.fee) || data.fee < 0) {
    res.status(400).json({ message: 'Name, client, start date, and fee are required' });
    return;
  }

  const client = await Client.findOne({ _id: data.client, user: req.userId });
  if (!client) {
    res.status(400).json({ message: 'Client not found' });
    return;
  }

  const { startDate, ...rest } = data;
  const project = await Project.create({ ...rest, startDate, user: req.userId });
  const saved = await Project.findById(project._id).populate('client', 'name');
  res.status(201).json({ project: saved });
}

export async function updateProject(req: AuthRequest, res: Response): Promise<void> {
  const data = readProjectBody(req.body);
  if (!data.name || !data.client || !data.startDate || Number.isNaN(data.fee) || data.fee < 0) {
    res.status(400).json({ message: 'Name, client, start date, and fee are required' });
    return;
  }

  const client = await Client.findOne({ _id: data.client, user: req.userId });
  if (!client) {
    res.status(400).json({ message: 'Client not found' });
    return;
  }

  const project = await Project.findOneAndUpdate(
    { _id: req.params['id'], user: req.userId },
    data,
    { new: true, runValidators: true },
  ).populate('client', 'name');

  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }

  res.json({ project });
}

export async function deleteProject(req: AuthRequest, res: Response): Promise<void> {
  const project = await Project.findOneAndDelete({
    _id: req.params['id'],
    user: req.userId,
  });

  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }

  res.json({ message: 'Project deleted' });
}