import { useState } from "react";
import Navigation from "@/components/Navigation";
import WardrobeUpload from "@/components/WardrobeUpload";
import OutfitSuggester from "@/components/OutfitSuggester";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const [activeTab, setActiveTab] = useState("wardrobe");
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading StyleGenie...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => {}} />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header with user info */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">StyleGenie</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Your Personal
                <span className="block bg-gradient-accent bg-clip-text text-transparent">
                  Style Genie
                </span>
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-lg">
                Upload your wardrobe, get AI-powered outfit suggestions, and never wonder what to wear again.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => setActiveTab("wardrobe")}
                  className="px-8 py-4 bg-white text-fashion-purple font-semibold rounded-xl hover:bg-white/90 transition-all duration-300 shadow-elegant"
                >
                  Upload Wardrobe
                </button>
                <button 
                  onClick={() => setActiveTab("suggester")}
                  className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-fashion-purple transition-all duration-300"
                >
                  Get Styled
                </button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <img 
                src={heroImage} 
                alt="Stylish wardrobe showcase" 
                className="w-full h-auto rounded-2xl shadow-elegant"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation and Content */}
      <section className="bg-background min-h-screen rounded-t-3xl relative -mt-12 pt-12">
        <div className="container mx-auto px-4 py-8">
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="mt-8">
            {activeTab === "wardrobe" && <WardrobeUpload />}
            {activeTab === "suggester" && <OutfitSuggester />}
            {activeTab === "favorites" && (
              <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-4">Favorites Coming Soon!</h2>
                <p className="text-muted-foreground">Save your favorite outfits and access them quickly.</p>
              </div>
            )}
            {activeTab === "profile" && (
              <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
                <p className="text-muted-foreground">Customize your style preferences and settings.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;