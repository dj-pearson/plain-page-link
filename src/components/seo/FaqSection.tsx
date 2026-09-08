/**
 * A visible FAQ, and the FAQPage schema that describes it, from one array
 * (US-157).
 *
 * Six pages were emitting FAQPage markup for eighteen questions that appeared
 * nowhere on the page — /vs/linktree, /vs/beacons, /for-real-estate-agents,
 * /instagram-bio-for-realtors and both free tools. Schema is meant to mark up
 * content that exists; markup describing content a visitor cannot see is a
 * structured-data policy violation and a manual-action risk, and it was
 * invisible to us because nothing compared the two.
 *
 * The fix is structural rather than a one-time correction: a page declares its
 * questions once, `faqPageSchema()` turns them into JSON-LD, and `<FaqSection>`
 * renders the same array. They cannot drift, and `npm run verify:seo` fails the
 * build if a question in the schema is not in the rendered text.
 */

export interface FaqEntry {
  question: string;
  answer: string;
}

/** The FAQPage node for a page's JSON-LD graph. */
export function faqPageSchema(entries: readonly FaqEntry[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

interface FaqSectionProps {
  entries: readonly FaqEntry[];
  heading?: string;
  /** Set when the page already has an <h2> rhythm to match. */
  headingId?: string;
}

export function FaqSection({
  entries,
  heading = 'Common questions',
  headingId = 'faq',
}: FaqSectionProps) {
  if (entries.length === 0) return null;

  return (
    <section className="py-16" aria-labelledby={headingId}>
      <div className="container mx-auto px-4">
        <h2
          id={headingId}
          className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center"
        >
          {heading}
        </h2>

        {/* <details> rather than a JS accordion: the answer text is in the
            document either way, which is the whole point of this component. */}
        <div className="max-w-[68ch] mx-auto space-y-4">
          {entries.map((entry) => (
            <details
              key={entry.question}
              className="rounded-2xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="cursor-pointer list-none font-semibold text-foreground min-h-[44px] flex items-center">
                {entry.question}
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{entry.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
