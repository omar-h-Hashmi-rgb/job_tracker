import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const parseJobDescription = async (jdText: string) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `
    Extract the following information from the job description provided below. 
    Return the result in JSON format with these exact keys:
    "companyName", "role", "requiredSkills" (array of strings), "niceToHaveSkills" (array of strings), "seniority", "location".
    
    If any information is missing, use an empty string or empty array.
    
    Job Description:
    ${jdText}
  `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return JSON.parse(response.text());
};

export const generateResumeBullets = async (role: string, jdText: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    Based on the following job description for a ${role} position, generate 3 to 5 highly specific, tailored resume bullet points.
    Focus on impact, using action verbs and industry-standard keywords related to the job description.
    Do not include any introductory or concluding text, just the bullet points.
    
    Job Description:
    ${jdText}
  `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  
  // Convert bullet points text into an array
  return text.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^[*-]\s*/, '').trim());
};
// 2.5 flash model not 1.5
export const generateResumeBulletsStream = async (role: string, jdText: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
 
  const prompt = `
    Based on the following job description for a ${role} position, generate 3 to 5 highly specific, tailored resume bullet points.
    Focus on impact, numbers, and the specific keywords found in the JD.
    Keep each bullet point concise and professional.
    Return ONLY the bullet points, each starting with a dash (-).
    
    Job Description:
    ${jdText}
  `;

  return model.generateContentStream(prompt);
};
