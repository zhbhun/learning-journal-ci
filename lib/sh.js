const shell = require('shelljs');

module.exports = (command, options) => {
  return new Promise((resolve, reject) => {
    shell.exec(
      command,
      {
        silent: true,
        ...options,
        async: true,
        fatal: false,
      },
      (code, stdout, stderr) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr));
        }
      },
    );
  });
};
