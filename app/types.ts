export interface OffsetDisplayProps {
  accounts: Account[];
  instructionData: InstructionDataField[];
  language: Language;
}

export interface Offset {
  name: string;
  offset: string;
  comment?: string;
}

export type Language = "ASM" | "Rust" | "C";

export const INSTRUCTION_DATA_TYPES = {
  "u8": 1,
  "u16": 2, 
  "u32": 4,
  "u64": 8,
  "i8": 1,
  "i16": 2,
  "i32": 4,
  "i64": 8,
  "f32": 4,
  "f64": 8,
  "Pubkey": 32,
  "[u8;N]": 0, // Custom size
};

export type InstructionDataType = keyof typeof INSTRUCTION_DATA_TYPES;

export type InstructionDataField = {
  name: string;
  type: InstructionDataType;
  size?: number; // For [u8;N] custom arrays
};

export const ACCOUNT_TYPES = {
  System: 0,
  "SPL Token": 165,
  "SPL Mint": 82,
  "Token2022 Account": 165,
  "Token2022 Mint": 82,
  "Sysvar Clock": 40,
  "Sysvar Rent": 17,
  "TypedAccount": 0,
};

export const TOKEN2022_EXTENSIONS = {
  TransferFeeConfig: 72,
  InterestBearingConfig: 32,
  ConfidentialTransfer: 97,
  DefaultAccountState: 1,
  PermanentDelegate: 32,
};

export type Extension = keyof typeof TOKEN2022_EXTENSIONS;

export const SPL_MINT_FIELDS = [
  { name: "mint_authority", type: "Pubkey" as InstructionDataType, offset: 0 },
  { name: "supply", type: "u64" as InstructionDataType, offset: 32 },
  { name: "decimals", type: "u8" as InstructionDataType, offset: 40 },
  { name: "is_initialized", type: "u8" as InstructionDataType, offset: 41 },
  { name: "freeze_authority", type: "Pubkey" as InstructionDataType, offset: 42 },
] as const;

export const SPL_TOKEN_FIELDS = [
  { name: "mint", type: "Pubkey" as InstructionDataType, offset: 0 },
  { name: "owner", type: "Pubkey" as InstructionDataType, offset: 32 },
  { name: "amount", type: "u64" as InstructionDataType, offset: 64 },
  { name: "delegate", type: "Pubkey" as InstructionDataType, offset: 72 },
  { name: "state", type: "u8" as InstructionDataType, offset: 104 },
  { name: "is_native", type: "u64" as InstructionDataType, offset: 105 },
  { name: "delegated_amount", type: "u64" as InstructionDataType, offset: 113 },
  { name: "close_authority", type: "Pubkey" as InstructionDataType, offset: 121 },
] as const;

export const TOKEN2022_MINT_FIELDS = [
  { name: "mint_authority", type: "Pubkey" as InstructionDataType, offset: 0 },
  { name: "supply", type: "u64" as InstructionDataType, offset: 32 },
  { name: "decimals", type: "u8" as InstructionDataType, offset: 40 },
  { name: "is_initialized", type: "u8" as InstructionDataType, offset: 41 },
  { name: "freeze_authority", type: "Pubkey" as InstructionDataType, offset: 42 },
] as const;

export const SYSVAR_CLOCK_FIELDS = [
  { name: "slot", type: "u64" as InstructionDataType, offset: 0 },
  { name: "epoch_start_timestamp", type: "i64" as InstructionDataType, offset: 8 },
  { name: "epoch", type: "u64" as InstructionDataType, offset: 16 },
  { name: "leader_schedule_epoch", type: "u64" as InstructionDataType, offset: 24 },
  { name: "unix_timestamp", type: "i64" as InstructionDataType, offset: 32 },
] as const;

export const SYSVAR_RENT_FIELDS = [
  { name: "lamports_per_byte_year", type: "u64" as InstructionDataType, offset: 0 },
  { name: "exemption_threshold", type: "f64" as InstructionDataType, offset: 8 },
  { name: "burn_percent", type: "u8" as InstructionDataType, offset: 16 },
] as const;

export type Account = {
  name: string;
  type: keyof typeof ACCOUNT_TYPES;
  dataLength: number;
  extensions?: Extension[];
  customFields?: {
    id?: string;
    name: string;
    type: InstructionDataType;
    size?: number;
  }[];
};

export type TypedAccount = {
  name: string;
  type: keyof typeof ACCOUNT_TYPES;
  dataLength: number;
  extensions?: Extension[];
  customFields?: {
    id?: string;
    name: string;
    type: InstructionDataType;
    size?: number;
  }[];
  calculateSize: () => number;
};

export type Project = {
  id: string;
  name: string;
  accounts: Account[];
  instructionData?: InstructionDataField[]; // Optional for backwards compatibility
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
  accounts: Account[];
  updateAccount: (index: number, updatedAccount: Account) => void;
  removeAccount: (index: number) => void;
}
