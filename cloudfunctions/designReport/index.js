const axios = require('axios');
const tcb = require('@cloudbase/node-sdk');

// System Prompt for Frontend Design
const SYSTEM_PROMPT = `
# Frontend Design

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.
The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking
Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.
Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:

1. Production-grade and functional
2. Visually striking and memorable
3. Cohesive with a clear aesthetic point-of-view
4. Meticulously refined in every detail

## Frontend Aesthetics Guidelines
Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

## NEVER
NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

## Implementation
Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.
**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.
Remember: Trae is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

**OUTPUT REQUIREMENT**:
You must output ONLY the raw HTML code (including internal CSS and JS). Do not include any markdown backticks or explanations. The output should be a single valid HTML string that can be rendered directly in a browser.
`;

const app = tcb.init({
  env: tcb.SYMBOL_CURRENT_ENV
});
const db = app.database();
const COLLECTION_NAME = 'design_reports';

exports.main = async (event, context) => {
  const { reportText, year, week, checkOnly } = event;

  if (!reportText) {
    return { error: 'Missing reportText' };
  }

  // 1. Check if design already exists in DB
  if (year && week) {
    try {
      const res = await db.collection(COLLECTION_NAME)
        .where({ year, week })
        .limit(1)
        .get();

      if (res.data && res.data.length > 0) {
        console.log(`Found existing design for ${year}-${week}`);
        return {
          success: true,
          html: res.data[0].html,
          fromCache: true
        };
      }
    } catch (dbError) {
      console.warn('Database check failed:', dbError);
      
      // Auto-create collection if missing (Error code usually contains "Collection not found" or similar)
      if (dbError.code === 'DATABASE_COLLECTION_NOT_EXIST' || dbError.message?.includes('Collection not found')) {
        console.log('Collection missing, attempting to create...');
        try {
          await db.createCollection(COLLECTION_NAME);
          console.log('Collection created successfully');
        } catch (createError) {
          console.error('Failed to create collection:', createError);
        }
      }
    }
  }

  // If checkOnly is true, we stop here if nothing was found
  if (checkOnly) {
    return {
      success: false,
      status: 'pending',
      message: 'Result not found in database yet. It may be processing or failed.'
    };
  }

  // Use environment variable for API Key
  const API_KEY = process.env.DEEPSEEK_API_KEY || "sk-307567793d98418f8e0787a052865912"; 
  const API_URL = "https://api.deepseek.com/chat/completions";

  try {
    const response = await axios.post(
      API_URL,
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Please design a creative visualization page for the following report content. Make it visually stunning and unique based on the guidelines. Content: ${reportText}` }
        ],
        stream: false,
        temperature: 1.0 // Reduced from 1.3 for better stability
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        timeout: 180000 // 180s timeout for generation
      }
    );

    const htmlContent = response.data.choices[0].message.content;
    
    // Clean up potential markdown code blocks
    const cleanHtml = htmlContent.replace(/^```html\s*/i, '').replace(/\s*```$/, '');

    // 2. Save result to DB
    if (year && week) {
      console.log(`Attempting to save result for ${year}-${week}...`);
      try {
        await db.collection(COLLECTION_NAME).add({
          year,
          week,
          html: cleanHtml,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Saved design for ${year}-${week}`);
      } catch (saveError) {
        console.error('Failed to save to DB:', saveError);
        
        // Retry creation if it failed due to missing collection (just in case check failed earlier)
        if (saveError.code === 'DATABASE_COLLECTION_NOT_EXIST' || saveError.message?.includes('Collection not found')) {
             try {
               await db.createCollection(COLLECTION_NAME);
               await db.collection(COLLECTION_NAME).add({
                 year, week, html: cleanHtml, createdAt: new Date()
               });
               console.log('Collection created and data saved on retry');
             } catch (retryError) {
               console.error('Final save attempt failed:', retryError);
             }
        }
      }
    }

    return {
      success: true,
      html: cleanHtml,
      fromCache: false
    };

  } catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: 'Failed to generate design',
      details: error.response?.data || error.message
    };
  }
};
