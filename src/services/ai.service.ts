
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, SchemaType } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  async extractMajorEvents(content: string): Promise<string[]> {
    if (!content || content.length < 10) return [];

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `请分析以下日记内容，并提取1到3个“重大事件”或关键摘要。请直接以JSON数组格式返回字符串列表。内容：${content}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of major events extracted from diary"
          }
        }
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text);
      }
      return [];
    } catch (e) {
      console.error('AI extraction failed', e);
      return ['AI分析失败，请手动添加'];
    }
  }
}
