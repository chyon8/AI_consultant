import * as geminiService from './geminiService';
import * as rfpService from './rfpService';
import * as chatService from './chatService';
import { classifyUserIntent, extractProjectContext } from './chatService';
import * as claudeService from './claudeService';
function getProviderFromModelId(modelId) {
    if (modelId.startsWith('claude')) {
        return 'anthropic';
    }
    return 'google';
}
export async function analyzeProject(userInput, fileDataList, onChunk, modelId) {
    const effectiveModelId = modelId || 'gemini-2.5-flash';
    const provider = getProviderFromModelId(effectiveModelId);
    console.log(`[aiRouter] analyzeProject - provider: ${provider}, model: ${effectiveModelId}`);
    if (provider === 'anthropic') {
        if (!claudeService.isClaudeConfigured()) {
            throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY.');
        }
        return claudeService.analyzeProject(userInput, fileDataList, onChunk, effectiveModelId);
    }
    return geminiService.analyzeProject(userInput, fileDataList, onChunk, effectiveModelId);
}
export async function generateRFP(modules, summary, onChunk, modelId) {
    const effectiveModelId = modelId || 'gemini-2.5-flash';
    const provider = getProviderFromModelId(effectiveModelId);
    console.log(`[aiRouter] generateRFP - provider: ${provider}, model: ${effectiveModelId}`);
    if (provider === 'anthropic') {
        if (!claudeService.isClaudeConfigured()) {
            throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY.');
        }
        return claudeService.generateRFP(modules, summary, onChunk, effectiveModelId);
    }
    return rfpService.generateRFP(modules, summary, onChunk, effectiveModelId);
}
export async function generateInsight(params, modelId) {
    const effectiveModelId = modelId || 'gemini-3-pro-preview';
    const provider = getProviderFromModelId(effectiveModelId);
    console.log(`[aiRouter] generateInsight - provider: ${provider}, model: ${effectiveModelId}`);
    if (provider === 'anthropic') {
        if (!claudeService.isClaudeConfigured()) {
            throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY.');
        }
        return claudeService.generateInsight(params, effectiveModelId);
    }
    return geminiService.generateInsight(params, effectiveModelId);
}
export async function streamChatResponse(history, currentModules, onChunk, modelSettings) {
    const streamModel = modelSettings?.streamChatResponse || 'gemini-2.5-flash';
    const provider = getProviderFromModelId(streamModel);
    console.log(`[aiRouter] streamChatResponse - provider: ${provider}, model: ${streamModel}`);
    if (provider === 'anthropic') {
        if (!claudeService.isClaudeConfigured()) {
            onChunk("<CHAT>\nAnthropic API Key가 설정되지 않았습니다. ANTHROPIC_API_KEY 환경 변수를 설정해주세요.\n</CHAT>\n\n<ACTION>\n{\"type\": \"no_action\", \"intent\": \"general\", \"payload\": {}}\n</ACTION>");
            return;
        }
        const lastUserMessage = history[history.length - 1];
        const projectContext = extractProjectContext(currentModules);
        console.log('[aiRouter] Running context lock validation for Claude...');
        const contextValidation = await classifyUserIntent(lastUserMessage.text, projectContext, modelSettings?.classifyUserIntent);
        console.log('[aiRouter] Context lock judgment:', contextValidation.judgment);
        if (contextValidation.shouldBlock) {
            onChunk(contextValidation.refusalMessage);
            return;
        }
        return claudeService.streamChatResponse(history, currentModules, onChunk, modelSettings);
    }
    return chatService.streamChatResponse(history, currentModules, onChunk, modelSettings);
}
export function isProviderConfigured(provider) {
    if (provider === 'anthropic') {
        return claudeService.isClaudeConfigured();
    }
    return !!process.env.GEMINI_API_KEY;
}
export function getConfiguredProviders() {
    const providers = [];
    if (process.env.GEMINI_API_KEY)
        providers.push('google');
    if (claudeService.isClaudeConfigured())
        providers.push('anthropic');
    return providers;
}
