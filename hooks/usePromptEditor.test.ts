import { renderHook, act } from '@testing-library/react';
import { usePromptEditor } from './usePromptEditor';
import { describe, it, expect } from 'vitest';

describe('usePromptEditor Hook - Agent Skill Inheritance', () => {
    const mockAgentSkills = [
        {
            id: 'A',
            title: 'Skill A',
            versions: [{ agentSkillIds: JSON.stringify(['B', 'C']) }]
        },
        {
            id: 'B',
            title: 'Skill B',
            versions: [{ agentSkillIds: JSON.stringify(['D']) }]
        },
        {
            id: 'C',
            title: 'Skill C',
            versions: [{ agentSkillIds: '[]' }]
        },
        {
            id: 'D',
            title: 'Skill D',
            versions: [{ agentSkillIds: '[]' }]
        }
    ];

    it('should recursively select inherited skills when a parent is selected', () => {
        const { result } = renderHook(() => usePromptEditor({ allAgentSkills: mockAgentSkills }));

        act(() => {
            result.current.toggleAgentSkill('A');
        });

        // Skill A selected (direct)
        expect(result.current.selectedSkillsMap['A']).toEqual(['direct']);
        // B and C inherited from A
        expect(result.current.selectedSkillsMap['B']).toEqual(['A']);
        expect(result.current.selectedSkillsMap['C']).toEqual(['A']);
        // D inherited from B
        expect(result.current.selectedSkillsMap['D']).toEqual(['B']);
        
        // Final flattened list
        expect(result.current.agentSkillIds.sort()).toEqual(['A', 'B', 'C', 'D']);
    });

    it('should maintain skill selection if multiple sources exist', () => {
        const { result } = renderHook(() => usePromptEditor({ allAgentSkills: mockAgentSkills }));

        act(() => {
            result.current.toggleAgentSkill('A');
        });
        
        // Also select C directly
        act(() => {
            result.current.toggleAgentSkill('C');
        });

        expect(result.current.selectedSkillsMap['C']).toContain('A');
        expect(result.current.selectedSkillsMap['C']).toContain('direct');

        // Unselect A
        act(() => {
            result.current.toggleAgentSkill('A');
        });

        // C should still be selected because of 'direct'
        expect(result.current.selectedSkillsMap['C']).toEqual(['direct']);
        expect(result.current.selectedSkillsMap['A']).toBeUndefined();
        expect(result.current.agentSkillIds.sort()).toEqual(['C']);
    });

    it('should recursively remove skills when all sources are gone', () => {
        const { result } = renderHook(() => usePromptEditor({ allAgentSkills: mockAgentSkills }));

        act(() => {
            result.current.toggleAgentSkill('A');
        });
        expect(result.current.agentSkillIds).toHaveLength(4);

        act(() => {
            result.current.toggleAgentSkill('A');
        });
        expect(result.current.agentSkillIds).toHaveLength(0);
    });

    it('should handle circular dependencies gracefully', () => {
        const circularSkills = [
            { id: 'X', title: 'Skill X', versions: [{ agentSkillIds: JSON.stringify(['Y']) }] },
            { id: 'Y', title: 'Skill Y', versions: [{ agentSkillIds: JSON.stringify(['X']) }] }
        ];

        const { result } = renderHook(() => usePromptEditor({ allAgentSkills: circularSkills }));

        act(() => {
            result.current.toggleAgentSkill('X');
        });

        expect(result.current.selectedSkillsMap['X'].sort()).toEqual(['Y', 'direct'].sort());
        expect(result.current.selectedSkillsMap['Y']).toEqual(['X']);
        expect(result.current.agentSkillIds.sort()).toEqual(['X', 'Y']);
    });
});
