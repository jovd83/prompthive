
export type UserBasic = {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
};

export type Settings = {
    id: string; // Added
    userId: string; // Added
    autoBackupEnabled: boolean;
    backupPath: string | null;
    backupFrequency: string;
    lastBackupAt: Date | null; // Added
    showPrompterTips: boolean;
    tagColorsEnabled: boolean;
    workflowVisible: boolean; // Added // Added
    // Relations are usually optional or loaded separately, 
    // but if we use this for the object from findUnique with includes...
    hiddenUsers?: any[];
    hiddenCollections?: any[];
};
