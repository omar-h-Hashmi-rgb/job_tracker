import { Request, Response } from 'express';
import Application from '../models/Application.js';
import * as groqService from '../services/groq.service.js';

export const getApplications = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized: User not found in request' });
    }
    const applications = await Application.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('getApplications error:', err);
    res.status(500).json({ message: 'Failed to fetch applications', error: err.message });
  }
};

export const createApplication = async (req: Request, res: Response) => {
  try {
    const { company, role } = req.body;
    if (!company || !role) {
      return res.status(400).json({ message: 'Bad Request: Company and Role are required' });
    }

    const applicationData = {
      ...req.body,
      userId: req.userId,
    };
    const newApplication = new Application(applicationData);
    await newApplication.save();
    res.status(201).json(newApplication);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('createApplication error:', err);
    res.status(500).json({ message: 'Failed to create application', error: err.message });
  }
};

export const updateApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Bad Request: Application ID is required' });
    }

    const updatedApplication = await Application.findOneAndUpdate(
      { _id: id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({ message: 'Application Not Found' });
    }

    res.status(200).json(updatedApplication);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('updateApplication error:', err);
    res.status(500).json({ message: 'Failed to update application', error: err.message });
  }
};

export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedApplication = await Application.findOneAndDelete({ _id: id, userId: req.userId });

    if (!deletedApplication) {
      return res.status(404).json({ message: 'Application Not Found' });
    }

    res.status(200).json({ message: 'Application Deleted Successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('deleteApplication error:', err);
    res.status(500).json({ message: 'Failed to delete application', error: err.message });
  }
};

export const parseJD = async (req: Request, res: Response) => {
  try {
    const { jdText } = req.body;
    if (!jdText || jdText.trim().length < 10) {
      return res.status(400).json({ message: 'Bad Request: Valid job description text is required' });
    }

    const [parsedData, resumeBullets] = await Promise.all([
      groqService.parseJobDescription(jdText),
      groqService.generateResumeBulletsStream(req.body.role || 'Position', jdText).then(async (stream) => {
        let bullets = '';
        for await (const chunk of stream) {
          bullets += chunk.choices[0]?.delta?.content || '';
        }
        return bullets.split('\n').filter(b => b.trim()).map(b => b.replace(/^[*-]\s*/, '').trim());
      }),
    ]);

    res.status(200).json({
      parsedData,
      resumeBullets,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('parseJD error:', err);
    res.status(500).json({ message: 'AI Parsing Failed', error: err.message });
  }
};

export const streamBullets = async (req: Request, res: Response) => {
  try {
    const { role, jdText } = req.body;
    if (!jdText) {
      return res.status(400).json({ message: 'Job description text is required' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await groqService.generateResumeBulletsStream(role || 'Position', jdText);
    
    for await (const chunk of stream) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: unknown) {
    const err = error as Error;
    console.error('streamBullets error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};
