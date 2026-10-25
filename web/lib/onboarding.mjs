import '../public/demo/questionnaire.js';

export function progress(details, profile) {
  let preferences = {};
  try { preferences = JSON.parse(profile?.preferences || '{}'); } catch {}
  const basics = !!details, photo = !!profile?.photo_key;
  const questions = preferences.version === 2 && globalThis.KotonohaQuestionnaire.valid(preferences, profile?.age);
  const diagnosed = !!details?.ai_diagnosed_at, confirmed = !!details?.ai_confirmed;
  const next = !basics ? 'basics' : !photo ? 'photo' : !questions ? 'questions' : !diagnosed ? 'ai' : !confirmed ? 'review' : 'complete';
  return { basics, photo, questions, diagnosed, confirmed, next, complete: next === 'complete' };
}

export async function readProgress(db, userId) {
  const details = await db.prepare('SELECT * FROM account_details WHERE user_id=?').bind(userId).first();
  const profile = await db.prepare('SELECT * FROM profiles WHERE user_id=?').bind(userId).first();
  let diagnosis = null;
  try { if (details?.ai_diagnosed_at) diagnosis = JSON.parse(details.ai_diagnosis); } catch {}
  return { ...progress(details, profile), diagnosis };
}
