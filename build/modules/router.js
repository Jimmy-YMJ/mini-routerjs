'use strict';

var routeCompiler = require('./lib/route-compiler');
var urlUtils = require('simple-url');

var regexRouters = [];
var stringRouters = {};
var onMismatch = function onMismatch() {};

module.exports = {
  registerMismatch: function registerMismatch(mismatch) {
    onMismatch = mismatch || onMismatch;
  },
  register: function register(route, callback, strict) {
    var compiled = routeCompiler.compile(route, strict);
    if (compiled.tokens.length === 0) {
      stringRouters[route] = callback;
      if (strict !== true) {
        stringRouters[route.slice(-1) === "/" ? route.slice(0, -1) : route + "/"] = callback;
      }
    } else {
      regexRouters.push([compiled, callback]);
    }
  },
  trigger: function trigger(url, data) {
    var urlObj = urlUtils.parse(url),
        path = urlObj.pathname;
    urlObj.url = url;
    if (stringRouters[path]) {
      stringRouters[path]({ url: urlObj, params: null, data: data });
      return true;
    } else {
      var i = 0,
          len = regexRouters.length,
          router,
          match;
      while (i < len) {
        router = regexRouters[i];
        match = router[0].regex.exec(path);
        if (match !== null) {
          router[1]({ url: urlObj, params: routeCompiler.parsePath(match, router[0].tokens), data: data });
          return true;
        }
        i++;
      }
    }
    onMismatch(url, data);
    return false;
  }
};