const Activity = require('../models/Activity');
const ActivityDetail = require('../models/ActivityDetails');
const getActivityStreams = require('./getActivityStream');

let activeProcess = false;

async function enrichActivitiesBatch({
  maxPer15Min = 50,
  batchSize = 10,
  delayBetweenBatches = 3 * 60 * 1000, // 3 minutes
} = {}) {

  console.log('Start enrichActivitiesBatch');
  
  if (activeProcess) {
    return;
  }

  activeProcess = true;

  try {
    const allActivities = await Activity.find({}).sort({ start_date: -1 });
    console.log('allActivities = ',allActivities.length);
    
    // Identifier celles sans ActivityDetail
    const unenriched = [];
    for (const act of allActivities) {
      const exists = await ActivityDetail.exists({ activityId: act.activityId });
      if (!exists) unenriched.push(act);
    }

    console.log(`🔎 ${unenriched.length} activités à enrichir.`);

    let processed = 0;

    async function processNextBatch() {
      if (processed >= maxPer15Min || unenriched.length === 0) {
        console.log(`✅ Terminé : ${processed} enrichies.`);
        activeProcess = false;
        return;
      } else { console.log('processed',processed) }

      const currentBatch = unenriched.splice(0, batchSize);
      for (const act of currentBatch) {
        if (processed >= maxPer15Min) break;

        try {
          const details = await getActivityStreams({
            activityId: act.activityId,
            athleteId: act.athleteId,
          });
          
          if (!details || !details.streams || Object.keys(details.streams).length === 0) {
            console.log(`⚠️ Pas de streams pour ${act.activityId}`);
            continue;
          }

          console.log('await create for ',act.activityId,' ',act.name);
          await ActivityDetail.create({
            activityId: act.activityId,
            athleteId: act.athleteId,
            streams: details.streams,
          });
          console.log(`✅ ${act.activityId} enrichie`);

          
          processed++;
        } catch (err) {
          console.warn(`❌ Erreur pour ${act.activityId}: ${err.message}`);
        }
      }

      // Planifie le prochain batch s’il reste des éléments
      if (processed < maxPer15Min && unenriched.length > 0) {
        console.log(`🕒 Pause de ${delayBetweenBatches / 1000}s avant le prochain batch...`);
        setTimeout(processNextBatch, delayBetweenBatches);
      } else {
        console.log(`🎉 Enrichissement terminé (${processed}/${maxPer15Min})`);
        activeProcess = false;
      }
    }

    processNextBatch();
  } catch (err) {
    console.error('❌ Erreur enrichissement global :', err.message);
    activeProcess = false;
  }
}

module.exports = enrichActivitiesBatch;
