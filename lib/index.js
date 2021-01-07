const {program} = require('commander');
const GitUrlParse = require('git-url-parse');
const packageJSON = require('../package.json');

program.version(packageJSON.version);
program.option('--git <url>', 'git repository');
program.option('--gh-token <token>', 'git access token');

function getGitURL() {
  const gitURLInfo = GitUrlParse(program.git);
  return program.ghToken
    ? `https://${program.ghToken}@github.com/${gitURLInfo.owner}/${gitURLInfo.name}.git`
    : program.git;
}

program.command('changelog').action(() => {
  const getChangelog = require('./changelog');
  getChangelog(getGitURL())
    .then((log) => {
      console.info(log);
    })
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exit(1);
    });
});

program.command('archive').action(() => {
  const archive = require('./archive');
  archive(getGitURL())
    .then((log) => {
      console.info(log);
    })
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exit(1);
    });
});

program.parse(process.argv);
