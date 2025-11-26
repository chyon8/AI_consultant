export interface ParsedSubFeature {
  id: string;
  name: string;
  price: number;
  manWeeks: number;
  isSelected: boolean;
}

export interface ParsedModule {
  id: string;
  name: string;
  description: string;
  category: string;
  baseCost: number;
  baseManMonths: number;
  isSelected: boolean;
  required?: boolean;
  subFeatures: ParsedSubFeature[];
}

export interface ParsedEstimates {
  typeA: { minCost: number; maxCost: number; duration: string };
  typeB: { minCost: number; maxCost: number; duration: string };
  typeC: { minCost: number; maxCost: number; duration: string };
}

export interface ParsedAnalysisResult {
  projectTitle: string;
  modules: ParsedModule[];
  estimates: ParsedEstimates;
  rawMarkdown: string;
}

export function parseAnalysisResponse(fullResponse: string): ParsedAnalysisResult | null {
  try {
    const jsonMatch = fullResponse.match(/```json:modules\s*([\s\S]*?)```/);
    
    if (!jsonMatch) {
      const alternativeMatch = fullResponse.match(/```json\s*([\s\S]*?)```/);
      if (!alternativeMatch) {
        console.error('No JSON block found in response');
        return null;
      }
      
      const jsonData = JSON.parse(alternativeMatch[1].trim());
      const rawMarkdown = fullResponse.replace(/```json\s*[\s\S]*?```/, '').trim();
      
      return {
        projectTitle: jsonData.projectTitle || '프로젝트',
        modules: jsonData.modules || [],
        estimates: jsonData.estimates || {
          typeA: { minCost: 0, maxCost: 0, duration: '미정' },
          typeB: { minCost: 0, maxCost: 0, duration: '미정' },
          typeC: { minCost: 0, maxCost: 0, duration: '미정' }
        },
        rawMarkdown
      };
    }
    
    const jsonData = JSON.parse(jsonMatch[1].trim());
    const rawMarkdown = fullResponse.replace(/```json:modules\s*[\s\S]*?```/, '').trim();
    
    return {
      projectTitle: jsonData.projectTitle || '프로젝트',
      modules: jsonData.modules || [],
      estimates: jsonData.estimates || {
        typeA: { minCost: 0, maxCost: 0, duration: '미정' },
        typeB: { minCost: 0, maxCost: 0, duration: '미정' },
        typeC: { minCost: 0, maxCost: 0, duration: '미정' }
      },
      rawMarkdown
    };
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
    return null;
  }
}

export function extractJsonFromStream(accumulatedText: string): { json: any; found: boolean } {
  try {
    const jsonMatch = accumulatedText.match(/```json:modules\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return { json: JSON.parse(jsonMatch[1].trim()), found: true };
    }
    
    const alternativeMatch = accumulatedText.match(/```json\s*([\s\S]*?)```/);
    if (alternativeMatch) {
      return { json: JSON.parse(alternativeMatch[1].trim()), found: true };
    }
    
    return { json: null, found: false };
  } catch {
    return { json: null, found: false };
  }
}
