import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Wand2, Heart, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const OutfitSuggester = () => {
  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();

  const generateSuggestions = async () => {
    if (!occasion) {
      toast({
        title: "Please specify an occasion",
        description: "We need to know what you're dressing for!",
        variant: "destructive",
      });
      return;
    }

    if (!user || !session) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to get outfit suggestions.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('outfit-recommendations', {
        body: {
          occasion,
          weather: weather || "mild"
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setSuggestions([{
        id: Date.now(),
        outfit: data.outfit,
        reasoning: data.reasoning,
        styling_tips: data.styling_tips,
        suggestion_id: data.suggestion_id,
        confidence: 95
      }]);

      toast({
        title: "Outfit suggestions ready!",
        description: "Your AI stylist has created perfect combinations for you.",
      });
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error generating suggestions",
        description: error.message || "Failed to get outfit recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          AI Style Suggester
        </h2>
        <p className="text-muted-foreground">Get personalized outfit recommendations</p>
      </div>

      <Card className="bg-gradient-secondary border-fashion-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fashion-purple" />
            Tell us about your plans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="occasion">Occasion</Label>
            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger>
                <SelectValue placeholder="Select an occasion..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business meeting">Business Meeting</SelectItem>
                <SelectItem value="date night">Date Night</SelectItem>
                <SelectItem value="casual outing">Casual Outing</SelectItem>
                <SelectItem value="wedding guest">Wedding Guest</SelectItem>
                <SelectItem value="job interview">Job Interview</SelectItem>
                <SelectItem value="cocktail party">Cocktail Party</SelectItem>
                <SelectItem value="formal dinner">Formal Dinner</SelectItem>
                <SelectItem value="beach vacation">Beach Vacation</SelectItem>
                <SelectItem value="gym workout">Gym Workout</SelectItem>
                <SelectItem value="brunch">Brunch</SelectItem>
                <SelectItem value="graduation ceremony">Graduation Ceremony</SelectItem>
                <SelectItem value="christmas party">Christmas Party</SelectItem>
                <SelectItem value="diwali celebration">Diwali Celebration</SelectItem>
                <SelectItem value="chinese new year">Chinese New Year</SelectItem>
                <SelectItem value="eid celebration">Eid Celebration</SelectItem>
                <SelectItem value="music festival">Music Festival</SelectItem>
                <SelectItem value="art gallery opening">Art Gallery Opening</SelectItem>
                <SelectItem value="sports event">Sports Event</SelectItem>
                <SelectItem value="birthday party">Birthday Party</SelectItem>
                <SelectItem value="family gathering">Family Gathering</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="Or type your own occasion..."
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weather">Weather (optional)</Label>
            <Select value={weather} onValueChange={setWeather}>
              <SelectTrigger>
                <SelectValue placeholder="Select weather..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">Hot & Sunny</SelectItem>
                <SelectItem value="mild">Mild & Pleasant</SelectItem>
                <SelectItem value="cool">Cool & Breezy</SelectItem>
                <SelectItem value="cold">Cold & Chilly</SelectItem>
                <SelectItem value="rainy">Rainy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={generateSuggestions}
            variant="gradient" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Your Look...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate AI Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="shadow-elegant">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Perfect Outfit for {occasion}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <span className="font-bold text-fashion-purple">{suggestion.confidence}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {suggestion.outfit.map((item: any, index: number) => (
                      <div key={index} className="text-center">
                        <div className="w-16 h-16 bg-gradient-secondary rounded-lg mx-auto mb-2 flex items-center justify-center overflow-hidden">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Sparkles className="w-6 h-6 text-fashion-purple" />
                          )}
                        </div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                        <div className="w-3 h-3 rounded-full mx-auto mt-1" 
                             style={{ backgroundColor: item.color }}></div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                    </div>
                    {suggestion.styling_tips && (
                      <div className="p-3 bg-gradient-secondary rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Styling Tips:</h4>
                        <p className="text-sm text-muted-foreground">{suggestion.styling_tips}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <Button variant="outline-fashion" className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Save Outfit
                    </Button>
                    <Button variant="outline" onClick={generateSuggestions} disabled={isLoading}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Get New Suggestion
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OutfitSuggester;