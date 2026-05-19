export const PUTER_WORKER_URL = import.meta.env.VITE_PUTER_WORKER_URL || "";

// Storage Paths
export const STORAGE_PATHS = {
    ROOT: "roomify",
    SOURCES: "roomify/sources",
    RENDERS: "roomify/renders",
} as const;

// Timing Constants (in milliseconds)
export const SHARE_STATUS_RESET_DELAY_MS = 1500;
export const REDIRECT_DELAY_MS = 600;
export const PROGRESS_INTERVAL_MS = 100;
export const PROGRESS_STEP = 5;

// UI Constants
export const GRID_OVERLAY_SIZE = "60px 60px";
export const GRID_COLOR = "#3B82F6";

// HTTP Status Codes
export const UNAUTHORIZED_STATUSES = [401, 403];

// Image Dimensions
export const IMAGE_RENDER_DIMENSION = 1024;
export const MAX_SOURCE_IMAGE_BYTES = 50 * 1024 * 1024;
export const IMAGE_FETCH_TIMEOUT_MS = 30_000;
export const TRY_AGAIN_COOLDOWN_MS = 4_000;

export const ALLOWED_STYLES = [
    "Modern",
    "Minimal",
    "Scandinavian",
    "Industrial",
    "Classic",
    "Bohemian",
] as const;

export const RENDER_PROMPT = `
TASK:
Convert the input 2D floor plan into a photorealistic, top-down 3D architectural render.

STRICT REQUIREMENTS (do not violate):
1) REMOVE ALL TEXT:
Do not render any letters, numbers, labels, dimensions, or annotations.
Floors must be continuous and clean where text was present.

2) GEOMETRY MUST MATCH — DO NOT DEVIATE FROM THE PLAN:
Walls, rooms, doors, and windows must strictly follow the exact lines and positions in the uploaded plan.
- Do NOT move, shift, resize, break, merge, or remove any wall.
- Do NOT change room count, room shapes, room sizes, or room positions.
- Do NOT add or remove doors, windows, stairs, or structural openings.
- Stairs only where drawn on the plan. Bathrooms/WC/kitchen fixtures only in rooms shown on the plan.
- Treat the uploaded plan as a fixed blueprint: trace it exactly, do not redesign the layout.

3) TOP-DOWN ONLY:
Use a strict orthographic top-down view. No perspective tilt.

4) CLEAN, REALISTIC OUTPUT:
Crisp edges, balanced lighting, and realistic materials.
No sketch, cartoon, or hand-drawn styles.

5) NO HALLUCINATED STRUCTURE:
Do not add or remove rooms, walls, doors, or windows.
Do not invent elements that are not on the plan (extra stairs, extra bathrooms, new partitions).

6) CIRCULATION & ACCESS:
Every enclosed room must connect exactly as drawn on the plan.
- Render every door opening shown on the plan.
- Do not block doorways, door swings, or corridors with furniture.

7) PIXEL-LOCKED LAYOUT:
Keep the same crop, scale, rotation, and framing as the input.
Do not rotate, mirror, stretch, or re-center the floor plan inside the frame.

8) BUILDING FOOTPRINT & SCALE (critical):
- The building must occupy the exact same outer boundary and overall size as in the input — not larger, not smaller.
- Do not extend walls, floors, or roofs beyond the plan's outer perimeter lines.
- Do not render new architecture in blank margin areas around the plan.
- Scale every room and piece of furniture proportionally to the drawn room size on the plan.
- Furniture must fit inside each room; never oversized relative to the room.

--------------------------------------------------

STRUCTURE & DETAILS:

Walls:
- Extrude precisely from the plan lines
- Consistent wall height and thickness

Doors:
- Convert door swing arcs into realistic open doors
- Maintain exact position and orientation

Windows:
- Convert perimeter lines into realistic glass windows
- Keep alignment exact

--------------------------------------------------

LAYOUT RULES:

- Maintain clear walking paths between furniture
- Do not block doors or windows
- Scale furniture proportionally to each room's size on the plan (never enlarge the building or rooms)
- Keep balanced spacing (avoid overcrowding or emptiness)
- All furniture must stay fully inside the room boundaries from the plan

--------------------------------------------------

FURNITURE LOGIC:

- Use room labels on the plan (e.g. bedroom, living, kitchen, bath, dining) to choose appropriate furniture.
- Add furniture where clearly indicated by icons or fixtures on the plan.
- If a room is labeled or clearly identifiable, add minimal realistic furniture for that room type:

Examples:
- Bedroom → bed, side tables
- Living room → sofa, table
- Dining → table with chairs
- Kitchen → counters, sink, stove
- Bathroom → toilet, sink, shower/tub

Keep furniture minimal, clean, and realistic.
Furniture styling may vary, but must never change walls, rooms, or the floor plan layout.

--------------------------------------------------

RENDER QUALITY:

- High-resolution architectural visualization
- Soft shadows and global illumination
- Realistic materials (wood, fabric, tile, glass)
- Clean, professional finish

--------------------------------------------------

CAMERA:

- Strict orthographic top-down view
- Consistent scale and framing across the entire image

--------------------------------------------------

FINAL OUTPUT:

- No text
- No watermark
- No logo
- Clean, realistic, and ready-to-present architectural layout
`.trim();

export const RENDER_NEGATIVE_PROMPT = `
moved walls, broken walls, resized rooms, new rooms, removed rooms, different floor plan layout,
oversized building, enlarged footprint, building larger than plan, extended exterior,
oversized furniture, furniture too large for room,
invented stairs, wrong stairs location, invented bathroom, relocated fixtures,
added doors, removed doors, blocked doorways,
rotated plan, mirrored plan, stretched plan, recentered plan, perspective view,
cartoon, sketch, blueprint text, dimensions, labels, watermark, logo
`.trim();

export const RENDER_VARIATION_PROMPT = `
VARIATION MODE (Try Again):
Generate a NEW interior design variation from the SAME floor plan input image.

REQUIRED CHANGES:
- Use clearly different furniture models, materials, textures, and color palette.
- Change decorative details and styling accents so the result does not look like a duplicate of a previous render.
- Keep the design fresh, realistic, and professionally composed.

MUST STAY IDENTICAL (do not deviate from the uploaded plan):
- Floor plan geometry: walls, rooms, doors, windows, and stairs in the exact same positions.
- Room count, room shapes, and room sizes — no moving, breaking, or resizing walls.
- Same aspect ratio, framing, building footprint, and output dimensions as the input image.
- All rules from the base render task: no text, no watermark, no added or removed structure.
- Furniture must match room labels/types (bedroom stays bedroom, etc.) but may use different styles/colors.

DO NOT:
- Move, break, merge, or remove walls. Do not change the layout.
- Copy the previous furniture/color scheme exactly.
- Shift, resize, or reinterpret architectural structure.
- Change image size, aspect ratio, or camera angle.
`.trim();
