import { useState } from "react";
import { useLocation } from "wouter";
import { Settings2, Plus, RefreshCw, Import, Download, Search, FileJson, Copy, Trash2, Edit2, Play } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  name: string;
  type: "Local" | "Cloud";
  game: string;
  lastModified: string;
  description: string;
}

const MOCK_PROFILES: Profile[] = [
  { 
    id: "1", 
    name: "Profile 1", 
    type: "Local", 
    game: "Generic", 
    lastModified: "Just now",
    description: "Standard balanced profile for most FPS games" 
  },
  { 
    id: "2", 
    name: "Warzone - Aggressive", 
    type: "Local", 
    game: "Call of Duty", 
    lastModified: "2 hours ago",
    description: "High sensitivity with strong aim assist for CQC" 
  },
  { 
    id: "3", 
    name: "Apex Legends - Linear", 
    type: "Local", 
    game: "Apex Legends", 
    lastModified: "Yesterday",
    description: "Linear response curve with minimal deadzone" 
  }
];

export default function Profiles() {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("1");
  const [, setLocation] = useLocation();
  const selectedProfile = MOCK_PROFILES.find(p => p.id === selectedProfileId);

  return (
    <Shell>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Settings2 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Profiles</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-1">Save, apply, and manage local controller presets</p>
        </div>
        <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-full py-1.5 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-xs font-mono font-bold text-white">SYSTEM ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white tracking-tight">Profiles</h2>
            <p className="text-sm text-muted-foreground">Local profiles: save, apply, edit, import/export, compare.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-black/40 border border-border rounded-lg p-1 flex gap-1">
               <Button variant="ghost" size="sm" className="h-8 px-3 text-xs bg-white/10 text-white hover:bg-white/20">Library</Button>
               <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground hover:text-white hover:bg-white/5">Import / Export</Button>
               <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground hover:text-white hover:bg-white/5">Compare</Button>
            </div>
            <Button variant="outline" size="sm" className="h-10 border-border bg-transparent text-muted-foreground hover:text-white gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button className="h-10 bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold">
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>
        </div>

        {/* Library Layout */}
        <div className="grid grid-cols-12 gap-6 h-[600px]">
          
          {/* Profile List (Left) */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
             <div className="flex items-center justify-between px-1">
               <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Library</h3>
               <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{MOCK_PROFILES.length} Profiles</span>
             </div>
             
             <Card className="bg-card/40 border-border/50 backdrop-blur-md flex-1 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-white/5">
                   <div className="relative">
                     <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                     <input 
                       type="text" 
                       placeholder="Search profiles..." 
                       className="w-full bg-black/20 border border-white/10 rounded-md py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                     />
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                   {MOCK_PROFILES.map((profile) => (
                     <button
                       key={profile.id}
                       onClick={() => setSelectedProfileId(profile.id)}
                       className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
                         selectedProfileId === profile.id 
                           ? "bg-emerald-500/10 border-emerald-500/30 shadow-[inset_0_0_20px_-10px_rgba(16,185,129,0.3)]" 
                           : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"
                       }`}
                     >
                        <div className="flex justify-between items-start mb-1">
                           <span className={`text-sm font-semibold ${selectedProfileId === profile.id ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                             {profile.name}
                           </span>
                           {selectedProfileId === profile.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                           <span>{profile.game}</span>
                           <span className="w-0.5 h-0.5 rounded-full bg-gray-500"></span>
                           <span>{profile.type}</span>
                        </div>
                     </button>
                   ))}
                </div>
             </Card>
          </div>

          {/* Profile Details (Right) */}
          <div className="col-span-12 md:col-span-8">
             <Card className="h-full bg-card/20 border-border/30 backdrop-blur-md p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
                {selectedProfile ? (
                  <div className="w-full max-w-lg space-y-8 relative z-10">
                     <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shadow-2xl">
                        <FileJson className="w-10 h-10 text-emerald-400" />
                     </div>
                     
                     <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white tracking-tight">{selectedProfile.name}</h2>
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">{selectedProfile.game}</span>
                          <span>•</span>
                          <span>Last modified {selectedProfile.lastModified}</span>
                        </div>
                        <p className="text-gray-400 max-w-md mx-auto pt-2">{selectedProfile.description}</p>
                     </div>

                     <div className="grid grid-cols-2 gap-3 pt-4">
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-12 text-sm font-semibold shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)] transition-all">
                           <Play className="w-4 h-4 fill-current" />
                           Apply Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2 h-12 text-sm"
                          onClick={() => setLocation("/tuning")}
                        >
                           <Edit2 className="w-4 h-4" />
                           Edit Settings
                        </Button>
                        <Button variant="outline" className="border-white/10 bg-transparent hover:bg-white/5 text-muted-foreground hover:text-white gap-2 h-10 text-xs">
                           <Copy className="w-3.5 h-3.5" />
                           Duplicate
                        </Button>
                        <Button variant="outline" className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 gap-2 h-10 text-xs hover:border-red-500/30">
                           <Trash2 className="w-3.5 h-3.5" />
                           Delete
                        </Button>
                     </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Select a profile to view details.</div>
                )}
                
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
             </Card>
          </div>

        </div>
      </div>
    </Shell>
  );
}
