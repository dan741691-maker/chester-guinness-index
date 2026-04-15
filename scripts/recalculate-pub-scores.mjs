/**
 * Immediately recalculates every pub's current_score and current_rating_tier
 * from the actual reviews table. Run this after applying migration 004 to fix
 * any scores left stale by the missing DELETE trigger.
 *
 * Usage:
 *   node scripts/recalculate-pub-scores.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function scoreTier(score) {
  if (score >= 46) return 'Legendary';
  if (score >= 41) return 'Elite';
  if (score >= 36) return 'Strong';
  if (score >= 31) return 'Decent';
  if (score >= 21) return 'Weak';
  return 'Avoid';
}

async function main() {
  console.log('Fetching all pubs...');
  const { data: pubs, error: pubsError } = await supabase
    .from('pubs')
    .select('id, name, current_score, current_rating_tier');

  if (pubsError) {
    console.error('Failed to fetch pubs:', pubsError.message);
    process.exit(1);
  }

  console.log(`Found ${pubs.length} pub(s). Recalculating scores...\n`);

  let updated = 0;
  let unchanged = 0;

  for (const pub of pubs) {
    // Get the most recent official review for this pub
    const { data: latestReview } = await supabase
      .from('reviews')
      .select('total_score')
      .eq('pub_id', pub.id)
      .eq('is_official', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const correctScore = latestReview ? Number(latestReview.total_score) : 0;
    const correctTier = latestReview ? scoreTier(correctScore) : null;

    const scoreChanged = Number(pub.current_score) !== correctScore;
    const tierChanged = pub.current_rating_tier !== correctTier;

    if (scoreChanged || tierChanged) {
      const { error: updateError } = await supabase
        .from('pubs')
        .update({ current_score: correctScore, current_rating_tier: correctTier })
        .eq('id', pub.id);

      if (updateError) {
        console.error(`  ERROR updating "${pub.name}":`, updateError.message);
      } else {
        console.log(`  FIXED  "${pub.name}": ${pub.current_score} → ${correctScore} (${pub.current_rating_tier ?? 'null'} → ${correctTier ?? 'null'})`);
        updated++;
      }
    } else {
      console.log(`  OK     "${pub.name}": ${correctScore} (${correctTier ?? 'null'})`);
      unchanged++;
    }
  }

  console.log(`\nDone. ${updated} pub(s) recalculated, ${unchanged} already correct.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
