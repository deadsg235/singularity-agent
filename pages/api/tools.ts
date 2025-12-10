import { NextApiRequest, NextApiResponse } from 'next';
import ATAToolCreator from '../../ata/tool_creator';

const toolCreator = new ATAToolCreator();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { requirement } = req.body;
    const tool = await toolCreator.create_tool(requirement);
    res.status(200).json({ tool, status: 'created' });
  } else if (req.method === 'GET') {
    res.status(200).json({ 
      message: 'ATA Tool Creation API',
      capabilities: ['create_tool', 'self_upgrade', 'evolve_code']
    });
  }
}