const STAGE_MARKERS = {
    projectOverview: '<!-- STAGE_PROJECT_OVERVIEW_COMPLETE -->',
    modules: '<!-- STAGE_MODULES_COMPLETE -->',
    estimates: '<!-- STAGE_ESTIMATES_COMPLETE -->',
    schedule: '<!-- STAGE_SCHEDULE_COMPLETE -->',
    summary: '<!-- STAGE_SUMMARY_COMPLETE -->'
};
export function detectCompletedStages(accumulatedText, alreadyDetected) {
    const stages = ['projectOverview', 'modules', 'estimates', 'schedule', 'summary'];
    for (const stage of stages) {
        if (alreadyDetected.has(stage))
            continue;
        const marker = STAGE_MARKERS[stage];
        const markerPos = accumulatedText.indexOf(marker);
        if (markerPos !== -1) {
            const jsonTag = `\`\`\`json:${stage}`;
            const jsonMatch = accumulatedText.match(new RegExp(`\`\`\`json:${stage}\\s*([\\s\\S]*?)\`\`\``, 'm'));
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[1].trim());
                    console.log(`[Parser] Stage ${stage} complete, parsed data:`, Object.keys(data));
                    return { stage, data, markerPosition: markerPos };
                }
                catch (e) {
                    console.error(`[Parser] Failed to parse ${stage} JSON:`, e);
                }
            }
        }
    }
    return null;
}
export function parseProjectOverviewStage(data) {
    const overview = data.projectOverview || data;
    return {
        projectTitle: overview.projectTitle || '프로젝트',
        businessGoals: overview.businessGoals || '',
        coreValues: overview.coreValues || [],
        techStack: overview.techStack || []
    };
}
export function parseModulesStage(data) {
    return {
        projectTitle: data.projectTitle || '프로젝트',
        modules: data.modules || []
    };
}
export function parseEstimatesStage(data) {
    const estimates = data.estimates || data;
    return {
        typeA: estimates.typeA || { minCost: 0, maxCost: 0, duration: '미정' },
        typeB: estimates.typeB || { minCost: 0, maxCost: 0, duration: '미정' },
        typeC: estimates.typeC || { minCost: 0, maxCost: 0, duration: '미정' }
    };
}
export function parseScheduleStage(data) {
    const schedule = data.schedule || data;
    return {
        totalWeeks: schedule.totalWeeks || 0,
        phases: schedule.phases || [],
        milestones: schedule.milestones || []
    };
}
export function parseSummaryStage(data) {
    const summary = data.summary || data;
    return {
        keyPoints: summary.keyPoints || [],
        risks: summary.risks || [],
        recommendations: summary.recommendations || []
    };
}
export function parseAnalysisResponse(fullResponse) {
    try {
        const projectOverviewMatch = fullResponse.match(/```json:projectOverview\s*([\s\S]*?)```/);
        const modulesMatch = fullResponse.match(/```json:modules\s*([\s\S]*?)```/);
        const estimatesMatch = fullResponse.match(/```json:estimates\s*([\s\S]*?)```/);
        const scheduleMatch = fullResponse.match(/```json:schedule\s*([\s\S]*?)```/);
        const summaryMatch = fullResponse.match(/```json:summary\s*([\s\S]*?)```/);
        if (!modulesMatch) {
            const alternativeMatch = fullResponse.match(/```json\s*([\s\S]*?)```/);
            if (!alternativeMatch) {
                console.error('No JSON block found in response');
                return null;
            }
            const jsonData = JSON.parse(alternativeMatch[1].trim());
            const rawMarkdown = fullResponse.replace(/```json[\s\S]*?```/g, '').trim();
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
        const projectOverviewData = projectOverviewMatch ? JSON.parse(projectOverviewMatch[1].trim()) : null;
        const modulesData = JSON.parse(modulesMatch[1].trim());
        const estimatesData = estimatesMatch ? JSON.parse(estimatesMatch[1].trim()) : null;
        const scheduleData = scheduleMatch ? JSON.parse(scheduleMatch[1].trim()) : null;
        const summaryData = summaryMatch ? JSON.parse(summaryMatch[1].trim()) : null;
        const rawMarkdown = fullResponse
            .replace(/```json:projectOverview[\s\S]*?```/g, '')
            .replace(/```json:modules[\s\S]*?```/g, '')
            .replace(/```json:estimates[\s\S]*?```/g, '')
            .replace(/```json:schedule[\s\S]*?```/g, '')
            .replace(/```json:summary[\s\S]*?```/g, '')
            .replace(/<!-- STAGE_\w+_COMPLETE -->/g, '')
            .trim();
        // Get project title from projectOverview first, fall back to modulesData
        const projectTitle = projectOverviewData
            ? parseProjectOverviewStage(projectOverviewData).projectTitle
            : (modulesData.projectTitle || '프로젝트');
        return {
            projectTitle,
            modules: modulesData.modules || [],
            estimates: estimatesData ? parseEstimatesStage(estimatesData) : {
                typeA: { minCost: 0, maxCost: 0, duration: '미정' },
                typeB: { minCost: 0, maxCost: 0, duration: '미정' },
                typeC: { minCost: 0, maxCost: 0, duration: '미정' }
            },
            schedule: scheduleData ? parseScheduleStage(scheduleData) : undefined,
            summary: summaryData ? parseSummaryStage(summaryData) : undefined,
            projectOverview: projectOverviewData ? parseProjectOverviewStage(projectOverviewData) : undefined,
            rawMarkdown
        };
    }
    catch (error) {
        console.error('Failed to parse analysis response:', error);
        return null;
    }
}
export function extractJsonFromStream(accumulatedText) {
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
    }
    catch {
        return { json: null, found: false };
    }
}
