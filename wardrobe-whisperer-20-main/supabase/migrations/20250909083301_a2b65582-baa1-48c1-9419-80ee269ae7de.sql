-- Add weather and occasion fields to clothing_items table
ALTER TABLE public.clothing_items 
ADD COLUMN IF NOT EXISTS weather_suitability TEXT[],
ADD COLUMN IF NOT EXISTS occasion_type TEXT[],
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Update the category field to allow more options (remove enum constraint if exists)
-- Add comments for clarity
COMMENT ON COLUMN public.clothing_items.weather_suitability IS 'Array of weather types this item is suitable for';
COMMENT ON COLUMN public.clothing_items.occasion_type IS 'Array of occasion types this item is suitable for';
COMMENT ON COLUMN public.clothing_items.subcategory IS 'Detailed subcategory of the clothing item';