import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Shirt, Crown, Gem, Loader2, Plus, Palette, Sun, Snowflake, Cloud, Save, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ColorThief from 'colorthief';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  color: string;
  weather_suitability?: string[];
  occasion_type?: string[];
  tags?: string[];
  image_url?: string;
  storage_path?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface UploadingItem {
  file: File;
  preview: string;
  name: string;
  category: string;
  subcategory: string;
  color: string;
  weather_suitability: string[];
  occasion_type: string[];
}

const WardrobeUpload = () => {
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingItems, setUploadingItems] = useState<Set<string>>(new Set());
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [currentUploadItem, setCurrentUploadItem] = useState<UploadingItem | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Comprehensive categories and options
  const categories = [
    { value: 'tops', label: 'Tops', subcategories: ['T-Shirts', 'Blouses', 'Shirts', 'Tank Tops', 'Sweaters', 'Hoodies', 'Crop Tops', 'Blazers', 'Cardigans', 'Vests'] },
    { value: 'bottoms', label: 'Bottoms', subcategories: ['Jeans', 'Trousers', 'Shorts', 'Skirts', 'Leggings', 'Sweatpants', 'Formal Pants', 'Culottes', 'Palazzo Pants'] },
    { value: 'dresses', label: 'Dresses & Jumpsuits', subcategories: ['Casual Dresses', 'Formal Dresses', 'Evening Gowns', 'Cocktail Dresses', 'Maxi Dresses', 'Mini Dresses', 'Midi Dresses', 'Jumpsuits', 'Rompers'] },
    { value: 'outerwear', label: 'Jackets & Coats', subcategories: ['Denim Jackets', 'Leather Jackets', 'Bomber Jackets', 'Blazers', 'Suit Jackets', 'Winter Coats', 'Trench Coats', 'Parkas', 'Windbreakers', 'Puffer Jackets'] },
    { value: 'shoes', label: 'Footwear', subcategories: ['Sneakers', 'Running Shoes', 'High Heels', 'Block Heels', 'Flats', 'Ballet Flats', 'Ankle Boots', 'Knee Boots', 'Combat Boots', 'Sandals', 'Flip Flops', 'Loafers', 'Oxford Shoes', 'Dress Shoes'] },
    { value: 'accessories', label: 'Bags & Accessories', subcategories: ['Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Clutches', 'Backpacks', 'Tote Bags', 'Wallets', 'Jewelry', 'Necklaces', 'Earrings', 'Bracelets', 'Rings', 'Belts', 'Sunglasses', 'Watches'] },
    { value: 'scarfs', label: 'Scarfs & Wraps', subcategories: ['Silk Scarfs', 'Wool Scarfs', 'Cashmere Scarfs', 'Cotton Scarfs', 'Infinity Scarfs', 'Pashminas', 'Shawls', 'Wraps', 'Bandanas'] },
    { value: 'hats', label: 'Hats & Headwear', subcategories: ['Baseball Caps', 'Beanies', 'Fedoras', 'Sun Hats', 'Berets', 'Bucket Hats', 'Visors', 'Headbands', 'Hair Ties', 'Hair Clips'] },
    { value: 'activewear', label: 'Activewear & Sports', subcategories: ['Sports Bras', 'Athletic Shorts', 'Yoga Pants', 'Leggings', 'Workout Tops', 'Running Gear', 'Swimwear', 'Activewear Sets'] },
    { value: 'intimates', label: 'Intimates & Sleepwear', subcategories: ['Bras', 'Underwear', 'Shapewear', 'Camisoles', 'Pajamas', 'Nightgowns', 'Robes', 'Loungewear'] }
  ];

  const weatherOptions = [
    { value: 'hot', label: 'Hot & Sunny', icon: Sun },
    { value: 'warm', label: 'Warm & Pleasant', icon: Sun },
    { value: 'mild', label: 'Mild & Cool', icon: Cloud },
    { value: 'cold', label: 'Cold & Chilly', icon: Snowflake },
    { value: 'rainy', label: 'Rainy', icon: Cloud },
    { value: 'windy', label: 'Windy', icon: Cloud },
    { value: 'humid', label: 'Humid', icon: Sun }
  ];

  const occasionOptions = [
    'Business/Office Wear', 'Formal Events', 'Casual Outings', 'Date Night', 'Wedding Guest',
    'Job Interview', 'Cocktail Party', 'Beach/Vacation', 'Gym/Workout', 'Brunch',
    'Graduation', 'Holiday Party', 'Festival', 'Sports Event', 'Family Gathering',
    'Travel', 'Shopping', 'Outdoor Activities', 'Nightclub', 'Theater/Opera'
  ];

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
    }
  }, [user]);

  const fetchWardrobeItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const itemsWithImages = await Promise.all(
        (data || []).map(async (item) => {
          if (item.storage_path) {
            const { data: urlData } = await supabase.storage
              .from('wardrobe-images')
              .createSignedUrl(item.storage_path, 3600);
            
            return {
              ...item,
              image_url: urlData?.signedUrl || item.image_url
            } as ClothingItem;
          }
          return item as ClothingItem;
        })
      );

      setWardrobeItems(itemsWithImages);
    } catch (error: any) {
      console.error('Error fetching wardrobe items:', error);
      toast({
        title: "Error",
        description: "Failed to load wardrobe items.",
        variant: "destructive",
      });
    }
  };

  const extractDominantColor = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const colorThief = new ColorThief();
          const [r, g, b] = colorThief.getColor(img);
          const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          resolve(hexColor);
        } catch (error) {
          console.error('Error extracting color:', error);
          resolve('#808080'); // Default gray
        }
      };
      img.onerror = () => resolve('#808080');
      img.src = imageUrl;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    const filesArray = Array.from(files);
    setPendingFiles(filesArray);
    
    if (filesArray.length > 0) {
      await initializeFirstFile(filesArray[0]);
      setShowUploadDialog(true);
    }
  };

  const initializeFirstFile = async (file: File) => {
    const preview = URL.createObjectURL(file);
    const dominantColor = await extractDominantColor(preview);
    
    setCurrentUploadItem({
      file,
      preview,
      name: file.name.split('.')[0],
      category: 'tops',
      subcategory: '',
      color: dominantColor,
      weather_suitability: [],
      occasion_type: []
    });
    setCurrentFileIndex(0);
  };

  const handleSaveCurrentItem = async () => {
    if (!currentUploadItem || !user) return;

    setIsLoading(true);

    try {
      // Upload image to Supabase Storage
      const fileExt = currentUploadItem.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(fileName, currentUploadItem.file);

      if (uploadError) throw uploadError;

      // Create database record with all the details
      const { error: dbError } = await supabase
        .from('clothing_items')
        .insert({
          user_id: user.id,
          name: currentUploadItem.name,
          category: currentUploadItem.category,
          subcategory: currentUploadItem.subcategory || null,
          color: currentUploadItem.color,
          weather_suitability: currentUploadItem.weather_suitability.length > 0 ? currentUploadItem.weather_suitability : null,
          occasion_type: currentUploadItem.occasion_type.length > 0 ? currentUploadItem.occasion_type : null,
          storage_path: fileName,
        });

      if (dbError) throw dbError;

      // Move to next file or close dialog
      const nextIndex = currentFileIndex + 1;
      if (nextIndex < pendingFiles.length) {
        await initializeFirstFile(pendingFiles[nextIndex]);
        setCurrentFileIndex(nextIndex);
      } else {
        // All files processed
        setShowUploadDialog(false);
        setPendingFiles([]);
        setCurrentUploadItem(null);
        setCurrentFileIndex(0);
        await fetchWardrobeItems();
        
        toast({
          title: "Items uploaded successfully!",
          description: "Your clothing items have been added to your wardrobe.",
        });
      }
    } catch (error: any) {
      console.error('Error uploading item:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentItem = (updates: Partial<UploadingItem>) => {
    if (currentUploadItem) {
      setCurrentUploadItem({ ...currentUploadItem, ...updates });
    }
  };

  const removeItem = async (item: ClothingItem) => {
    if (!user) return;

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      // Delete from storage if exists
      if (item.storage_path) {
        await supabase.storage
          .from('wardrobe-images')
          .remove([item.storage_path]);
      }

      // Update local state
      setWardrobeItems(prev => prev.filter(prevItem => prevItem.id !== item.id));

      toast({
        title: "Item removed",
        description: "The item has been removed from your wardrobe.",
      });
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateItemDetails = async (itemId: string, updates: Partial<ClothingItem>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('clothing_items')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) throw error;

      setWardrobeItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));

      toast({
        title: "Item updated",
        description: "Item details have been saved.",
      });
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item details.",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "accessories": return <Crown className="w-4 h-4" />;
      case "shoes": return <Gem className="w-4 h-4" />;
      case "outerwear": return <Shirt className="w-4 h-4" />;
      default: return <Shirt className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Your Wardrobe
        </h2>
        <p className="text-muted-foreground">Upload photos of your clothing items with detailed categorization</p>
      </div>

      <Card className="border-dashed border-2 border-fashion-purple/30 bg-gradient-secondary">
        <CardContent className="p-8">
          <div className="text-center">
            <Upload className="w-12 h-12 text-fashion-purple mx-auto mb-4" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Upload Clothing Items</h3>
              <p className="text-muted-foreground">
                Select multiple photos to categorize and add to your wardrobe
              </p>
            </div>
            <div className="mt-6">
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
              <Button 
                variant="gradient" 
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Choose Files
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Categorize Your Item ({currentFileIndex + 1} of {pendingFiles.length})
            </DialogTitle>
          </DialogHeader>
          
          {currentUploadItem && (
            <div className="space-y-6">
              {/* Image Preview */}
              <div className="flex justify-center">
                <img
                  src={currentUploadItem.preview}
                  alt="Preview"
                  className="max-w-full h-48 object-cover rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Item Name</Label>
                  <Input
                    value={currentUploadItem.name}
                    onChange={(e) => updateCurrentItem({ name: e.target.value })}
                    placeholder="e.g., Blue Denim Jacket"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={currentUploadItem.category}
                    onValueChange={(value) => updateCurrentItem({ category: value, subcategory: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory */}
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select
                    value={currentUploadItem.subcategory}
                    onValueChange={(value) => updateCurrentItem({ subcategory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .find(cat => cat.value === currentUploadItem.category)
                        ?.subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label>Dominant Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={currentUploadItem.color}
                      onChange={(e) => updateCurrentItem({ color: e.target.value })}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={currentUploadItem.color}
                      onChange={(e) => updateCurrentItem({ color: e.target.value })}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Weather Suitability */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Weather Suitability</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {weatherOptions.map((weather) => (
                      <div key={weather.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`weather-${weather.value}`}
                          checked={currentUploadItem.weather_suitability.includes(weather.value)}
                          onCheckedChange={(checked) => {
                            const newWeather = checked
                              ? [...currentUploadItem.weather_suitability, weather.value]
                              : currentUploadItem.weather_suitability.filter(w => w !== weather.value);
                            updateCurrentItem({ weather_suitability: newWeather });
                          }}
                        />
                        <label
                          htmlFor={`weather-${weather.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                        >
                          <weather.icon className="w-3 h-3" />
                          {weather.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Occasion Types */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Suitable Occasions</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {occasionOptions.map((occasion) => (
                      <div key={occasion} className="flex items-center space-x-2">
                        <Checkbox
                          id={`occasion-${occasion}`}
                          checked={currentUploadItem.occasion_type.includes(occasion)}
                          onCheckedChange={(checked) => {
                            const newOccasions = checked
                              ? [...currentUploadItem.occasion_type, occasion]
                              : currentUploadItem.occasion_type.filter(o => o !== occasion);
                            updateCurrentItem({ occasion_type: newOccasions });
                          }}
                        />
                        <label
                          htmlFor={`occasion-${occasion}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {occasion}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveCurrentItem} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : currentFileIndex < pendingFiles.length - 1 ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save & Next
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save & Finish
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wardrobe Items Grid */}
      {wardrobeItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wardrobeItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-4">
                <div className="relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                      <Shirt className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                    onClick={() => removeItem(item)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${item.id}`} className="text-xs">Name</Label>
                    <Input
                      id={`name-${item.id}`}
                      value={item.name}
                      onChange={(e) => updateItemDetails(item.id, { name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor={`category-${item.id}`} className="text-xs">Category</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => updateItemDetails(item.id, { category: value })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`color-${item.id}`} className="text-xs">Color</Label>
                      <Input
                        id={`color-${item.id}`}
                        value={item.color}
                        onChange={(e) => updateItemDetails(item.id, { color: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {getCategoryIcon(item.category)}
                    <span className="text-xs text-muted-foreground capitalize">{item.subcategory || item.category}</span>
                    <div className="w-3 h-3 rounded-full border-2 border-muted-foreground" 
                         style={{ backgroundColor: item.color }}></div>
                  </div>
                  
                  {(item.weather_suitability?.length || item.occasion_type?.length) && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {item.weather_suitability?.length && (
                        <div>Weather: {item.weather_suitability.slice(0, 2).join(', ')}{item.weather_suitability.length > 2 && '...'}</div>
                      )}
                      {item.occasion_type?.length && (
                        <div>Occasions: {item.occasion_type.slice(0, 2).join(', ')}{item.occasion_type.length > 2 && '...'}</div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WardrobeUpload;