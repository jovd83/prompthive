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
    USER: 'USER'
} as const;

export const ATTACHMENT_ROLES = {
    ATTACHMENT: 'ATTACHMENT',
    RESULT: 'RESULT'
} as const;
