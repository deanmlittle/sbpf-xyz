export interface OffsetDisplayProps {
  accounts: Account[];
  language: Language;
}

export interface Offset {
  name: string;
  offset: string;
}

export type Language = "ASM" | "Rust" | "C";

export const ACCOUNT_TYPES = {
  System: 0,
  "SPL Token": 165,
  "SPL Mint": 82,
};

export type Account = {
  name: string;
  type: keyof typeof ACCOUNT_TYPES;
  dataLength: number;
};

export type Project = {
  id: number;
  name: string;
  accounts: Account[];
  language: Language;
};

export interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (project: Project) => void;
  onImport: (projectData: Project) => void;
}

export interface AccountEntryProps {
  account: Account;
  index: number;
  updateAccount: (index: number, updatedAccount: Account) => void;
  removeAccount: (index: number) => void;
}
