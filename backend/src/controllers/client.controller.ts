import type { Response } from 'express';
import { Client } from '../models/client.model.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

type ClientStatus = 'Active' | 'Inactive';

function readClientBody(body: {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  status?: string;
}): {
  name: string;
  email: string;
  company: string;
  phone: string;
  status: ClientStatus;
} {
  const name = body.name?.trim() ?? '';
  const email = body.email?.trim().toLowerCase() ?? '';
  const company = body.company?.trim() ?? '';
  const phone = body.phone?.trim() ?? '';
  const status: ClientStatus = body.status === 'Inactive' ? 'Inactive' : 'Active';

  return { name, email, company, phone, status };
}

export async function listClients(req: AuthRequest, res: Response): Promise<void> {
  const search = String(req.query['search'] ?? '').trim();
  const status = String(req.query['status'] ?? '');
  const sort = req.query['sort'] === 'oldest' ? 1 : -1;

  const filter: Record<string, unknown> = { user: req.userId };

  if (status === 'Active' || status === 'Inactive') {
    filter['status'] = status;
  }

  if (search) {
    filter['$or'] = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const clients = await Client.find(filter).sort({ createdAt: sort });
  res.json({ clients });
}

export async function createClient(req: AuthRequest, res: Response): Promise<void> {
  const data = readClientBody(req.body);

  if (!req.userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (!data.name || !data.email) {
    res.status(400).json({ message: 'Name and email are required' });
    return;
  }

  const client = await Client.create({ ...data, user: req.userId });
  res.status(201).json({ client });
}

export async function updateClient(req: AuthRequest, res: Response): Promise<void> {
  const data = readClientBody(req.body);

  if (!data.name || !data.email) {
    res.status(400).json({ message: 'Name and email are required' });
    return;
  }

  const client = await Client.findOneAndUpdate(
    { _id: req.params['id'], user: req.userId },
    data,
    { new: true, runValidators: true },
  );

  if (!client) {
    res.status(404).json({ message: 'Client not found' });
    return;
  }

  res.json({ client });
}

export async function deleteClient(req: AuthRequest, res: Response): Promise<void> {
  const client = await Client.findOneAndDelete({
    _id: req.params['id'],
    user: req.userId,
  });

  if (!client) {
    res.status(404).json({ message: 'Client not found' });
    return;
  }

  res.json({ message: 'Client deleted' });
}