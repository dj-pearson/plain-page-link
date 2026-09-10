/**
 * Fabricated marketing claims must not come back (US-159).
 *
 * This is the third time. US-111 found the signup page saying "2,500+ agents"
 * while the landing page said "5,000+", and an invented ratingValue 4.8 over
 * 523 reviews in the JSON-LD. US-156 found five testimonials with named agents
 * and a "$2.4M closed from Instagram" metric, hardcoded rather than read from
 * the `testimonials` table. US-157 found that same 4.8/523 rating still live on
 * 31 pages from five sources US-111 had missed. US-159 found five *different*
 * invented agent counts — 2,847, 4,200+, 2,000+, 3,000+ and 10,000+ — a
 * "4.9/5 rating", "Used by agents at Keller Williams, Coldwell Banker, RE/MAX",
 * two more fabricated success-story sections, and an email drip quoting
 * invented case studies as "Real results".
 *
 * Each cleanup was thorough and each one missed instances, because the copy
 * lives in a dozen files and nothing compared them. So: a test.
 *
 * THE RULE, from src/config/marketing-claims.ts — a claim goes in the UI only
 * if someone can point at the thing that makes it true. If you are adding a
 * number about customers, results or ratings, the question is not "is this
 * roughly right" but "what query returns it".
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');

/** Files that legitimately contain these shapes. */
const ALLOWED_FILES = [
  // Form inputs asking the visitor about their own situation, and a placeholder
  // showing what to type in a "your brokerage" field — neither is a claim.
  'components/tools/instagram-bio-analyzer/BioAnalyzerForm.tsx',
  'components/tools/instagram-bio-analyzer/EmailCaptureModal.tsx',
  'components/tools/listing-description-generator/EmailCaptureModal.tsx',
  // Describes what the testimonial widget can display, not our rating.
  'pages/features/Testimonials.tsx',
  // Blog FAQ copy about the housing market — "school districts command premium
  // prices (10-20% higher)", "FSBO sells for about 10% higher with an agent".
  // These are claims about real estate, not about AgentBio, and the rules here
  // are for the second kind. Editorial accuracy is a different job with a
  // different check; conflating them would either exempt product claims or ban
  // the blog from citing a figure (US-173).
  'pages/BlogCategory.tsx',
  // This file.
  'marketing-claims.test.ts',
];

interface Finding {
  file: string;
  line: number;
  text: string;
  rule: string;
}

const RULES: { rule: string; pattern: RegExp }[] = [
  {
    rule: 'testimonial attributed to a name, hardcoded rather than from the testimonials table',
    pattern: /(—|–)\s*[A-Z][a-z]+\s+[A-Z]\./,
  },
  {
    rule: 'a customer or user count nobody can produce a query for',
    pattern:
      /\b(Join|Trusted by|Used by|Over)\s+[0-9][0-9,.]*\+?\s*(agents|realtors|users|customers|professionals)/i,
  },
  {
    rule: 'a star rating we did not receive',
    pattern: /\b[0-9](\.[0-9])?\s*\/\s*5\b/,
  },
  {
    rule: 'an outcome metric with no measurement behind it',
    pattern: /\b[0-9][0-9,.]*\+?\s*(closings|in sales)\b|\b[0-9][0-9,.]*\+?\s*leads\/month\b/i,
  },
  {
    rule: 'another company named as a customer',
    pattern: /\b(Keller Williams|Coldwell Banker|RE\/MAX|eXp Realty)\b/,
  },
  // --- US-173 -------------------------------------------------------------
  // The rules above are the shapes US-111, US-156, US-157 and US-159 found.
  // They caught none of the following, which were live the whole time:
  //   "ML-scored leads convert 2x better. Agents save 5+ hours per week.
  //    Close deals 30% faster."          — HeroSection's default description
  //   "3-5x higher conversion rates"     — /vs/later, five times, including
  //                                        the meta description and a FAQPage
  //                                        answer Google renders as a rich result
  //   "Profiles with property listings get 3x more leads"   — dashboard widget
  //   "Video testimonials are 10x more powerful than text"  — /features/testimonials
  //   "73% of agents make the same mistake"                 — email drip
  // A number attached to an outcome is a measurement. If there is no query
  // behind it, it is not a measurement, whatever units it is in.
  {
    rule: 'a performance multiplier with no measurement behind it',
    pattern:
      /\b[0-9]+(?:\.[0-9]+)?(?:\s*[-–]\s*[0-9]+(?:\.[0-9]+)?)?x\s+(more|higher|better|faster|greater|as many)\b/i,
  },
  {
    rule: 'a percentage improvement nobody measured',
    pattern:
      /\b[0-9]+(?:\.[0-9]+)?%\s+(more|higher|better|faster|fewer|less|of agents|of realtors)\b/i,
  },
  {
    rule: 'time saved, stated as if it had been timed',
    pattern: /\b[0-9]+\+?\s*(?:[-–]\s*[0-9]+\s*)?hours?\s+(?:a|per)\s+week\b/i,
  },
  // US-159 removed the names under three quotes on the listing generator and
  // left the quotes. An invented testimonial with the name taken off is not
  // fixed; it reads as real feedback somebody chose not to attribute. And its
  // own attribution rule wanted an em-dash, so the two named testimonials on
  // /features/calendar-booking — "Jessica T., Luxury Agent, Scottsdale AZ" —
  // went untouched, because that markup puts the name in its own <p>.
  {
    rule: 'a testimonial attributed to a first-name-plus-initial, with or without a dash',
    pattern: />\s*[A-Z][a-z]+\s+[A-Z]\.\s*</,
  },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '__snapshots__') continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.includes('.test.')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Which lines of a file are inside a comment.
 *
 * Has to be block-aware, not per-line. Every removal in US-156, US-157 and
 * US-159 left a multi-line note quoting the claim it deleted — that is the
 * point of the note — and the middle lines of a `{/* … *␘/}` block carry no
 * marker of their own. A per-line check flags those quotes as fresh claims and
 * makes the test unfixable without deleting the explanations.
 */
