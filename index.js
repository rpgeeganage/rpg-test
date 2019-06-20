const { EventEmitter } = require('events');
const fs = require('fs');
const tmp = require('tmp');
const path = require('path');

const Mocha = require('mocha');
const reporter = require('mocha-simple-html-reporter-callback');
const { ValueViewerSymbol } = require('@runkit/value-viewer');

const ev = new EventEmitter();
ev.on('added', (fc) => {
  runMocha(fc);
});

function dfd() {
  const res = {};
  res.promise = new Promise((resolve, reject) => {
    res.resolve = resolve;
    res.reject = reject;
  });
  return res;
}

function describe(title, fn) {
  const modifiedFn = `describe('${title}', ${fn.toString()});`;
  ev.emit('added', { title, modifiedFn, timeOut: this.timeOut });
}

function it(title, fn) {
  const modifiedFn = `it('${title}', ${fn.toString()});`;
  ev.emit('added', { title, modifiedFn, timeOut: this.timeOut });
}

function runMocha({ title, modifiedFn, timeOut }) {
  tmp.file(function(err, pathStr) {
    if (err) {
      throw err;
    }
    const filePath = `${pathStr}.js`;
    fs.writeFileSync(filePath, modifiedFn);

    // Copied from mocha runner
    module.paths.push(process.cwd(), path.resolve('node_modules'));

    const mocha = new Mocha({
      timeout: timeOut || 25000
    });
    const results = dfd();

    mocha.reporter(reporter, { output: results.resolve });
    mocha.addFile(filePath);
    mocha.run();

    fs.unlinkSync(filePath);

    results.promise.then((html) => {
      console.log({
        [ValueViewerSymbol]: { title: title, HTML: html }
      });
    });
  });
}

module.exports = {
  install: function install(timeOut) {
    global.describe = describe.bind({
      timeOut
    });
    global.it = it.bind({
      timeOut
    });
    return {
      describe,
      it
    };
  }
};
