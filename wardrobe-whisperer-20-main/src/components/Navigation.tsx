import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shirt, Sparkles, Heart, User } from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: "wardrobe", label: "My Wardrobe", icon: Shirt },
    { id: "suggester", label: "Style Suggester", icon: Sparkles },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="bg-background/80 backdrop-blur-lg border-b border-fashion-purple/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              StyleGenie
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "fashion" : "ghost"}
                  size="sm"
                  onClick={() => onTabChange(tab.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;