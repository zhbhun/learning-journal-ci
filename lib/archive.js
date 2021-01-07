const fs = require('fs');
const dayjs = require('dayjs');
const path = require('path');
const weekOfYear = require('dayjs/plugin/weekOfYear');
const weekYear = require('dayjs/plugin/weekYear');
const updateLocale = require('dayjs/plugin/updateLocale');
const changelog = require('./changelog');
const sh = require('./sh');

dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(updateLocale);

dayjs.updateLocale('en', {
  weekStart: 1,
});

function archive(url) {
  return changelog(url).then((logs) => {
    if (logs && logs.length > 0) {
      process.chdir(path.resolve(process.cwd(), 'source'));
      const now = dayjs();
      const weekYear = now.weekYear();
      const week = now.week();
      const weekBegin = now.day(1).format('YYYYMMDD');
      const weekEnd = now.day(7).format('YYYYMMDD');
      const weekLogPath = path.resolve(
        process.cwd(),
        `_/${weekYear}/${week}周-${weekBegin}-${weekEnd}`
      );
      const dayLogPath = `${weekLogPath}/${now.format('YYYYMMDD')}.md`;
      const dayLog = `## ${now.format('YYYYMMDD')}\n\n## CHANGELOG\n\n${logs}`;
      return (
        sh(`mkdir -p ${weekLogPath}`)
          .then(() => {
            return fs.promises.writeFile(dayLogPath, dayLog, {encoding: 'utf-8'});
          })
          .then(() => {
            return sh('git add -A');
          })
          .then(() => {
            return sh(`git commit -m "${now.format('YYYYMMDD')}"`);
          })
          .then(() => {
            return sh(`git push`);
          })
          .then(() => {
            return dayLog;
          })
      );
    }
    return Promise.resolve('no changes');
  });
}

module.exports = archive;
