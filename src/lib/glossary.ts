/**
 * Apparel manufacturing glossary.
 *
 * Every entry is generic industry knowledge — no business-specific claims.
 * Definitions are written to be quotable in isolation, which is what answer
 * engines actually lift.
 */
export interface Term {
  slug: string;
  term: string;
  group: "Fabric" | "Printing" | "Production" | "Commercial" | "Quality";
  def: string;
  also?: string;
}

export const GLOSSARY: Term[] = [
  // ---------------- Fabric ----------------
  { slug: "gsm", term: "GSM", group: "Fabric", also: "grams per square metre",
    def: "Grams per square metre — how much a fabric weighs for a given area. Higher GSM means a denser, heavier fabric. It measures weight, not quality." },
  { slug: "single-jersey", term: "Single jersey", group: "Fabric",
    def: "The standard lightweight t-shirt knit. Flat on the face, looped on the back, breathable and economical." },
  { slug: "pique", term: "Pique", group: "Fabric",
    def: "A textured knit with a small waffle surface, used for polo shirts. Structured enough to hold a collar and more breathable than a flat jersey." },
  { slug: "interlock", term: "Interlock", group: "Fabric",
    def: "A double-knit construction that is smooth on both faces. Heavier and more stable than single jersey, and the best cotton base for detailed printing." },
  { slug: "rib", term: "Rib knit", group: "Fabric",
    def: "A stretchy vertically ribbed construction that recovers its shape. Used as trim for collars, cuffs and waistbands rather than as body fabric." },
  { slug: "fleece", term: "Fleece", group: "Fabric",
    def: "A heavier knit brushed on the inside for warmth and softness. The standard fabric for hoodies and sweatshirts." },
  { slug: "loop-knit", term: "Loop knit", group: "Fabric", also: "french terry",
    def: "A winter knit with unbrushed loops on the reverse. Lighter than fleece and gives a cleaner surface for printing." },
  { slug: "combed-cotton", term: "Combed cotton", group: "Fabric",
    def: "Cotton whose short fibres and impurities have been combed out before spinning. Produces a smoother, stronger yarn that pills less than carded cotton." },
  { slug: "carded-cotton", term: "Carded cotton", group: "Fabric",
    def: "Cotton cleaned and aligned but not combed. Cheaper than combed cotton, slightly coarser, and more prone to pilling." },
  { slug: "bio-washed", term: "Bio-washed", group: "Fabric",
    def: "An enzyme treatment applied to finished fabric that removes surface fuzz, leaving it softer and less likely to pill." },
  { slug: "compacting", term: "Compacting", group: "Fabric",
    def: "A finishing process that pre-shrinks knitted fabric mechanically, so the finished garment holds its measurements after washing." },
  { slug: "count", term: "Yarn count", group: "Fabric",
    def: "A measure of yarn fineness. In the cotton system a higher count means a finer yarn, which generally produces a smoother, lighter fabric." },
  { slug: "poly-cotton", term: "Poly-cotton", group: "Fabric",
    def: "A blend of polyester and cotton. Cheaper and more crease-resistant than pure cotton, but less breathable and not suitable for true sublimation." },
  { slug: "performance-knit", term: "Performance knit", group: "Fabric", also: "dry fit, moisture wicking",
    def: "A polyester knit engineered to move moisture away from the skin. The required base fabric for sublimation printing." },
  { slug: "lycra", term: "Lycra / elastane", group: "Fabric", also: "spandex",
    def: "An elastic fibre blended in small percentages to give a knit stretch and shape recovery." },
  { slug: "shade-variation", term: "Shade variation", group: "Fabric",
    def: "Colour differences between dye lots of the same specified shade. Checked before cutting, because it cannot be corrected afterwards." },

  // ---------------- Printing ----------------
  { slug: "screen-printing", term: "Screen printing", group: "Printing",
    def: "Ink pushed through a mesh screen onto fabric, with one screen prepared per colour. Most economical for large runs with few flat colours." },
  { slug: "dtf", term: "DTF", group: "Printing", also: "direct to film",
    def: "Direct to film. The design is printed onto a transfer film, powdered with adhesive and heat-pressed onto the garment. No per-colour setup, so it suits small runs." },
  { slug: "dtg", term: "DTG", group: "Printing", also: "direct to garment",
    def: "Direct to garment. Ink is jetted straight into the fabric like an inkjet printer. Gives photographic detail and a soft finish, best on high-cotton fabric." },
  { slug: "sublimation", term: "Sublimation", group: "Printing",
    def: "A process where dye converts to gas under heat and bonds into polyester fibre. The design becomes part of the fabric, so it cannot crack, peel or fade. Cannot print white and does not work on cotton." },
  { slug: "embroidery", term: "Embroidery", group: "Printing",
    def: "Branding sewn into the fabric with thread. The most durable decoration method, but it cannot reproduce gradients or very fine text." },
  { slug: "digitising", term: "Digitising", group: "Printing",
    def: "Converting artwork into a stitch file that an embroidery machine can read. A one-time cost per design." },
  { slug: "stitch-count", term: "Stitch count", group: "Printing",
    def: "The number of stitches in an embroidered design. The primary driver of embroidery cost — more stitches means more machine time." },
  { slug: "plastisol", term: "Plastisol", group: "Printing",
    def: "A PVC-based screen printing ink that sits on top of the fabric. Opaque, durable and vivid, but with a noticeable surface feel." },
  { slug: "water-based-ink", term: "Water-based ink", group: "Printing",
    def: "Screen printing ink that soaks into the fabric rather than sitting on it. Softer to the touch, but less opaque on dark garments." },
  { slug: "discharge", term: "Discharge printing", group: "Printing",
    def: "A technique that removes the garment's dye and replaces it with pigment, giving a very soft print on dark cotton." },
  { slug: "underbase", term: "Underbase", group: "Printing",
    def: "A white layer printed beneath colours on dark fabric so they appear accurate rather than being tinted by the garment." },
  { slug: "placement", term: "Placement", group: "Printing",
    def: "Where a design sits on the garment — left chest, full front, back, sleeve. Each placement is costed separately." },
  { slug: "panel-printing", term: "Panel printing", group: "Printing",
    def: "Printing on cut fabric panels before the garment is assembled, used when a design must run across a seam." },
  { slug: "vector", term: "Vector artwork", group: "Printing", also: "AI, EPS, CDR, SVG",
    def: "Artwork defined by mathematical paths rather than pixels, so it can be scaled to any size without losing sharpness. The preferred format for print and embroidery." },
  { slug: "curing", term: "Curing", group: "Printing",
    def: "Heating a print to its required temperature so the ink bonds permanently. Under-cured prints wash off; this is the single most common print failure." },

  // ---------------- Production ----------------
  { slug: "cutting", term: "Cutting", group: "Production",
    def: "Cutting fabric to pattern pieces following a marker plan derived from the order's size breakdown." },
  { slug: "marker", term: "Marker", group: "Production",
    def: "The layout plan showing how pattern pieces are arranged on fabric to minimise wastage. An efficient marker directly reduces fabric cost." },
  { slug: "consumption", term: "Consumption", group: "Production",
    def: "The amount of fabric a single garment requires, usually stated in kilograms. Varies by product, size and pattern efficiency." },
  { slug: "sampling", term: "Sampling", group: "Production",
    def: "Producing one or a few pieces for approval before bulk. The stage where fit, colour, fabric and branding are confirmed." },
  { slug: "fit-sample", term: "Fit sample", group: "Production",
    def: "A sample made specifically to check measurements and how the garment sits on the body, rather than to check colour or print." },
  { slug: "pp-sample", term: "PP sample", group: "Production", also: "pre-production sample",
    def: "A pre-production sample made using the exact bulk fabric, trims and method. Approving it fixes the specification for the whole run." },
  { slug: "trims", term: "Trims", group: "Production",
    def: "Everything on a garment that is not the main fabric — labels, tags, drawcords, eyelets, zips, thread. Trims frequently have longer lead times than fabric." },
  { slug: "woven-label", term: "Woven label", group: "Production",
    def: "A fabric label woven with a brand name, stitched into the neck or side seam. The standard mark of a private-label garment." },
  { slug: "care-label", term: "Care label", group: "Production",
    def: "A label carrying washing instructions, fibre composition and size. Legally required in most retail markets." },
  { slug: "size-set", term: "Size set", group: "Production",
    def: "One sample in each size, used to verify that measurements grade correctly across the full range." },
  { slug: "grading", term: "Grading", group: "Production",
    def: "Scaling a base pattern up and down to create the other sizes, following a defined increment per measurement." },

  // ---------------- Commercial ----------------
  { slug: "moq", term: "MOQ", group: "Commercial", also: "minimum order quantity",
    def: "Minimum order quantity — the smallest order a manufacturer will accept. Usually stated per style and often per colour, rather than as a combined total." },
  { slug: "rfq", term: "RFQ", group: "Commercial", also: "request for quotation",
    def: "Request for quotation. A structured enquiry giving product, quantity, fabric, branding and delivery requirements so a supplier can price it accurately." },
  { slug: "size-breakdown", term: "Size breakdown", group: "Commercial", also: "size curve, ratio",
    def: "The quantity required in each size. Drives the cutting plan and fabric consumption, which is why quoting from a single total is always approximate." },
  { slug: "lead-time", term: "Lead time", group: "Commercial",
    def: "The period between order confirmation and dispatch. Usually quoted separately for sampling and for bulk production." },
  { slug: "private-label", term: "Private label", group: "Commercial",
    def: "Manufacturing under the buyer's own brand. The garment carries the buyer's labels, tags and packing, with no reference to the producer." },
  { slug: "white-label", term: "White label", group: "Commercial",
    def: "A ready-made product rebranded by the buyer. Distinct from private label, where the product is made to the buyer's own specification." },
  { slug: "job-work", term: "Job work", group: "Commercial",
    def: "Performing one stage of production on material supplied by someone else, such as stitching fabric a buyer has already sourced." },
  { slug: "landed-cost", term: "Landed cost", group: "Commercial",
    def: "The total cost of goods delivered to your location, including the garment rate, packing, freight and taxes — not just the per-piece price." },

  // ---------------- Quality ----------------
  { slug: "shrinkage", term: "Shrinkage", group: "Quality",
    def: "The dimensional change in a garment after washing, stated as a percentage. Controlled by pre-shrinking or compacting the fabric." },
  { slug: "pilling", term: "Pilling", group: "Quality",
    def: "Small balls of fibre forming on the fabric surface with wear. Combed yarn and bio-washing both reduce it." },
  { slug: "colour-fastness", term: "Colour fastness", group: "Quality",
    def: "How well a fabric retains its colour against washing, rubbing, light and perspiration. Tested separately for each." },
  { slug: "gsm-tolerance", term: "GSM tolerance", group: "Quality",
    def: "The accepted variation from a specified fabric weight, commonly around plus or minus five per cent. Knitted fabric cannot be produced to an exact weight." },
  { slug: "measurement-chart", term: "Measurement chart", group: "Quality", also: "spec sheet",
    def: "The table of required garment measurements per size, with tolerances. The document a quality check is performed against." },
  { slug: "aql", term: "AQL", group: "Quality", also: "acceptable quality limit",
    def: "A statistical sampling standard defining how many defects are permitted in an inspected batch. Used where 100% inspection is impractical." },
];

export const GROUPS = ["Fabric", "Printing", "Production", "Commercial", "Quality"] as const;
