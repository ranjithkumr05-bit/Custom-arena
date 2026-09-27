import type { Metadata } from "next";
import { Jsonld, SectionHead, Wrap } from "@/components/ui";
import { GLOSSARY, GROUPS } from "@/lib/glossary";
import { SITE } from "@/lib/content";
import GlossaryFilter from "@/components/GlossaryFilter";
import NextStep from "@/components/NextStep";

export const metadata: Metadata = {
  title: "Apparel Manufacturing Glossary — 58 Terms Explained",
  description:
    "Plain-English definitions of apparel manufacturing terms: GSM, MOQ, pique, interlock, sublimation, DTF, digitising, PP sample, AQL, colour fastness and more.",
  alternates: { canonical: "/glossary" },
};

/* DefinedTermSet is the schema type answer engines use for glossaries. */
const ld = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "Apparel manufacturing glossary",
  url: `${SITE.url}/glossary`,
  hasDefinedTerm: GLOSSARY.map((t) => ({
    "@type": "DefinedTerm",
    "@id": `${SITE.url}/glossary#${t.slug}`,
    name: t.term,
    description: t.def,
    inDefinedTermSet: `${SITE.url}/glossary`,
  })),
};

export default function GlossaryPage() {
  return (
    <>
      <Jsonld data={ld} />
      <section className="py-14 lg:py-16">
        <Wrap>
          <SectionHead
            as="h1"
          eyebrow={`Glossary · ${GLOSSARY.length} terms`}
            title="The vocabulary, in plain English"
            lead="Manufacturing conversations are full of shorthand. Here is what each term actually means, so a quote or a spec sheet reads clearly the first time."
          />
          <GlossaryFilter terms={GLOSSARY} groups={[...GROUPS]} />
        </Wrap>
      </section>

      <NextStep
        title="Now put the vocabulary to work"
        body="The quote builder asks for exactly these things — construction, branding method, size breakdown. You now know what each one means."
        primary={{ href: "/quote", label: "Build a quote" }}
        secondary={{ href: "/guides", label: "Read the guides" }}
      />
    </>
  );
}