function commentMask(lines: string[]): boolean[] {
  const mask: boolean[] = [];
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const opens = /\{?\/\*/.test(line);
    const closes = /\*\/\}?/.test(line);

    if (inBlock) {
      mask.push(true);
      if (closes) inBlock = false;
      continue;
    }
    if (opens && !closes) {
      inBlock = true;
      mask.push(true);
      continue;
    }
    mask.push(opens || trimmed.startsWith('//') || trimmed.startsWith('*'));
  }

  return mask;
}

function scan(): Finding[] {
  const findings: Finding[] = [];

  for (const file of walk(SRC)) {
    const rel = file
      .slice(SRC.length + 1)
      .split('\\')
      .join('/');
    if (ALLOWED_FILES.some((allowed) => rel.endsWith(allowed))) continue;
    if (rel.includes('SampleDataManager') || rel.includes('sample-data')) continue;

    const lines = readFileSync(file, 'utf8').split('\n');
    const isComment = commentMask(lines);
    lines.forEach((line, index) => {
      if (isComment[index]) return;
      for (const { rule, pattern } of RULES) {
        if (pattern.test(line)) {
          findings.push({ file: rel, line: index + 1, text: line.trim().slice(0, 90), rule });
        }
      }
    });
  }

  return findings;
}

describe('marketing claims', () => {
  it('makes no claim about customers, results or ratings that nothing can substantiate', () => {
    const findings = scan();

    expect(
      findings.map((f) => `${f.file}:${f.line}  ${f.rule}\n      ${f.text}`),
      'A claim goes in the UI only if someone can point at the thing that makes it ' +
        'true. If this is a real, measured number, read it from the source rather than ' +
        'typing it, and add the file to ALLOWED_FILES with the reason. If it is a real ' +
        'testimonial, put it in the testimonials table with consent recorded and render ' +
        'it from there.'
    ).toEqual([]);
  });

  it('is actually able to fail', () => {
    // The scan above is only worth running if it can catch something. These are
    // the exact shapes removed in US-111, US-156, US-157 and US-159.
    const samples = [
      'Join 2,847 agents getting more leads from Instagram',
      '<span>4.9/5 rating</span>',
      '— Sarah M., Beverly Hills',
      'Used by agents at Keller Williams, Coldwell Banker, RE/MAX',
      '<span className="text-primary">15 leads/month</span>',
    ];

    for (const sample of samples) {
      expect(
        RULES.some(({ pattern }) => pattern.test(sample)),
        `no rule catches: ${sample}`
      ).toBe(true);
    }
  });
});
