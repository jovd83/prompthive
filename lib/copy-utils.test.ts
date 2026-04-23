import { describe, it, expect } from 'vitest';
import { formatAdvancedPrompt, SOT_POLICY, PERSISTENCE_CHECK, USER_HANDOFF } from './copy-utils';

describe('formatAdvancedPrompt', () => {
    const baseContent = "Hello, world!";

    it('should return base content when no options are selected', () => {
        const options = {
            addAgents: false,
            addAgentSkills: false,
            addSotPolicy: false,
            addPersistenceCheck: false,
            addUserHandoff: false
        };
        const result = formatAdvancedPrompt(baseContent, options);
        expect(result).toBe(baseContent);
    });

    it('should append SOT policy when selected', () => {
        const options = {
            addAgents: false,
            addAgentSkills: false,
            addSotPolicy: true,
            addPersistenceCheck: false,
            addUserHandoff: false
        };
        const result = formatAdvancedPrompt(baseContent, options);
        expect(result).toContain(baseContent);
        expect(result).toContain(SOT_POLICY);
    });

    it('should append Persistence Check when selected', () => {
        const options = {
            addAgents: false,
            addAgentSkills: false,
            addSotPolicy: false,
            addPersistenceCheck: true,
            addUserHandoff: false
        };
        const result = formatAdvancedPrompt(baseContent, options);
        expect(result).toContain(baseContent);
        expect(result).toContain(PERSISTENCE_CHECK);
    });

    it('should append User Handoff when selected', () => {
        const options = {
            addAgents: false,
            addAgentSkills: false,
            addSotPolicy: false,
            addPersistenceCheck: false,
            addUserHandoff: true
        };
        const result = formatAdvancedPrompt(baseContent, options);
        expect(result).toContain(baseContent);
        expect(result).toContain(USER_HANDOFF);
    });

    it('should append agents when selected and data is provided', () => {
        const options = {
            addAgents: true,
            addAgentSkills: false,
            addSotPolicy: false,
            addPersistenceCheck: false,
            addUserHandoff: false
        };
        const context = { agentUsage: "Custom Agent" };
        const result = formatAdvancedPrompt(baseContent, options, context);
        expect(result).toContain("SPECIALIST AGENT");
        expect(result).toContain("Use if available and materially applicable:");
        expect(result).toContain("Custom Agent");
    });

    it('should not append agents when selected but data is missing', () => {
        const options = {
            addAgents: true,
            addAgentSkills: false,
            addSotPolicy: false,
            addPersistenceCheck: false,
            addUserHandoff: false
        };
        const result = formatAdvancedPrompt(baseContent, options);
        expect(result).toBe(baseContent);
    });

    it('should append agent skills when selected and data is provided', () => {
        const options = {
            addAgents: false,
            addAgentSkills: true,
            addSotPolicy: false,
            addPersistenceCheck: false,
            addUserHandoff: false
        };
        const context = { 
            agentSkills: [
                { title: "Skill 1", description: "Desc 1" },
                { title: "Skill 2", versions: [{ content: "Content 2" }] }
            ] 
        };
        const result = formatAdvancedPrompt(baseContent, options, context);
        expect(result).toContain("CONDITIONAL SPECIALIST SKILLS");
        expect(result).toContain("Search your configured skills paths");
        expect(result).toContain("- Skill 1: Desc 1");
        expect(result).toContain("- Skill 2: Content 2");
    });

    it('should properly combine multiple sections', () => {
        const options = {
            addAgents: true,
            addAgentSkills: false,
            addSotPolicy: true,
            addPersistenceCheck: true,
            addUserHandoff: false
        };
        const context = { agentUsage: "Agent X" };
        const result = formatAdvancedPrompt(baseContent, options, context);
        
        expect(result).toContain(baseContent);
        expect(result).toContain("Agent X");
        expect(result).toContain(SOT_POLICY);
        expect(result).toContain(PERSISTENCE_CHECK);
        expect(result).not.toContain(USER_HANDOFF);
    });
});
