const length = "3-day";
const destination = "Tokyo";
const audience = "food lovers";
const text =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

// 0
const promptAlphaOriginal =
  "Plan a 3-day trip to Tokyo for food lovers. Avoid touristy spots.";

// 1
const promptBetaOriginal =
  "Give me 5 creative app ideas that use AI for personal productivity.";

// 2
const promptGammaOriginal = `I want you to act as a creative product strategist specializing in AI-powered tools that improve personal productivity.

Please brainstorm 5 original and feasible app ideas that use artificial intelligence to help individuals manage their time, focus better, or optimize daily workflows. Avoid generic ideas like “AI task manager” or “AI note-taker” — instead, think creatively about emerging behaviors, novel UX patterns, and unique value propositions.

For each app idea, include the following:

Name: A catchy and memorable product name.

Core Concept: A concise description (2-3 sentences) of what the app does and the problem it solves.

AI Capabilities: Explain how AI specifically powers the experience — for example, through context understanding, behavioral prediction, personalization, automation, or multimodal inputs (voice, vision, etc.).

Target Users: Describe who would benefit most from the app — e.g., freelancers, students, parents, executives.

Example Use Case: A short, concrete scenario showing how someone would use the app in their daily routine.

Potential Business Model: (Optional) Suggest how this could be monetized — subscription, B2B licensing, in-app purchases, etc.

Your output should read like a mini product concept brief — concise but full of insight and creativity.

The tone should be professional yet imaginative, similar to how a design strategist or startup founder would pitch early-stage product ideas to investors or collaborators.

Aim for freshness and originality — imagine what productivity tools could look like in 2-3 years, not what already exists today.
`;

// 3
const promptAlphaMatching = `Plan a ${length} trip to ${destination} for ${audience}. Avoid touristy spots.`;

// 4
const promptBetaMatching = `I want you to generate me 5 creative app ideas that use AI for ${audience}.`;

// 5
const promptGammaMatching = `I want you to act as a creative product strategist who specializes in AI-powered tools that enhance personal productivity.

Please brainstorm 5 original and practical app ideas that use artificial intelligence to help individuals manage their time, focus better, or optimize their daily routines. Avoid generic ideas like “AI task manager” or “AI note-taker.” Instead, focus on novel interactions, emerging behaviors, and fresh value propositions.

For each app, include:

Name: A catchy, memorable product name.

Core Concept: A concise 2-3 sentence summary describing what the app does and what problem it solves.

AI Capabilities: Explain how AI powers the experience — e.g., through context awareness, prediction, personalization, automation, or multimodal input (voice, image, etc.).

Target Users: Describe who would benefit most — freelancers, students, parents, or executives.

Example Use Case: Give a short, concrete example of how someone might use the app in daily life.

Potential Business Model: (Optional) Suggest a way it could be monetized — subscription, freemium, B2B licensing, etc.

Your output should read like a mini product concept brief — short but full of insight and creativity.

Keep the tone professional yet imaginative, like a design strategist or startup founder pitching early-stage concepts.

Emphasize freshness and originality — ideas that could realistically exist 2-3 years from now, not ones already on the market.`;

// 6
const promptAlphaDistinct =
  "Create a detailed itinerary for a week-long vacation in Paris, focusing on art and culture. Include must-visit museums, historical landmarks, local art galleries, and cultural experiences. Provide recommendations for dining options that offer authentic French cuisine, as well as tips for navigating the city using public transportation. Additionally, suggest some off-the-beaten-path attractions that are less known to tourists but highly valued by locals.";

// 7
const promptBetaDistinct =
  "List 10 innovative uses of blockchain technology in the healthcare industry. For each use case, provide a brief explanation of how blockchain can address specific challenges in healthcare, such as data security, patient privacy, interoperability, and supply chain management. Include examples of existing projects or startups that are leveraging blockchain for healthcare solutions. Additionally, discuss potential barriers to adoption and how they might be overcome.";

// 8
const promptGammaDistinct = `Rewrite this paragraph in a more professional tone:

${text}`;
