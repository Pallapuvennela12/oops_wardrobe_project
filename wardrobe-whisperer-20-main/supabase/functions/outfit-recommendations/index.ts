import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { occasion, weather = "mild" } = await req.json();
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Fetching clothing items for user:', user.id);

    // Fetch user's clothing items
    const { data: clothingItems, error: clothingError } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id);

    if (clothingError) {
      console.error('Error fetching clothing items:', clothingError);
      throw new Error('Failed to fetch clothing items');
    }

    console.log('Found clothing items:', clothingItems?.length || 0);

    if (!clothingItems || clothingItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No clothing items found. Please upload some items to your wardrobe first.' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare clothing data for AI
    const clothingData = clothingItems.map(item => ({
      name: item.name,
      category: item.category,
      color: item.color,
      tags: item.tags || []
    }));

    // Call OpenAI for outfit suggestions
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are a professional fashion stylist. Based on the following wardrobe items and occasion, suggest a complete outfit combination.

Occasion: ${occasion}
Weather: ${weather}

Available clothing items:
${JSON.stringify(clothingData, null, 2)}

Please provide:
1. A complete outfit combination (specify exact items from the wardrobe)
2. Brief reasoning for why this combination works
3. Any styling tips

Format your response as JSON:
{
  "outfit": {
    "top": "item name or null",
    "bottom": "item name or null", 
    "dress": "item name or null",
    "shoes": "item name or null",
    "accessories": ["accessory names"]
  },
  "reasoning": "Brief explanation of why this combination works",
  "styling_tips": "Additional styling advice"
}`;

    console.log('Calling OpenAI with prompt for occasion:', occasion);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional fashion stylist. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', await openAIResponse.text());
      throw new Error('Failed to get AI recommendation');
    }

    const aiData = await openAIResponse.json();
    console.log('OpenAI response received');

    let aiSuggestion;
    try {
      aiSuggestion = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      throw new Error('Invalid AI response format');
    }

    // Map outfit items to actual clothing item IDs
    const outfitItems = [];
    const outfit = aiSuggestion.outfit;

    // Find matching items for each category
    for (const [category, itemName] of Object.entries(outfit)) {
      if (itemName && itemName !== "null") {
        if (category === 'accessories' && Array.isArray(itemName)) {
          // Handle accessories array
          for (const accessoryName of itemName) {
            const matchingItem = clothingItems.find(item => 
              item.category === 'accessories' && 
              item.name.toLowerCase().includes(accessoryName.toLowerCase())
            );
            if (matchingItem) outfitItems.push(matchingItem);
          }
        } else {
          // Handle single items
          const matchingItem = clothingItems.find(item => 
            item.category === category && 
            item.name.toLowerCase().includes(itemName.toLowerCase())
          );
          if (matchingItem) outfitItems.push(matchingItem);
        }
      }
    }

    // Save suggestion to database
    const { data: savedSuggestion, error: saveError } = await supabase
      .from('outfit_suggestions')
      .insert({
        user_id: user.id,
        occasion,
        suggested_items: outfitItems,
        ai_reasoning: aiSuggestion.reasoning + '\n\nStyling Tips: ' + aiSuggestion.styling_tips
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving suggestion:', saveError);
    }

    console.log('Outfit suggestion generated successfully');

    return new Response(
      JSON.stringify({
        outfit: outfitItems,
        reasoning: aiSuggestion.reasoning,
        styling_tips: aiSuggestion.styling_tips,
        suggestion_id: savedSuggestion?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in outfit-recommendations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});