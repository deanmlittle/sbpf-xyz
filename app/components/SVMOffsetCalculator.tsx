"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Plus, Menu, Download, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "../types";
import Logo from "./Logo";
import OffsetDisplay from "./OffsetDisplay";
import { toast } from "sonner";
import Image from "next/image";

const AUTOSAVE_DELAY = 1000;

const ProjectSidebar = ({
  isOpen,
  onClose,
  projects,
  currentProject,
  onSelectProject,
  onImport,
}: ProjectSidebarProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
          !["ASM", "Rust", "C"].includes(projectData.language)
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
          id: Date.now(),
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
      } z-50`}
    >
      <div className="p-4 flex justify-between items-center border-b border-border">
        <h2 className="text-lg font-semibold">Projects</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Project
        </Button>
        <div className="space-y-2">
          {projects.map((project) => (
            <Button
              key={project.id}
              variant={
                currentProject?.id === project.id ? "secondary" : "ghost"
              }
              className="w-full justify-start"
              onClick={() => onSelectProject(project)}
            >
              {project.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AccountEntry = ({
  account,
  index,
  updateAccount,
  removeAccount,
}: AccountEntryProps) => {
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

  return (
    <div className="flex flex-col gap-4 p-4 bg-background/5 rounded-lg border border-border">
      <div className="flex items-center gap-4">
        <div className="flex-1 grid grid-cols-3 gap-4">
          <Input
            placeholder="Account name"
            value={account.name}
            onChange={(e) =>
              updateAccount(index, { ...account, name: e.target.value })
            }
            className="bg-background"
          />
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
            className="bg-background"
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
    </div>
  );
};

const SVMOffsetCalculator = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [language, setLanguage] = useState<Language>("ASM");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem("svm-projects");
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Autosave current project
  useEffect(() => {
    if (currentProject) {
      const saveTimeout = setTimeout(() => {
        const updatedProject: Project = {
          ...currentProject,
          accounts,
        };
        const updatedProjects = projects.map((p: Project) =>
          p.id === currentProject.id ? updatedProject : p
        );
        setProjects(updatedProjects);
        localStorage.setItem("svm-projects", JSON.stringify(updatedProjects));
      }, AUTOSAVE_DELAY);

      return () => clearTimeout(saveTimeout);
    }
  }, [accounts, language, currentProject, projects]);

  const addAccount = () => {
    const newAccount: Account = {
      name: `ACCOUNT${accounts.length + 1}`,
      type: "System" as keyof typeof ACCOUNT_TYPES,
      dataLength: 0,
      extensions: [],
    };
    setAccounts([...accounts, newAccount]);
  };

  const updateAccount = (index: number, updatedAccount: Account) => {
    const updatedAccounts = [...accounts];
    updatedAccounts[index] = updatedAccount;
    setAccounts(updatedAccounts);
  };

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
            <Logo />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Input
              placeholder="Project Name"
              value={currentProject?.name || ""}
              onChange={(e) => {
                if (currentProject) {
                  setCurrentProject({
                    ...currentProject,
                    name: e.target.value,
                  });
                } else {
                  setCurrentProject({
                    id: Date.now(),
                    name: e.target.value,
                    accounts: [],
                    language: language,
                  });
                }
              }}
              className="w-32 sm:w-48 bg-background text-sm sm:text-base"
            />
            <Button
              onClick={exportProject}
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              <Download className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
              <span className="inline sm:hidden">Save</span>
            </Button>
          </div>
        </div>
      </header>

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(project) => {
          setCurrentProject(project);
          setAccounts(project.accounts);
          setLanguage(project.language);
          setIsSidebarOpen(false);
        }}
        onImport={(projectData) => {
          const newProject = {
            ...projectData,
          };
          setProjects([...projects, newProject]);
          setCurrentProject(newProject);
          setAccounts(projectData.accounts);
          setLanguage(projectData.language);
          setIsSidebarOpen(false);
        }}
      />

      <main className="container mx-auto px-4 py-8 min-h-[80vh]">
        <Card className="w-full max-w-4xl mx-auto bg-background/40">
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              {accounts.map((account, index) => (
                <AccountEntry
                  key={index}
                  index={index}
                  account={account}
                  updateAccount={updateAccount}
                  removeAccount={removeAccount}
                />
              ))}
            </div>

            <div className="flex gap-4 items-center">
              <Button onClick={addAccount} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
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
              <OffsetDisplay accounts={accounts} language={language} />
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="border-t border-border py-6 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Built with ❤️ by Blueshift
            </span>
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
                className="group-hover:scale-110 transition-transform duration-200"
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
                className="group-hover:scale-110 transition-transform duration-200"
              />
              Follow on X
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SVMOffsetCalculator;
