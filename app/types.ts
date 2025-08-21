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
  "Token2022 Account": 165,
  "Token2022 Mint": 82,
  "Sysvar Clock": 40,
  "Sysvar Rent": 17,
};

export const TOKEN2022_EXTENSIONS = {
  TransferFeeConfig: 72,
  InterestBearingConfig: 32,
  ConfidentialTransfer: 97,
  DefaultAccountState: 1,
  PermanentDelegate: 32,
};

export type Extension = keyof typeof TOKEN2022_EXTENSIONS;

export type Account = {
  name: string;
  type: keyof typeof ACCOUNT_TYPES;
  dataLength: number;
  extensions?: Extension[];
};

export type Project = {
  id: string;
  name: string;
  accounts: Account[];
  language?: Language; // Make optional for backwards compatibility
  lastModified?: number; // Unix timestamp, optional for backwards compatibility
};

export interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (project: Project) => void;
  onImport: (projectData: Project) => void;
  onDeleteClick: (project: Project) => void;
  onNewProject: () => void;
}

export interface AccountEntryProps {
  account: Account;
  index: number;
  updateAccount: (index: number, updatedAccount: Account) => void;
  removeAccount: (index: number) => void;
}
