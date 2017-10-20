System.config({
  defaultJSExtensions: true,
  transpiler: "traceur",
  paths: {
    "app/*": "src/*.js",
    "users/*": "src/users/*.js",
    "material-start/*": "src/*.js",
    "github:*": "jspm_packages/github/*",
    "npm:*": "jspm_packages/npm/*"
  },

  map: {
    "angular": "github:angular/bower-angular@1.6.6",
    "angular-animate": "github:angular/bower-angular-animate@1.6.6",
    "angular-aria": "github:angular/bower-angular-aria@1.6.6",
    "angular-material": "github:angular/bower-material@master",
    "angular-material-data-table": "npm:angular-material-data-table@0.10.10",
    "angular-messages": "github:angular/bower-angular-messages@1.6.6",
    "angular-mocks": "github:angular/bower-angular-mocks@1.5.8",
    "angular-moment": "npm:angular-moment@1.0.1",
    "angular-sanitize": "github:angular/bower-angular-sanitize@1.6.6",
    "angular-ui-router": "npm:angular-ui-router@1.0.3",
    "babel": "npm:babel-core@5.8.38",
    "babel-runtime": "npm:babel-runtime@5.8.38",
    "core-js": "npm:core-js@1.2.7",
    "css": "github:systemjs/plugin-css@0.1.35",
    "json": "github:systemjs/plugin-json@0.1.2",
    "lodash": "npm:lodash@4.17.4",
    "moment": "npm:moment@2.18.1",
    "text": "github:systemjs/plugin-text@0.0.4",
    "traceur": "github:jmcriffey/bower-traceur@0.0.93",
    "traceur-runtime": "github:jmcriffey/bower-traceur-runtime@0.0.93",
    "github:angular/bower-angular-animate@1.6.6": {
      "angular": "github:angular/bower-angular@1.6.6"
    },
    "github:angular/bower-angular-aria@1.6.6": {
      "angular": "github:angular/bower-angular@1.6.6"
    },
    "github:angular/bower-angular-messages@1.6.6": {
      "angular": "github:angular/bower-angular@1.6.6"
    },
    "github:angular/bower-angular-sanitize@1.6.6": {
      "angular": "github:angular/bower-angular@1.6.6"
    },
    "github:angular/bower-material@master": {
      "angular": "github:angular/bower-angular@1.6.6",
      "angular-animate": "github:angular/bower-angular-animate@1.6.6",
      "angular-aria": "github:angular/bower-angular-aria@1.6.6",
      "angular-messages": "github:angular/bower-angular-messages@1.6.6",
      "css": "github:systemjs/plugin-css@0.1.35"
    },
    "github:jspm/nodelibs-assert@0.1.0": {
      "assert": "npm:assert@1.4.1"
    },
    "github:jspm/nodelibs-buffer@0.1.1": {
      "buffer": "npm:buffer@5.0.6"
    },
    "github:jspm/nodelibs-path@0.1.0": {
      "path-browserify": "npm:path-browserify@0.0.0"
    },
    "github:jspm/nodelibs-process@0.1.2": {
      "process": "npm:process@0.11.10"
    },
    "github:jspm/nodelibs-util@0.1.0": {
      "util": "npm:util@0.10.3"
    },
    "github:jspm/nodelibs-vm@0.1.0": {
      "vm-browserify": "npm:vm-browserify@0.0.4"
    },
    "npm:@uirouter/core@5.0.3": {
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:angular-material-data-table@0.10.10": {
      "angular": "npm:angular@1.6.4",
      "angular-material": "npm:angular-material@1.1.4",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:angular-material@1.1.4": {
      "angular": "github:angular/bower-angular@1.6.6",
      "angular-animate": "github:angular/bower-angular-animate@1.6.6",
      "angular-aria": "github:angular/bower-angular-aria@1.6.6",
      "angular-messages": "github:angular/bower-angular-messages@1.6.6",
      "css": "github:systemjs/plugin-css@0.1.35"
    },
    "npm:angular-moment@1.0.1": {
      "moment": "npm:moment@2.18.1"
    },
    "npm:angular-ui-router@1.0.3": {
      "@uirouter/core": "npm:@uirouter/core@5.0.3",
      "angular": "npm:angular@1.6.4",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:assert@1.4.1": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "buffer": "github:jspm/nodelibs-buffer@0.1.1",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "util": "npm:util@0.10.3"
    },
    "npm:babel-runtime@5.8.38": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:buffer@5.0.6": {
      "base64-js": "npm:base64-js@1.2.0",
      "ieee754": "npm:ieee754@1.1.8"
    },
    "npm:core-js@1.2.7": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:inherits@2.0.1": {
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:path-browserify@0.0.0": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:process@0.11.10": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "vm": "github:jspm/nodelibs-vm@0.1.0"
    },
    "npm:util@0.10.3": {
      "inherits": "npm:inherits@2.0.1",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:vm-browserify@0.0.4": {
      "indexof": "npm:indexof@0.0.1"
    }
  }
});
