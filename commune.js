// Generated by CoffeeScript 1.6.3
/*
  * Commune.js
  * Web workers lose their chains
  * 0.2.1
  * Easy, DRY, transparent worker threads for your app
  * Dan Motzenbecker
  * http://oxism.com
  * MIT License
*/


(function() {
  var Commune, communes, makeBlob, root, threadSupport;

  root = this;

  communes = {};

  makeBlob = null;

  Commune = (function() {
    function Commune(fnString) {
      var lastReturnIndex, returnStatement;
      if (fnString.match(/\bthis\b/)) {
        if (typeof console !== "undefined" && console !== null) {
          console.warn('Commune: Referencing `this` within a worker process might not work as expected.\n`this` will refer to the worker itself or an object created within the worker.');
        }
      }
      if ((lastReturnIndex = fnString.lastIndexOf('return')) === -1) {
        throw new Error('Commune: Target function has no return statement.');
      }
      returnStatement = fnString.substr(lastReturnIndex).replace(/return\s+|;|\}$/g, '');
      fnString = (fnString.slice(0, lastReturnIndex) + ("\nself.postMessage(" + returnStatement + ");\n}")).replace(/^function(.+)?\(/, 'function __communeInit(') + 'if (typeof window === \'undefined\') {\n  self.addEventListener(\'message\', function(e) {\n    __communeInit.apply(this, e.data);\n  });\n}';
      this.blobUrl = makeBlob(fnString);
    }

    Commune.prototype.spawnWorker = function(args, cb) {
      var worker;
      worker = new Worker(this.blobUrl);
      worker.addEventListener('message', function(e) {
        cb(e.data);
        return worker.terminate();
      });
      return worker.postMessage(args);
    };

    return Commune;

  })();

  threadSupport = (function() {
    var Blob, URL, e, rawBlob, sliceMethod, testBlob, testString, testUrl, testWorker;
    try {
      testBlob = new root.Blob;
      Blob = root.Blob;
    } catch (_error) {
      e = _error;
      Blob = root.BlobBuilder || root.WebKitBlobBuilder || root.MozBlobBuilder || false;
    }
    URL = root.URL || root.webkitURL || root.mozURL || false;
    if (!(Blob && URL && root.Worker)) {
      return false;
    }
    testString = 'true';
    try {
      if (Blob === root.Blob) {
        testBlob = new Blob([testString]);
        sliceMethod = Blob.prototype.slice || Blob.prototype.webkitSlice || Blob.prototype.mozSlice;
        rawBlob = sliceMethod.call(testBlob);
        makeBlob = function(string) {
          var blob;
          blob = new Blob([string], {
            type: 'application\/javascript'
          });
          return URL.createObjectURL(sliceMethod.call(blob));
        };
      } else {
        testBlob = new Blob;
        testBlob.append(testString);
        rawBlob = testBlob.getBlob();
        makeBlob = function(string) {
          var blob;
          blob = new Blob;
          blob.append(string);
          return URL.createObjectURL(blob.getBlob());
        };
      }
      testUrl = URL.createObjectURL(rawBlob);
      testWorker = new Worker(testUrl);
      testWorker.terminate();
      return true;
    } catch (_error) {
      e = _error;
      if (e.name === 'SECURITY_ERR') {
        if (typeof console !== "undefined" && console !== null) {
          console.warn('Commune: Cannot provision workers when serving' + 'via `file://` protocol. Serve over http(s) to use worker threads.');
        }
      }
      return false;
    }
  })();

  root.commune = function(fn, args, cb) {
    var commune, fnString;
    if (typeof fn !== 'function') {
      throw new Error('Commune: Must pass a function as first argument.');
    }
    if (typeof args === 'function') {
      cb = args;
      args = [];
    }
    if (threadSupport) {
      fnString = fn.toString();
      if (!communes[fnString]) {
        if (typeof cb !== 'function') {
          throw new Error('Commune: Must pass a callback to utilize worker result.');
        }
        commune = communes[fnString] = new Commune(fnString);
      } else {
        commune = communes[fnString];
      }
      return commune.spawnWorker(args, cb);
    } else {
      return cb(fn.apply(this, args));
    }
  };

  root.communify = function(fn, args) {
    if (args) {
      return function(cb) {
        return commune(fn, args, cb);
      };
    } else {
      return function(args, cb) {
        return commune(fn, args, cb);
      };
    }
  };

  root.commune.isThreaded = function() {
    return threadSupport;
  };

  root.commune.disableThreads = function() {
    return threadSupport = false;
  };

  root.commune.enableThreads = function() {
    return threadSupport = true;
  };

}).call(this);

/*
//@ sourceMappingURL=commune.map
*/
