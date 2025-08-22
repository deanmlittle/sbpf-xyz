"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { Trash2, Plus, Menu, Download, Upload, X, FileText, Share2, Copy, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Account,
  ACCOUNT_TYPES,
  AccountEntryProps,
  Language,
  Project,
  ProjectSidebarProps,
  TOKEN2022_EXTENSIONS,
  Extension,
  InstructionDataField,
  INSTRUCTION_DATA_TYPES,
  InstructionDataType,
} from "../types";
import Logo from "./Logo";
import OffsetDisplay from "./OffsetDisplay";
import { toast } from "sonner";
import Image from "next/image";

const AUTOSAVE_DELAY = 1000;
const LAST_PROJECT_KEY = "svm-last-project-id";

const ProjectSidebar = ({
  isOpen,
  onClose,
  projects,
  currentProject,
  onSelectProject,
  onImport,
  onDeleteClick,
  onNewProject,
}: ProjectSidebarProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDeleteClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick(project);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast("No file selected.");
      return;
    }
    if (!file.name.endsWith(".json")) {
      toast("Please upload a .json file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const projectData = JSON.parse(e.target?.result as string) as Project;
        if (
          !projectData.id ||
          !projectData.name ||
          !Array.isArray(projectData.accounts) ||
          (projectData.language && !["ASM", "Rust", "C"].includes(projectData.language))
        ) {
          toast("Invalid project file: missing or incorrect required fields.");
          return;
        }
        const validAccountTypes = Object.keys(ACCOUNT_TYPES);
        const isValidAccounts = projectData.accounts.every((account) =>
          validAccountTypes.includes(account.type)
        );
        if (!isValidAccounts) {
          toast("Invalid project file: contains invalid account types.");
          return;
        }
        onImport({
          ...projectData,
          id: uuidv4(),
          lastModified: Date.now(),
        });
      } catch (error) {
        console.error("Failed to parse project file:", error);
        toast("Failed to import project: invalid JSON format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full w-64 bg-background border-r border-border transform transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } z-50 flex flex-col`}
    >
      <div className="p-4 flex justify-between items-center border-b border-border">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Scrollable projects list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {projects
            .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
            .map((project) => (
            <div key={project.id} className="flex items-center gap-2">
              <Button
                variant={
                  currentProject?.id === project.id ? "secondary" : "ghost"
                }
                className="flex-1 justify-start"
                onClick={() => onSelectProject(project)}
              >
                {project.name}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteClick(project, e)}
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky bottom buttons */}
      <div className="p-4 border-t border-border space-y-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
        <Button
          variant="outline"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onNewProject}
        >
          <FileText className="h-4 w-4 mr-2" />
          New Project
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Project
        </Button>
      </div>
    </div>
  );
};

const SortableInstructionDataEntry = ({
  field,
  index,
  fields,
  updateField,
  removeField,
}: {
  field: InstructionDataField;
  index: number;
  fields: InstructionDataField[];
  updateField: (index: number, field: InstructionDataField) => void;
  removeField: (index: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'z-10' : ''}`}
    >
      <InstructionDataEntry
        field={field}
        index={index}
        fields={fields}
        updateField={updateField}
        removeField={removeField}
        dragHandle={
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        }
      />
    </div>
  );
};

const InstructionDataEntry = ({
  field,
  index,
  fields,
  updateField,
  removeField,
  dragHandle,
}: {
  field: InstructionDataField;
  index: number;
  fields: InstructionDataField[];
  updateField: (index: number, field: InstructionDataField) => void;
  removeField: (index: number) => void;
  dragHandle?: React.ReactNode;
}) => {
  const isDuplicateFieldName = (name: string) => {
    if (name.trim() === "") return false;
    const duplicateIndexes = fields
      .map((f, i) => f.name.toLowerCase() === name.toLowerCase() ? i : -1)
      .filter(i => i !== -1);
    return duplicateIndexes.length > 1 && duplicateIndexes[0] !== index;
  };
  return (
    <div className="flex gap-2 items-end">
      {dragHandle}
      <div className="flex-1">
        <Input
          placeholder="Field name"
          value={field.name}
          onChange={(e) =>
            updateField(index, { ...field, name: e.target.value })
          }
          className={`${
            isDuplicateFieldName(field.name) && field.name.trim() !== ""
              ? "border-red-500 focus:border-red-500" 
              : ""
          }`}
        />
        {isDuplicateFieldName(field.name) && field.name.trim() !== "" && (
          <p className="text-xs text-red-500 mt-1">Field name must be unique</p>
        )}
      </div>
      <div className="w-32">
        <Select
          value={field.type}
          onValueChange={(value: InstructionDataType) =>
            updateField(index, { ...field, type: value, size: value === "[u8;N]" ? field.size || 1 : undefined })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(INSTRUCTION_DATA_TYPES).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {field.type === "[u8;N]" && (
        <div className="w-20">
          <Input
            type="number"
            placeholder="Size"
            min="1"
            value={field.size || ""}
            onChange={(e) =>
              updateField(index, { ...field, size: parseInt(e.target.value) || 1 })
            }
          />
        </div>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => removeField(index)}
        className="text-red-500 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const SortableAccountEntry = ({
  account,
  index,
  accounts,
  updateAccount,
  removeAccount,
}: AccountEntryProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'z-10' : ''}`}
    >
      <AccountEntry
        account={account}
        index={index}
        accounts={accounts}
        updateAccount={updateAccount}
        removeAccount={removeAccount}
        dragHandle={
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        }
      />
    </div>
  );
};

