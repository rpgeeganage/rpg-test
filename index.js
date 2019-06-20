const Mocha = require('mocha');
const fs = require('fs');

const { EventEmitter } = require('events');

const ev = new EventEmitter();

let mocha;

ev.on('added', (fc) => {
  dumpTmpFile(fc);
});

function describe() {
  const mainFile = fs.readFileSync(require.main.filename);
  const modifiedFile = mainFile
    .toString()
    .replace(/(const|let) describe\s.*/, '');

  const modifiedFileContent = `
  const { describe, before, it } = require('mocha');
  ${modifiedFile}
  `;

  ev.emit('added', { modifiedFileContent });
}

function dumpTmpFile({ modifiedFileContent }) {
  mocha.suite.addTest(eval(modifiedFileContent));
  mocha.run((failures) => {
    console.log(failures);
  });
}
module.exports = {
  install: function install() {
    mocha = new Mocha({
      ui: 'bdd',
      reporter: 'spec',
      timeout: 25000
    });

    return describe;
  }
};
