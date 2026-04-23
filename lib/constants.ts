export const ALLOWED_EXTENSIONS = [
    '.txt', '.md', '.doc', '.docx', '.xls', '.xlsx', '.pdf',
    '.jpg', '.jpeg', '.png', '.svg', '.gif', '.webp',
    '.json', '.j2', '.xml', '.xsd', '.swagger', '.jinja2'
];

export const BACKUP_FREQUENCY = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY'
} as const;

export const ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER',
    GUEST: 'GUEST'
} as const;

export const ATTACHMENT_ROLES = {
    ATTACHMENT: 'ATTACHMENT',
    RESULT: 'RESULT'
} as const;

export const CONFIG_ID = {
    GLOBAL: 'GLOBAL'
} as const;

export const EXPORT_FILENAME_PREFIX = 'TMT-backup';
export const ZERO_EXPORT_FILENAME_PREFIX = 'TMT-zero-export';
