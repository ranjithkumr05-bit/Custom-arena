# Subcategory photography — outstanding

42 of 51 subcategories are currently showing a shared fallback image
(either the parent category hero or a close sibling). They are flagged with
`"imagePending": true` in `content/categories.json`.

Each one works and looks correct today — the fallback is a real, on-palette
photograph, not a placeholder box. But bespoke art will convert better.

| Category | Subcategory | Currently using |
|---|---|---|
| Corporate & Office Apparel | Executive & Management Apparel | `/categories/sub/corporate-polo.jpg` |
| Corporate & Office Apparel | Employee & Staff Apparel | `/categories/sub/corporate-tee.jpg` |
| Corporate & Office Apparel | Corporate Event Apparel | `/categories/corporate-office.jpg` |
| Corporate & Office Apparel | Branded Office Apparel | `/categories/corporate-office.jpg` |
| School & College T-Shirts | School Polo T-Shirts | `/categories/school-college.jpg` |
| School & College T-Shirts | School House T-Shirts | `/categories/school-college.jpg` |
| School & College T-Shirts | School Sports T-Shirts | `/categories/sub/training-tee.jpg` |
| School & College T-Shirts | School Activity T-Shirts | `/categories/school-college.jpg` |
| School & College T-Shirts | College Department T-Shirts | `/categories/school-college.jpg` |
| School & College T-Shirts | College Event T-Shirts | `/categories/school-college.jpg` |
| School & College T-Shirts | College Team T-Shirts | `/categories/sub/volleyball-jersey.jpg` |
| Workwear & Staff Apparel | Construction & Civil Work | `/categories/workwear.jpg` |
| Workwear & Staff Apparel | Mechanics & Workshop | `/categories/sub/industrial-factory.jpg` |
| Workwear & Staff Apparel | Maintenance & Technician | `/categories/workwear.jpg` |
| Workwear & Staff Apparel | Housekeeping Staff | `/categories/sub/hospitality-staff.jpg` |
| Workwear & Staff Apparel | General Staff & Service | `/categories/workwear.jpg` |
| Retail & Store Apparel | Retail Store Apparel | `/categories/retail-store.jpg` |
| Retail & Store Apparel | Supermarket Staff | `/categories/retail-store.jpg` |
| Retail & Store Apparel | Showroom Staff | `/categories/sub/corporate-polo.jpg` |
| Retail & Store Apparel | Shopping Mall Staff | `/categories/retail-store.jpg` |
| Retail & Store Apparel | Sales & Promotion | `/categories/sub/corporate-tee.jpg` |
| Retail & Store Apparel | Customer Service | `/categories/sub/corporate-polo.jpg` |
| Retail & Store Apparel | Custom-Branded Store Apparel | `/categories/retail-store.jpg` |
| Hoodies & Sweatshirts | Pullover Hoodies | `/categories/hoodies-sweatshirts.jpg` |
| Hoodies & Sweatshirts | Zip-Up Hoodies | `/categories/hoodies-sweatshirts.jpg` |
| Hoodies & Sweatshirts | Custom Printed Hoodies | `/categories/hoodies-sweatshirts.jpg` |
| Hoodies & Sweatshirts | Embroidered Hoodies | `/categories/hoodies-sweatshirts.jpg` |
| Hoodies & Sweatshirts | College & Event Hoodies | `/categories/hoodies-sweatshirts.jpg` |
| Hoodies & Sweatshirts | Custom Sweatshirts | `/categories/hoodies-sweatshirts.jpg` |
| Group & Event T-Shirts | Friends & Group T-Shirts | `/categories/group-event.jpg` |
| Group & Event T-Shirts | Birthday & Celebration | `/categories/group-event.jpg` |
| Group & Event T-Shirts | Family Event T-Shirts | `/categories/group-event.jpg` |
| Group & Event T-Shirts | Reunions & Alumni | `/categories/group-event.jpg` |
| Group & Event T-Shirts | Trip & Tour T-Shirts | `/categories/group-event.jpg` |
| Group & Event T-Shirts | Custom Event T-Shirts | `/categories/group-event.jpg` |
| Private Label & Custom Manufacturing | Private-Label T-Shirts | `/categories/private-label.jpg` |
| Private Label & Custom Manufacturing | Custom Polo | `/categories/sub/corporate-polo.jpg` |
| Private Label & Custom Manufacturing | Custom Hoodie & Sweatshirt | `/categories/hoodies-sweatshirts.jpg` |
| Private Label & Custom Manufacturing | Cut & Sew | `/categories/private-label.jpg` |
| Private Label & Custom Manufacturing | Printing & Embroidery | `/categories/private-label.jpg` |
| Private Label & Custom Manufacturing | Labels & Packaging | `/categories/private-label.jpg` |
| Private Label & Custom Manufacturing | Bulk Custom Apparel | `/categories/private-label.jpg` |

## To fill one

1. Add the image to `public/categories/sub/`
2. Point the subcategory's `image` at it in `content/categories.json`
3. Delete its `"imagePending": true` line

The card, detail page, sitemap entry and search index all update automatically.

## Rules for these images

- Navy and gold palette, warm light, real-looking Indian context
- Any brand or institution name on a garment must be **invented**. Never a real
  company, college or club — that reads as a client claim we cannot support.
- Workwear images: plain cotton work t-shirts only. No high-visibility vests,
  no reflective strips, no hard hats, no protective equipment — we do not make those.
- These are illustrative category images. They are never captioned as our
  factory, our team or our completed orders. That is what `/work` is for, and
  those must be real photographs.
