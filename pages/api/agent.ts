import { NextApiRequest, NextApiResponse } from 'next';
import SingularityAgent from '../../agent/self_referencing_agent';

const agent = new SingularityAgent();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await agent.process_input(message);
    
    res.status(200).json({ 
      response,
      timestamp: new Date().toISOString(),
      agent_status: 'operational'
    });
  } catch (error) {
    console.error('Agent processing error:', error);
    res.status(500).json({ 
      error: 'Internal agent error',
      message: 'The agent encountered an error during processing'
    });
  }
}