import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AIAction } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const processLatexWithAI = async (
  code: string, 
  action: AIAction, 
  promptDetails?: string
): Promise<string> => {
  const model = 'gemini-2.5-flash';
  let systemInstruction = "You are an expert LaTeX assistant. You help users write, debug, and understand LaTeX code.";
  let prompt = "";

  switch (action) {
    case AIAction.FIX_ERRORS:
      systemInstruction += " Identify syntax errors in the provided LaTeX code. Return ONLY the corrected full LaTeX code block without markdown code fences or conversational text. If no errors, return the original.";
      prompt = `Fix any errors in this LaTeX code:\n\n${code}`;
      break;
    
    case AIAction.EXPLAIN:
      systemInstruction += " Explain the provided LaTeX code clearly and concisely. Focus on the structure, packages used, and specific math commands.";
      prompt = `Explain what this LaTeX code does:\n\n${code}`;
      break;

    case AIAction.OPTIMIZE:
        systemInstruction += " Optimize the LaTeX code for readability and best practices. Return ONLY the optimized code without markdown fences.";
        prompt = `Optimize this LaTeX code:\n\n${code}`;
        break;

    case AIAction.GENERATE:
      systemInstruction += " Generate valid, compilable LaTeX code based on the user's request. Return ONLY the code without markdown fences.";
      prompt = `Generate LaTeX code for: ${promptDetails}`;
      break;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for code precision
      },
    });

    let text = response.text || "";
    
    // Clean up if the model accidentally wraps in markdown blocks despite instructions
    text = text.replace(/^```latex\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
    
    return text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process LaTeX with AI.");
  }
};