const SortableCustomField = memo(({
  field,
  fieldIndex,
  accountIndex,
  customFields,
  updateAccount,
  account,
}: {
  field: { id?: string; name: string; type: InstructionDataType; size?: number };
  fieldIndex: number;
  accountIndex: number;
  customFields: { id?: string; name: string; type: InstructionDataType; size?: number }[];
  updateAccount: (index: number, updatedAccount: Account) => void;
  account: Account;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldIndex });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleUpdateCustomField = (updatedField: { id?: string; name: string; type: InstructionDataType; size?: number }) => {
    const newCustomFields = [...customFields];
    newCustomFields[fieldIndex] = updatedField;
    const newLength = newCustomFields.reduce((total, f) => {
      if (f.type === "[u8;N]") {
        return total + (f.size || 0);
      }
      return total + INSTRUCTION_DATA_TYPES[f.type];
    }, 0);
    updateAccount(accountIndex, {
      ...account,
      customFields: newCustomFields,
      dataLength: newLength,
    });
  };

  const handleRemoveCustomField = () => {
    const newCustomFields = customFields.filter((_, i) => i !== fieldIndex);
    const newLength = newCustomFields.reduce((total, f) => {
      if (f.type === "[u8;N]") {
        return total + (f.size || 0);
      }
      return total + INSTRUCTION_DATA_TYPES[f.type];
    }, 0);
    updateAccount(accountIndex, {
      ...account,
      customFields: newCustomFields,
      dataLength: newLength,
    });
  };

  const isDuplicateCustomFieldName = (name: string) => {
    if (name.trim() === "" || !customFields) return false;
    const duplicateIndexes = customFields
      .map((f, i) => f.name.toLowerCase() === name.toLowerCase() ? i : -1)
      .filter(i => i !== -1);
    return duplicateIndexes.length > 1 && duplicateIndexes[0] !== fieldIndex;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 items-end bg-background px-2 py-2 rounded ${isDragging ? 'z-10' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
        <GripVertical className="h-3 w-3 text-gray-400" />
      </div>
      <div className="flex-1">
        <Input
          placeholder="Field name"
          value={field.name}
          onChange={(e) =>
            handleUpdateCustomField({ ...field, name: e.target.value })
          }
          className={`h-8 text-xs ${
            isDuplicateCustomFieldName(field.name) && field.name.trim() !== ""
              ? "border-red-500 focus:border-red-500" 
              : ""
          }`}
        />
        {isDuplicateCustomFieldName(field.name) && field.name.trim() !== "" && (
          <p className="text-xs text-red-500 mt-1">Field name must be unique</p>
        )}
      </div>
      <div className="w-24">
        <Select
          value={field.type}
          onValueChange={(value: InstructionDataType) =>
            handleUpdateCustomField({ 
              ...field, 
              type: value, 
              size: value === "[u8;N]" ? field.size || 1 : undefined 
            })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(INSTRUCTION_DATA_TYPES).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {field.type === "[u8;N]" && (
        <div className="w-16">
          <Input
            type="number"
            placeholder="Size"
            min="1"
            value={field.size || ""}
            onChange={(e) =>
              handleUpdateCustomField({ 
                ...field, 
                size: parseInt(e.target.value) || 1 
              })
            }
            className="h-8 text-xs"
          />
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRemoveCustomField}
        className="h-8 w-8 text-red-500 hover:text-red-600"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
});

SortableCustomField.displayName = 'SortableCustomField';

const AccountEntry = ({
  account,
  index,
  accounts,
  updateAccount,
  removeAccount,
  dragHandle,
}: AccountEntryProps & { dragHandle?: React.ReactNode }) => {

  const customFieldSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddExtension = (ext: Extension) => {
    const newExtensions = [...(account.extensions || []), ext];
    const newLength =
      ACCOUNT_TYPES[account.type] +
      newExtensions.reduce((sum, e) => sum + TOKEN2022_EXTENSIONS[e], 0);
    updateAccount(index, {
      ...account,
      extensions: newExtensions,
      dataLength: newLength,
    });
  };

  const handleRemoveExtension = (ext: Extension) => {
    const newExtensions = (account.extensions || []).filter((e) => e !== ext);
    const newLength =
      ACCOUNT_TYPES[account.type] +
      newExtensions.reduce((sum, e) => sum + TOKEN2022_EXTENSIONS[e], 0);
    updateAccount(index, {
      ...account,
      extensions: newExtensions,
      dataLength: newLength,
    });
  };

  const handleAddCustomField = () => {
    const newField = {
      id: uuidv4(),
      name: `field_${(account.customFields?.length || 0) + 1}`,
      type: "u8" as InstructionDataType,
    };
    const newCustomFields = [...(account.customFields || []), newField];
    const newLength = calculateCustomFieldsSize(newCustomFields);
    updateAccount(index, {
      ...account,
      customFields: newCustomFields,
      dataLength: newLength,
    });
  };

  const calculateCustomFieldsSize = (fields: { id?: string; name: string; type: InstructionDataType; size?: number }[]) => {
    return fields.reduce((total, field) => {
      if (field.type === "[u8;N]") {
        return total + (field.size || 0);
      }
      return total + INSTRUCTION_DATA_TYPES[field.type];
    }, 0);
  };

  const isDuplicateName = (name: string) => {
    if (name.trim() === "") return false;
    const duplicateIndexes = accounts
      .map((acc, i) => acc.name.toLowerCase() === name.toLowerCase() ? i : -1)
      .filter(i => i !== -1);
    return duplicateIndexes.length > 1 && duplicateIndexes[0] !== index;
  };



  const handleCustomFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && account.customFields) {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;
      const reorderedFields = arrayMove(account.customFields, oldIndex, newIndex);
      updateAccount(index, {
        ...account,
        customFields: reorderedFields,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-background/5 rounded-lg border border-border">
      <div className="flex items-center gap-4">
        {dragHandle}
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="flex-1">
            <Input
              placeholder="Account name"
              value={account.name}
              onChange={(e) => {
                const newName = e.target.value;
                // Always allow the update to show the input, validation happens visually
                updateAccount(index, { ...account, name: newName });
              }}
              className={`bg-background ${
                isDuplicateName(account.name) && account.name.trim() !== ""
                  ? "border-red-500 focus:border-red-500" 
                  : ""
              }`}
            />
            {isDuplicateName(account.name) && account.name.trim() !== "" && (
              <p className="text-xs text-red-500 mt-1">Account name must be unique</p>
            )}
          </div>
          <Select
            value={account.type}
            onValueChange={(value: keyof typeof ACCOUNT_TYPES) => {
              const baseLen = ACCOUNT_TYPES[value];
              updateAccount(index, {
                ...account,
                type: value,
                dataLength: baseLen,
                extensions: value.startsWith("Token2022")
                  ? account.extensions || []
                  : [],
              });
            }}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(ACCOUNT_TYPES).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder={
              account.type.startsWith("Token2022")
                ? "82 + extensions"
                : "Data length"
            }
            min="0"
            value={account.dataLength}
            onChange={(e) =>
              updateAccount(index, {
                ...account,
                dataLength: parseInt(e.target.value),
              })
            }
            disabled={account.type === "SPL Token" || account.type === "SPL Mint" || account.type === "TypedAccount"}
            className={`bg-background ${
              account.type === "SPL Token" || account.type === "SPL Mint" || account.type === "TypedAccount"
                ? "opacity-60 cursor-not-allowed" 
                : ""
            }`}
          />
        </div>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => removeAccount(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Extensions UI */}
      {account.type.startsWith("Token2022") && (
        <div className="pl-2 border-l-2 border-border flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Extensions</span>
            <Select onValueChange={(ext: Extension) => handleAddExtension(ext)}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="+ Add Extension" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(TOKEN2022_EXTENSIONS).map((ext) => (
                  <SelectItem
                    key={ext}
                    value={ext}
                    disabled={account.extensions?.includes(ext as Extension)}
                  >
                    {ext} (+{TOKEN2022_EXTENSIONS[ext as Extension]} bytes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            {account.extensions?.map((ext) => (
              <div
                key={ext}
                className="flex items-center justify-between bg-background px-2 py-1 rounded"
              >
                <span className="text-xs">
                  {ext} ({TOKEN2022_EXTENSIONS[ext]} bytes)
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveExtension(ext)}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Fields UI for TypedAccount */}
      {account.type === "TypedAccount" && (
        <div className="pl-2 border-l-2 border-border flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Custom Fields</span>
            <Button onClick={handleAddCustomField} size="sm" className="h-8">
              <Plus className="h-3 w-3 mr-1" />
              Add Field
            </Button>
          </div>

          <DndContext
            sensors={customFieldSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCustomFieldDragEnd}
          >
            <SortableContext items={account.customFields?.map((_, index) => index) || []} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {account.customFields?.map((field, fieldIndex) => (
                  <SortableCustomField
                    key={field.id || `field-${index}-${fieldIndex}`}
                    field={field}
                    fieldIndex={fieldIndex}
                    accountIndex={index}
                    customFields={account.customFields || []}
                    updateAccount={updateAccount}
                    account={account}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

const SVMOffsetCalculator = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [instructionData, setInstructionData] = useState<InstructionDataField[]>([]);
  const [language, setLanguage] = useState<Language>("ASM");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [projectJson, setProjectJson] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictProject, setConflictProject] = useState<Project | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle account reordering
  const handleAccountDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;
      setAccounts(arrayMove(accounts, oldIndex, newIndex));
    }
  };

  // Handle instruction data field reordering
  const handleInstructionDataDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;
      setInstructionData(arrayMove(instructionData, oldIndex, newIndex));
    }
  };

  // Save last opened project ID
  const saveLastProjectId = (projectId: string) => {
    try {
      localStorage.setItem(LAST_PROJECT_KEY, projectId);
    } catch (error) {
      console.error('Error saving last project ID:', error);
    }
  };


  // Load projects from localStorage on mount and restore last project
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem("svm-projects");
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        
        // Check for shared project in URL
        const urlParams = new URLSearchParams(window.location.search);
        const sharedProject = urlParams.get('project');
        
        if (sharedProject) {
          try {
            const decodedData = atob(decodeURIComponent(sharedProject));
            const projectData = JSON.parse(decodedData) as Project;
            
            // Check if a project with this UUID already exists
            const existingProject = parsedProjects.find((p: Project) => p.id === projectData.id);
            
            if (existingProject) {
              // UUID conflict - show modal to ask user
              setConflictProject(projectData);
              setConflictModalOpen(true);
            } else {
              // No conflict - load directly (inline to avoid dependency)
              // Migrate custom fields to ensure they have IDs
              const migratedAccounts = projectData.accounts.map((account: Account) => {
                if (account.type === "TypedAccount" && account.customFields) {
                  return {
                    ...account,
                    customFields: account.customFields.map(field => 
                      field.id ? field : { ...field, id: uuidv4() }
                    )
                  };
                }
                return account;
              });
              
              setCurrentProject(projectData);
              setAccounts(migratedAccounts);
              setInstructionData(projectData.instructionData || []);
              setLanguage(projectData.language || "ASM");
              setShowWelcome(false);
              saveLastProjectId(projectData.id);
              
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
              toast(`Loaded shared project: ${projectData.name}`);
            }
            return;
          } catch (error) {
            console.error('Error loading shared project:', error);
            toast("Error loading shared project. Invalid data.");
          }
        }
        
        // Restore last opened project if no shared project
        try {
          const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY);
          if (lastProjectId && parsedProjects.length > 0) {
            const lastProject = parsedProjects.find((p: Project) => p.id === lastProjectId);
            if (lastProject) {
              // Migrate custom fields to ensure they have IDs
              const migratedAccounts = lastProject.accounts.map((account: Account) => {
                if (account.type === "TypedAccount" && account.customFields) {
                  return {
                    ...account,
                    customFields: account.customFields.map(field => 
                      field.id ? field : { ...field, id: uuidv4() }
                    )
                  };
                }
                return account;
              });
              
              setCurrentProject(lastProject);
              setAccounts(migratedAccounts);
              setInstructionData(lastProject.instructionData || []);
              setLanguage(lastProject.language || "ASM");
            } else {
              // Last project ID exists but project not found - show welcome
              setShowWelcome(true);
            }
          } else {
            // No last project ID - show welcome screen
            setShowWelcome(true);
          }
        } catch (error) {
          console.error('Error accessing last project:', error);
          setShowWelcome(true);
        }
      } else {
        // No saved projects at all - show welcome screen
        setShowWelcome(true);
      }
    } catch (error) {
      console.error('Error loading initial state:', error);
      // Fallback to welcome screen if anything goes wrong
      setShowWelcome(true);
      setProjects([]);
    }
  }, []);

  // Autosave current project (always enabled)
  useEffect(() => {
    if (currentProject) {
      const saveTimeout = setTimeout(() => {
        try {
          const updatedProject: Project = {
            ...currentProject,
            accounts,
            instructionData,
            language,
            lastModified: Date.now(),
          };
          
          // Check if project already exists in projects array
          const existingProjectIndex = projects.findIndex(p => p.id === currentProject.id);
          let updatedProjects;
          
          if (existingProjectIndex >= 0) {
            // Update existing project
            updatedProjects = [...projects];
            updatedProjects[existingProjectIndex] = updatedProject;
          } else {
            // Add new project to array
            updatedProjects = [...projects, updatedProject];
          }
          
          setProjects(updatedProjects);
          localStorage.setItem("svm-projects", JSON.stringify(updatedProjects));
        } catch (error) {
          console.error('Error autosaving project:', error);
        }
      }, AUTOSAVE_DELAY);

      return () => clearTimeout(saveTimeout);
    }
  }, [accounts, instructionData, language, currentProject, projects]);

  const addAccount = () => {
    const newAccount: Account = {
      name: `ACCOUNT${accounts.length + 1}`,
      type: "System" as keyof typeof ACCOUNT_TYPES,
      dataLength: 0,
      extensions: [],
    };
    setAccounts([...accounts, newAccount]);
  };

  const addInstructionDataField = () => {
    const newField: InstructionDataField = {
      name: `field_${instructionData.length + 1}`,
      type: "u8" as InstructionDataType,
    };
    setInstructionData([...instructionData, newField]);
  };

  const updateInstructionDataField = (index: number, updatedField: InstructionDataField) => {
    const updated = [...instructionData];
    updated[index] = updatedField;
    setInstructionData(updated);
  };

  const removeInstructionDataField = (index: number) => {
    setInstructionData(instructionData.filter((_, i) => i !== index));
  };

  const updateAccount = useCallback((index: number, updatedAccount: Account) => {
    setAccounts(prevAccounts => {
      const updatedAccounts = [...prevAccounts];
      updatedAccounts[index] = updatedAccount;
      return updatedAccounts;
    });
  }, []);

  const removeAccount = (index: number) => {
    const updatedAccounts = accounts.filter((_, i) => i !== index);
    setAccounts(updatedAccounts);
  };

  const exportProject = () => {
    if (!currentProject) {
      toast("No project selected to export.");
      return;
    }
    const projectData: Project = {
      id: currentProject.id,
      name: currentProject.name || "Untitled Project",
      accounts,
      language,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectData.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      try {
        const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
        setProjects(updatedProjects);
        localStorage.setItem("svm-projects", JSON.stringify(updatedProjects));
        
        // If the deleted project was the current project
        if (currentProject?.id === projectToDelete.id) {
          if (updatedProjects.length > 0) {
            // Switch to the first available project
            const nextProject = updatedProjects[0];
            setCurrentProject(nextProject);
            setAccounts(nextProject.accounts);
            setInstructionData(nextProject.instructionData || []);
            setLanguage(nextProject.language || "ASM");
            setShowWelcome(false); // Ensure we don't show welcome screen
            // Update the last project ID in localStorage
            try {
              localStorage.setItem(LAST_PROJECT_KEY, nextProject.id);
            } catch (error) {
              console.error('Error saving last project ID:', error);
            }
          } else {
            // No projects left, show welcome screen
            setCurrentProject(null);
            setAccounts([]);
            setInstructionData([]);
            setLanguage("ASM");
            setShowWelcome(true);
            // Clear the last project ID from localStorage
            try {
              localStorage.removeItem(LAST_PROJECT_KEY);
            } catch (error) {
              console.error('Error removing last project ID:', error);
            }
          }
        }
        
        toast("Project deleted successfully.");
      } catch (error) {
        console.error('Error deleting project:', error);
        toast("Error deleting project. Please try again.");
      }
      
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setProjectToDelete(null);
  };

  const createNewProject = () => {
    const newProject: Project = {
      id: uuidv4(),
      name: "New Project",
      accounts: [],
      lastModified: Date.now(),
    };
    setCurrentProject(newProject);
    setAccounts([]);
    setInstructionData([]);
    saveLastProjectId(newProject.id);
    setShowWelcome(false); // Hide welcome screen
  };

  const createShare = () => {
    if (!currentProject) {
      toast("No project selected to share.");
      return;
    }

    const projectData: Project = {
      id: currentProject.id,
      name: currentProject.name || "Untitled Project",
      accounts,
    };

    // Create the project JSON content
    const json = JSON.stringify(projectData, null, 2);
    setProjectJson(json);

    // Create share URL
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000' 
      : 'https://sbpf.xyz';
    
    const encodedData = encodeURIComponent(btoa(JSON.stringify(projectData)));
    const url = `${baseUrl}?project=${encodedData}`;
    setShareUrl(url);
    
    setShareModalOpen(true);
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Share URL copied to clipboard!");
    } catch (error) {
      console.error('Error copying URL:', error);
      toast("Error copying URL. Please try selecting and copying manually.");
    }
  };

  const copyProjectJson = async () => {
    try {
      await navigator.clipboard.writeText(projectJson);
      toast("JSON copied to clipboard!");
    } catch (error) {
      console.error('Error copying JSON:', error);
      toast("Error copying JSON. Please try selecting and copying manually.");
    }
  };

  const downloadProjectJson = () => {
    if (!currentProject) return;
    
    const blob = new Blob([projectJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Project JSON downloaded!");
  };

  const loadSharedProject = (projectData: Project, override: boolean = false) => {
    // Migrate custom fields to ensure they have IDs
    const migratedAccounts = projectData.accounts.map(account => {
      if (account.type === "TypedAccount" && account.customFields) {
        return {
          ...account,
          customFields: account.customFields.map(field => 
            field.id ? field : { ...field, id: uuidv4() }
          )
        };
      }
      return account;
    });
    
    let finalProject: Project;
    
    if (override) {
      // Override existing project with same UUID
      finalProject = {
        ...projectData,
        accounts: migratedAccounts,
        lastModified: Date.now(),
      };
    } else {
      // Create new project with new UUID
      finalProject = {
        ...projectData,
        accounts: migratedAccounts,
        id: uuidv4(),
        lastModified: Date.now(),
      };
    }
    
    setCurrentProject(finalProject);
    setAccounts(migratedAccounts);
    setInstructionData(finalProject.instructionData || []);
    setLanguage(finalProject.language || "ASM");
    setShowWelcome(false);
    saveLastProjectId(finalProject.id);
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    toast(`Loaded shared project: ${finalProject.name}`);
  };

  const handleOverrideProject = () => {
    if (conflictProject) {
      loadSharedProject(conflictProject, true);
      setConflictModalOpen(false);
      setConflictProject(null);
    }
  };

  const handleCreateNewProject = () => {
    if (conflictProject) {
      loadSharedProject(conflictProject, false);
      setConflictModalOpen(false);
      setConflictProject(null);
    }
  };

  const handleImportFromWelcome = () => {
    setIsSidebarOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            {currentProject ? (
              <Input
                placeholder="Project Name"
                value={currentProject?.name || ""}
                onChange={(e) => {
                  const newName = e.target.value;
                  
                  if (currentProject) {
                    setCurrentProject({
                      ...currentProject,
                      name: newName,
                    });
                  }
                }}
                className="w-32 sm:w-48 bg-background text-sm sm:text-base"
              />
            ) : (
              <Logo />
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {projects.length === 0 ? (
              <>
                <Button
                  onClick={createNewProject}
                  className="text-xs sm:text-sm px-2 sm:px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Project</span>
                  <span className="inline sm:hidden">New</span>
                </Button>
                <Button
                  onClick={handleImportFromWelcome}
                  className="text-xs sm:text-sm px-2 sm:px-4"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Import Project</span>
                  <span className="inline sm:hidden">Import</span>
                </Button>
              </>
            ) : currentProject ? (
              <>
                <Button
                  onClick={exportProject}
                  className="text-xs sm:text-sm px-2 sm:px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="inline sm:hidden">Save</span>
                </Button>
                <Button
                  onClick={createShare}
                  className="text-xs sm:text-sm px-2 sm:px-4"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                  <span className="inline sm:hidden">Share</span>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Backdrop overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(project) => {
          // Migrate custom fields to ensure they have IDs
          const migratedAccounts = project.accounts.map(account => {
            if (account.type === "TypedAccount" && account.customFields) {
              return {
                ...account,
                customFields: account.customFields.map(field => 
                  field.id ? field : { ...field, id: uuidv4() }
                )
              };
            }
            return account;
          });
          
          setCurrentProject(project);
          setAccounts(migratedAccounts);
          setInstructionData(project.instructionData || []);
          setLanguage(project.language || "ASM");
          setIsSidebarOpen(false);
          setShowWelcome(false);
          saveLastProjectId(project.id);
        }}
        onImport={(projectData) => {
          // Migrate custom fields to ensure they have IDs
          const migratedAccounts = projectData.accounts.map(account => {
            if (account.type === "TypedAccount" && account.customFields) {
              return {
                ...account,
                customFields: account.customFields.map(field => 
                  field.id ? field : { ...field, id: uuidv4() }
                )
              };
            }
            return account;
          });
          
          const newProject = {
            ...projectData,
            accounts: migratedAccounts,
            id: uuidv4(), // Generate new UUID for imported project
            lastModified: Date.now(),
          };
          setProjects([...projects, newProject]);
          setCurrentProject(newProject);
          setAccounts(migratedAccounts);
          setInstructionData(projectData.instructionData || []);
          setLanguage(projectData.language || "ASM");
          setIsSidebarOpen(false);
          setShowWelcome(false);
          saveLastProjectId(newProject.id);
        }}
        onDeleteClick={handleDeleteClick}
        onNewProject={createNewProject}
      />

      <main className="container mx-auto px-4 py-8 min-h-[80vh]">
        {showWelcome || !currentProject ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-2xl mx-auto bg-background/40">
              <CardContent className="space-y-6 pt-8 pb-8 text-center">
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-primary">sbpf.xyz</h1>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    Calculate memory offsets for Solana accounts in your programs. Add accounts, configure their types and data lengths, and get precise offset calculations for ASM, Rust, and C.
                  </p>
                </div>
                <div className="pt-6">
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={createNewProject} 
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                    <Button 
                      onClick={handleImportFromWelcome} 
                      size="lg"
                      variant="outline"
                      className="px-6 py-3"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Project
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="w-full max-w-4xl mx-auto bg-background/40">
            <CardContent className="space-y-6 pt-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleAccountDragEnd}
              >
                <SortableContext items={accounts.map((_, index) => index)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {accounts.map((account, index) => (
                      <SortableAccountEntry
                        key={index}
                        index={index}
                        account={account}
                        accounts={accounts}
                        updateAccount={updateAccount}
                        removeAccount={removeAccount}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex gap-4 items-center">
                <Button onClick={addAccount} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </div>

              {/* Instruction Data Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Instruction Data</h3>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleInstructionDataDragEnd}
                >
                  <SortableContext items={instructionData.map((_, index) => index)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {instructionData.map((field, index) => (
                        <SortableInstructionDataEntry
                          key={index}
                          index={index}
                          field={field}
                          fields={instructionData}
                          updateField={updateInstructionDataField}
                          removeField={removeInstructionDataField}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <div className="flex gap-4 items-center">
                  <Button onClick={addInstructionDataField} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Add Field
                  </Button>
                </div>
              </div>
              <div className="flex flex-col">
                <Tabs
                  value={language}
                  onValueChange={(value) => {
                    setLanguage(value as Language);
                  }}
                  className="flex-1 "
                >
                  <TabsList className="bg-black grid grid-cols-3 h-10 pb-0 mb-0 rounded-b-none">
                    <TabsTrigger
                      className="rounded-b-none h-10 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                      value="ASM"
                    >
                      ASM
                    </TabsTrigger>
                    <TabsTrigger
                      className="rounded-b-none h-10 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                      value="Rust"
                    >
                      Rust
                    </TabsTrigger>
                    <TabsTrigger
                      className="rounded-b-none h-10 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                      value="C"
                    >
                      C
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <OffsetDisplay accounts={accounts} instructionData={instructionData} language={language} />
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="border-t border-border py-6 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Built with ❤️ by</span>
            <svg width="72" height="9" viewBox="0 0 144 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-auto">
              <g clipPath="url(#clip0_435_1262)">
                <mask id="mask0_435_1262" type="luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="144" height="20">
                  <path d="M144 0H0V20H144V0Z" fill="white"></path>
                </mask>
                <g mask="url(#mask0_435_1262)">
                  <path d="M4 4.00013H0V0.000131835H4V4.00013Z" fill="#00FFFF" id="1" opacity="1"></path>
                  <path d="M15.9997 4H11.9997V0H15.9997V4Z" fill="#00FFFF" id="2" opacity="1"></path>
                  <path d="M7.99987 8.00013H4V4.00013H7.99987V8.00013Z" fill="#00FFFF" id="3" opacity="1"></path>
                  <path d="M19.9996 7.99987H15.9997V4H19.9997L19.9996 7.99987Z" fill="#00FFFF" id="4" opacity="1"></path>
                  <path d="M11.9999 12H7.99987V8.00013H11.9999V12Z" fill="#00FFFF" id="5" opacity="1"></path>
                  <path d="M23.9996 11.9999H19.9997L19.9996 7.99987H23.9996V11.9999Z" fill="#00FFFF" id="6" opacity="1"></path>
                  <path d="M7.99987 16H4V12H7.99987V16Z" fill="#00FFFF" id="7" opacity="1"></path>
                  <path d="M19.9997 15.9999H15.9997V11.9999H19.9997V15.9999Z" fill="#00FFFF" id="8" opacity="1"></path>
                  <path d="M4 20H0V16H4V20Z" fill="#00FFFF" id="9" opacity="1"></path>
                  <path d="M15.9997 19.9999H11.9997V15.9999H15.9997V19.9999Z" fill="#00FFFF" id="10" opacity="1"></path>
                  <path d="M42.3 6.06C41.3333 5.44667 40.1666 5.14667 38.8 5.14667C37.72 5.14667 36.7933 5.34667 36.0133 5.75333C35.2333 6.16 34.6333 6.74 34.2066 7.50667H34.1133V0H30.5666V16.1667H28.8066V20H32.4466V17.4267H33.4466C33.94 18.2533 34.6066 18.8867 35.4466 19.3333C36.2866 19.78 37.3066 20 38.4933 20C39.9666 20 41.2133 19.6933 42.22 19.0867C43.2266 18.4733 43.9933 17.6133 44.52 16.4933C45.0466 15.3733 45.3066 14.0667 45.3066 12.5733C45.3066 11.08 45.0466 9.75333 44.5333 8.64667C44.02 7.53333 43.2733 6.67333 42.3066 6.06667L42.3 6.06ZM40.7666 15.7733C40.1066 16.54 39.1333 16.9267 37.8466 16.9267C36.72 16.9267 35.8133 16.6067 35.1333 15.96C34.4533 15.32 34.1066 14.44 34.1066 13.3267V11.8C34.1066 10.6867 34.4466 9.81333 35.1333 9.16667C35.8133 8.52667 36.72 8.2 37.8466 8.2C39.1333 8.2 40.1066 8.58667 40.7666 9.35333C41.4266 10.1267 41.7533 11.1933 41.7533 12.5533C41.7533 13.9133 41.4266 14.9867 40.7666 15.7533V15.7733ZM47.5 0H51.0466V20H47.5V0ZM67.5933 5.45333H64.0466V13.4067C64.0466 14.5 63.7266 15.3533 63.0933 15.9533C62.46 16.5533 61.5466 16.86 60.3533 16.86C59.2266 16.86 58.38 16.58 57.8066 16.0133C57.2333 15.4467 56.9466 14.6133 56.9466 13.5V5.45333H53.4V14.2133C53.4 15.9933 53.9266 17.4 54.98 18.44C56.0333 19.48 57.54 20 59.4933 20C60.76 20 61.8133 19.78 62.6466 19.3467C63.48 18.9133 64.1733 18.28 64.7333 17.4533H65.7333V20H69.3733V16.1933H67.5866V5.45333H67.5933ZM80.94 5.98667C79.8933 5.42667 78.64 5.14 77.18 5.14C75.72 5.14 74.3866 5.44 73.2733 6.03333C72.16 6.62667 71.3066 7.48 70.7 8.58C70.0933 9.68 69.7933 11 69.7933 12.52C69.7933 14.04 70.1 15.3667 70.7066 16.4867C71.32 17.6067 72.1866 18.4733 73.3133 19.08C74.44 19.6933 75.7733 19.9933 77.3133 19.9933C79.14 19.9933 80.6466 19.5667 81.8466 18.72C83.0466 17.8733 83.8133 16.6933 84.1466 15.1867H80.5733C80.3533 15.84 79.9666 16.3267 79.42 16.6533C78.8733 16.98 78.16 17.14 77.2866 17.14C76.1133 17.14 75.1733 16.82 74.4666 16.1733C73.76 15.5333 73.34 14.6067 73.2133 13.4H84.2133V12.16C84.2133 10.7133 83.9266 9.46667 83.3533 8.41333C82.78 7.36 81.9733 6.54667 80.9266 5.98667H80.94ZM73.3 11C73.52 10.0333 73.9666 9.28667 74.6333 8.76C75.3 8.23333 76.1466 7.97333 77.18 7.97333C78.2133 7.97333 79.06 8.23333 79.68 8.74667C80.3 9.26 80.68 10.0133 80.82 11H73.2933H73.3ZM94.96 11.2867L91.7466 10.6667C91.16 10.5533 90.7333 10.3867 90.46 10.1667C90.1933 9.94667 90.0533 9.65333 90.0533 9.28667C90.0533 8.79333 90.2666 8.42 90.6933 8.16667C91.12 7.91333 91.74 7.78667 92.5533 7.78667C93.46 7.78667 94.1533 7.94667 94.64 8.27333C95.1266 8.6 95.4533 9.12 95.6266 9.83333H99.0533C98.9266 8.34 98.3133 7.18667 97.2066 6.36667C96.1 5.54667 94.6133 5.14 92.74 5.14C90.8666 5.14 89.4 5.54 88.3333 6.34C87.2666 7.14 86.74 8.22 86.74 9.56667C86.74 11.66 88.14 12.98 90.9333 13.52L94.0733 14.1133C94.7266 14.24 95.1866 14.42 95.4666 14.66C95.7466 14.9 95.88 15.2333 95.88 15.66C95.88 16.7267 94.9666 17.2533 93.14 17.2533C92.06 17.2533 91.2333 17.0733 90.6666 16.72C90.0933 16.36 89.7533 15.8133 89.64 15.0667H86.1866C86.28 16.62 86.9266 17.8333 88.1133 18.7C89.3066 19.5667 90.9333 20 92.9933 20C95.0533 20 96.5266 19.5933 97.5866 18.7867C98.6533 17.98 99.18 16.8533 99.18 15.4067C99.18 14.28 98.84 13.38 98.1533 12.7133C97.4733 12.0467 96.4 11.5733 94.94 11.2867H94.96ZM109.533 5.45333C108.453 5.45333 107.52 5.65333 106.727 6.06C105.933 6.46667 105.307 7.05333 104.847 7.83333H104.753V0H101.207V20H104.753V12.0467C104.753 10.92 105.053 10.06 105.66 9.47333C106.26 8.88667 107.147 8.59333 108.3 8.59333C109.453 8.59333 110.34 8.88667 110.94 9.47333C111.54 10.06 111.847 10.92 111.847 12.0467V20H115.393V11.38C115.393 9.58667 114.867 8.15333 113.813 7.07333C112.76 5.99333 111.333 5.45333 109.54 5.45333H109.533ZM119.2 0.14C118.647 0.14 118.173 0.333333 117.787 0.726667C117.4 1.11333 117.2 1.58667 117.2 2.14667C117.2 2.70667 117.393 3.17333 117.787 3.56667C118.173 3.95333 118.647 4.14667 119.2 4.14667C119.753 4.14667 120.227 3.95333 120.613 3.56667C121 3.18 121.2 2.70667 121.2 2.14667C121.2 1.58667 121.007 1.12 120.613 0.726667C120.227 0.34 119.753 0.14 119.2 0.14ZM117.44 5.71333H120.987V20H117.44V5.71333ZM126.287 0.713333C125.753 1.18667 125.487 1.92667 125.487 2.92667V5.71333H122.793V8.47333H125.46V20H129.007V8.47333H132.267V5.71333H128.96V2.76H132.553V0H128.507C127.553 0 126.813 0.24 126.28 0.713333H126.287ZM140.267 17.22V8.49333H143.667V5.73333H140.22V1.44667H136.747V5.72667H134.2V8.48667H136.72V17.12C136.72 18.0867 136.98 18.8067 137.493 19.2867C138.007 19.76 138.733 20 139.667 20H143.993V17.22H140.26H140.267Z" fill="currentColor" opacity="1"></path>
                </g>
              </g>
              <defs>
                <clipPath id="clip0_435_1262">
                  <rect width="144" height="20" fill="white"></rect>
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <a
              href="https://github.com/deanmlittle/sbpf-xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:scale-130 transition-all duration-200  text-sm font-medium group flex items-center gap-1"
            >
              <Image
                src="/github.svg"
                alt="GitHub logo"
                width={16}
                height={16}
                className="group-hover:scale-110 transition-transform duration-200 brightness-0 invert"
              />
              Contribute on GitHub
            </a>
            <a
              href="https://x.com/blueshift_gg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:scale-130 transition-all duration-200 text-sm font-medium group flex items-center gap-1"
            >
              <Image
                src="/x.svg"
                alt="X logo"
                width={16}
                height={16}
                className="group-hover:scale-110 transition-transform duration-200 brightness-0 invert"
              />
              Follow on X
            </a>
          </div>
        </div>
      </footer>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose onClick={cancelDelete}>
              Cancel
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
            <DialogDescription>
              Share your project with others using a URL or export it as a JSON file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Share URL Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Share URL</h3>
              <div className="bg-muted p-3 rounded-lg">
                <code className="text-xs break-all">{shareUrl}</code>
              </div>
              <Button onClick={copyShareUrl} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Copy className="h-4 w-4 mr-2" />
                Copy Share URL
              </Button>
              <p className="text-xs text-muted-foreground">
                Anyone with this URL can view and import your project configuration.
              </p>
            </div>
            
            {/* Export JSON Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Export JSON</h3>
              <div className="bg-muted p-4 rounded-lg max-h-60 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {projectJson}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button onClick={copyProjectJson} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </Button>
                <Button onClick={downloadProjectJson} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Save the project configuration as a JSON file or copy it to your clipboard.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose onClick={() => setShareModalOpen(false)}>
              Done
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={conflictModalOpen} onOpenChange={setConflictModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Already Exists</DialogTitle>
            <DialogDescription>
              A project with the same ID already exists locally. Would you like to override it or create a new project with the same name?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Shared Project:</h4>
              <p className="text-sm"><strong>Name:</strong> {conflictProject?.name}</p>
              <p className="text-sm"><strong>Accounts:</strong> {conflictProject?.accounts.length || 0}</p>
              <p className="text-sm"><strong>Language:</strong> {conflictProject?.language}</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose onClick={() => setConflictModalOpen(false)}>
              Cancel
            </DialogClose>
            <Button variant="outline" onClick={handleCreateNewProject}>
              Create New Project
            </Button>
            <Button variant="destructive" onClick={handleOverrideProject}>
              Override Existing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SVMOffsetCalculator;
