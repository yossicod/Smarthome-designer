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

export const RENDER_PROMPT  = `
TASK:
Convert the input 2D floor plan into a photorealistic, top-down 3D architectural render.

STRICT REQUIREMENTS (do not violate):
1) REMOVE ALL TEXT:
Do not render any letters, numbers, labels, dimensions, or annotations. 
Floors must be continuous and clean where text was present.

2) GEOMETRY MUST MATCH:
Walls, rooms, doors, and windows must strictly follow the exact lines and positions in the plan.
Do not shift, resize, or reinterpret structure.

3) TOP-DOWN ONLY:
Use a strict orthographic top-down view.
No perspective tilt.

4) CLEAN, REALISTIC OUTPUT:
Crisp edges, balanced lighting, and realistic materials.
No sketch, cartoon, or hand-drawn styles.

5) NO HALLUCINATED STRUCTURE:
Do not add or remove rooms, walls, doors, or windows.

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
- Scale furniture proportionally to room size
- Keep balanced spacing (avoid overcrowding or emptiness)

--------------------------------------------------

FURNITURE LOGIC:

- Add furniture ONLY where clearly indicated by icons or fixtures
- If a room is empty but clearly identifiable (e.g., bedroom, living room), 
  add minimal, realistic default furniture appropriate to the room type

Examples:
- Bedroom → bed, side tables
- Living room → sofa, table
- Dining → table with chairs
- Kitchen → counters, sink, stove
- Bathroom → toilet, sink, shower/tub

Keep furniture minimal, clean, and realistic.

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