import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const parseJobDescription = async (jdText: string) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert recruitment assistant. Extract job details from the provided text and return ONLY a valid JSON object. ' +
                 'Fields: companyName (string), role (string), requiredSkills (array of strings), location (string), jdLink (string), salaryRange (string). ' +
                 'Special Instructions: \n' +
                 '1. If a URL is present in the text, extract it into the "jdLink" field.\n' +
                 '2. If the text is very sparse (e.g. just a link), infer the company name from the website domain.\n' +
                 '3. Extract any mentioned salary or compensation into "salaryRange".\n' +
                 '4. If a field is missing, use an empty string or empty array.'
      },
      {
        role: 'user',
        content: jdText,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('No content returned from Groq');
  
  return JSON.parse(content);
};

export const generateResumeBulletsStream = async (role: string, jdText: string) => {
  return groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a professional resume writer. Based on the job description for a ${role} position, generate 3-5 high-impact resume bullet points. ` +
                 'Use action verbs and quantify results where possible. Return ONLY the bullet points, each starting with a dash (-). No intro or outro.'
      },
      {
        role: 'user',
        content: jdText,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    stream: true,
  });
};
