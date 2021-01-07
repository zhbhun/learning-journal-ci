const {
  getGitRemoteOriginURL,
  getLastDayCommit,
  getLastDayBeginCommit,
  getLastDayChangelog,
} = require('../lib/git');

test('getGitRemoteOriginURL', async () => {
  const git = await getGitRemoteOriginURL();
  // console.log(git);
  expect(git.length > 0).toBe(true);
});

test('getLastDayCommit', async () => {
  const commits = await getLastDayCommit();
  // console.log(commits);
  expect(commits.length > 0).toBe(true);
});

test('getLastDayBeginCommit', async () => {
  const commits = await getLastDayBeginCommit();
  expect(commits === null || !!commits).toBe(true);
});

test('getLastDayChangelog', async () => {
  const changelog = await getLastDayChangelog();
  console.log(changelog);
  expect(changelog.length > 0).toBe(true);
});
