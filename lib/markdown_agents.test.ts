// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { generateMarkdown } from './markdown';

describe('generateMarkdown with Agent Integration', () => {
    const mockPrompt: any = {
        id: 'p1',
        title: 'Agent Promo',
        description: 'Testing agents',
        createdAt: new Date('2024-01-01'),
        createdBy: { username: 'tester' },
        tags: [],
        collections: [],
        versions: [
            {
                id: 'v1',
                content: 'Main content',
                versionNumber: 1,
                createdAt: new Date('2024-01-01'),
                agentUsage: 'Invoke the Researcher agent for fact checking.',
                agentSkillIds: '["s1"]'
            }
        ]
    };

    const mockSkills = [
        {
            id: 's1',
            title: 'Researcher',
            description: 'Can find anything on the web',
            url: 'https://skills.ai/researcher'
        }
    ];

    it('generates enhanced Agents and Agentskills sections', () => {
        const md = generateMarkdown(mockPrompt, 'v1', mockSkills);

        // Agents section
        expect(md).toContain('## Agents');
        expect(md).toContain('Invoke the Researcher agent for fact checking.');

        // Agentskills section
        expect(md).toContain('## Agentskills');
        expect(md).toContain('The following agentskills could be used to achieve the goals of this prompt and its tasks');
        expect(md).toContain('* Researcher');
        expect(md).toContain('** Can find anything on the web');
        expect(md).toContain('** https://skills.ai/researcher');

        // Verify old format is GONE
        expect(md).not.toContain('SPECIALIST AGENT');
        expect(md).not.toContain('CONDITIONAL SPECIALIST SKILLS');
    });

    it('omits sections when no agents or skills provided', () => {
        const emptyPrompt = {
            ...mockPrompt,
            versions: [{ ...mockPrompt.versions[0], agentUsage: null, agentSkillIds: null }]
        };
        const md = generateMarkdown(emptyPrompt, 'v1', []);

        expect(md).not.toContain('## Agents');
        expect(md).not.toContain('## Agentskills');
    });
});
