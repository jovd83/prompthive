export * from "./prompt-crud";
export * from "./prompt-links";
export * from "./prompt-bulk";
export * from "./prompt-visibility";

// Compatibility aliases for refactored services
import { TagService } from "./tags";
import { PromptAttachmentService } from "./attachments";

export const deleteUnusedTagsService = TagService.deleteUnusedTagsService;
export const createTagService = TagService.createTagService;
export const cleanupPromptAssetsService = PromptAttachmentService.cleanupPromptAssetsService;
