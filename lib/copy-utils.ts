export const SOT_POLICY = `SOURCE-OF-TRUTH CHECK

Do not treat training knowledge, cached memory, or prior conversation context as authoritative.
Before planning, answering, or acting, you must check the current source of truth for this task: relevant files, SKILL.md instructions, registries, templates, metadata, and policy artifacts.
If a required Information Layer or Feedback Layer skill exists for upfront verification, you must use it. Referring to a skill from memory does not count as using it.
If current sources conflict with memory, current sources win.
If a required skill includes telemetry, logging, or workflow evidence, complete it.
If a required source, skill, or verification path is unavailable, stop and report the blocker instead of guessing.
Ground your work in checked current sources, not recalled knowledge.`;

export const PERSISTENCE_CHECK = `PERSISTENCE CHECK

Before finalizing, you must review whether this task produced anything that should be written away as durable memory, policy, convention, template guidance, or handoff state.
For each candidate, assign exactly one destination:
- runtime-only
- project-memory
- shared-memory
- reject
Write only items that are stable, reusable, safe, and backed by current checked sources.
Do not write secrets, speculative ideas, one-off task notes, or hidden-context details into persistent memory.
If a memory or policy skill exists for writing or validating persistence, use it. Read before write, and avoid duplicates by updating or deprecating existing entries when appropriate.
If nothing qualifies, explicitly say:
"No project-memory or shared-memory write was warranted after review."`;

export const USER_HANDOFF = `End with a short Handoff section listing:
- status
- next step
- memory/policy writes performed
- writes intentionally skipped, with reason
- Information skill(s) used:
- Feedback skill(s) used:
- Execution skill(s) used:
- Current source(s) checked:
- Telemetry/logging:
- Any remaining uncertainty:
- blockers or risks`;

/**
 * Interface for Advanced Copy options
 */
export interface AdvancedCopyOptions {
  addAgents: boolean;
  addAgentSkills: boolean;
  addSotPolicy: boolean;
  addPersistenceCheck: boolean;
  addUserHandoff: boolean;
}

/**
 * Formats the final clipboard content based on selected options.
 */
export function formatAdvancedPrompt(
  baseContent: string,
  options: AdvancedCopyOptions,
  context: {
    agentUsage?: string | null;
    agentSkills?: any[];
  } = {}
): string {
  let result = baseContent;

  if (options.addAgents && context.agentUsage) {
    result += `\n\n---\nSPECIALIST AGENT\nUse if available and materially applicable:\n${context.agentUsage}`;
  }

  if (options.addAgentSkills && context.agentSkills && context.agentSkills.length > 0) {
    result += `\n\n---\nCONDITIONAL SPECIALIST SKILLS\nSearch your configured skills paths for the listed skills before deciding they are unavailable or not applicable. If found, open the current SKILL.md and use it when the task enters that skill’s domain. Memory of a skill is not a substitute for checking the current skill files.\nUse when the task materially enters their domain. Otherwise mark them not applicable.\n${context.agentSkills
      .map((s) => {
        const desc = s.description || s.versions?.[0]?.content || "";
        return `- ${s.title || s.name}: ${desc}`;
      })
      .join("\n")}`;
  }

  if (options.addSotPolicy) {
    result += `\n\n---\n${SOT_POLICY}`;
  }

  if (options.addPersistenceCheck) {
    result += `\n\n---\n${PERSISTENCE_CHECK}`;
  }

  if (options.addUserHandoff) {
    result += `\n\n---\n${USER_HANDOFF}`;
  }

  return result;
}
