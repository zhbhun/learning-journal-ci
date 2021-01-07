const fs = require('fs');
const path = require('path');
const through2 = require('through2');
const log = require('git-log-parser');
const GitUrlParse = require('git-url-parse');
const sh = require('./sh');

function getGitRemoteOriginURL() {
  return sh('git config --get remote.origin.url').then((stdout) => {
    return stdout.trim();
  });
}

function getCommits(config) {
  return new Promise((resolve, reject) => {
    const commits = [];
    const logs = log.parse(config);
    logs.pipe(
      through2.obj((chunk, enc, callback) => {
        commits.push(chunk);
        callback(null);
      })
    );
    logs.on('end', () => {
      resolve(commits);
    });
    logs.on('error', function (error) {
      reject(error);
    });
  });
}

function getCommitsFromCommit(commitHash) {
  return getCommits({
    _: `${commitHash}..HEAD`,
  });
}

function getCurrentCommit() {
  return getCommits({n: 1}).then((commits) => commits[0] || null);
}

async function getSubmoduleChangelog(submodule) {
  process.chdir(submodule);
  const currentCommit = await getCurrentCommit();
  await sh('git checkout master');
  await sh('git pull');
  const commits = await getCommitsFromCommit(currentCommit.commit.long);
  if (commits.length === 0) {
    return '';
  }
  const gitURL = await getGitRemoteOriginURL();
  const gitURLInfo = GitUrlParse(gitURL);
  const changelog = commits
    .slice(0)
    .reverse()
    .map((commit) => {
      return `* ${commit.subject} - [${
        commit.commit.short
      }](https://github.com/${gitURLInfo.owner}/${gitURLInfo.name}/commit/${
        commit.commit.long
      })${
        commit.body ? `\n    ${commit.body.replace(/\n/g, '\n    ')}\n` : ''
      }`;
    })
    .join('\n');
  const title = `### ${gitURLInfo.name}`;
  const firstCommit = commits[0];
  const lastCommit = currentCommit || commits[commits.length - 1];
  let compare = '';
  if (firstCommit === lastCommit) {
    compare = `[${firstCommit.commit.short}](https://github.com/${gitURLInfo.owner}/${gitURLInfo.name}/commit/${firstCommit.commit.long})`;
  } else {
    compare = `[${firstCommit.commit.short}...${lastCommit.commit.short}](https://github.com/${gitURLInfo.owner}/${gitURLInfo.name}/compare/${lastCommit.commit.short}...${firstCommit.commit.short})`;
  }
  return `${title}\n\n${compare}\n\n${changelog}`;
}

function changelog(url) {
  const context = process.cwd();
  const repositoryPath = path.resolve(context, 'source');
  return fs.promises
    .access(repositoryPath)
    .then(() => true)
    .catch(() => false)
    .then((exist) => {
      if (!exist) {
        return sh(`git clone --recurse-submodules ${url} source`);
      }
      return Promise.resolve();
    })
    .then(() => {
      process.chdir(repositoryPath);
      return sh(`git clean -df && git reset`).then(() => {
        return sh('git submodule update --init');
      });
    })
    .then(() => {
      return sh(`git pull`);
    })
    .then(() => {
      return fs.promises.readdir(repositoryPath);
    })
    .then((files) => {
      return Promise.all(
        files.map((file) => {
          return fs.promises
            .access(path.resolve(repositoryPath, file, '.git'))
            .then(() => true)
            .catch(() => false);
        })
      ).then((exists) => {
        return files.filter((file, index) => exists[index]);
      });
    })
    .then((files) => {
      const getSubmodulesChangelog = (files, index) => {
        if (index >= files.length) {
          return Promise.resolve('');
        }
        const file = files[index];
        const submodule = path.resolve(repositoryPath, file);
        return getSubmoduleChangelog(submodule).then((changelog) => {
          return getSubmodulesChangelog(files, index + 1).then(
            (nextChangelog) => {
              return `${changelog ? `${changelog}\n\n---\n\n` : ''}${
                nextChangelog ? `${nextChangelog}` : ''
              }`;
            }
          );
        });
      };
      return getSubmodulesChangelog(files, 0);
    })
    .then((changelog) => {
      process.chdir(context);
      return changelog;
    });
}

module.exports = changelog;
