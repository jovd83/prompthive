
export type UserBasic = {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
};

export type Settings = {
    autoBackupEnabled: boolean;
    backupPath: string | null;
    backupFrequency: string;
    showPrompterTips: boolean;
};
