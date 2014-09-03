define(function (require) {
  var _ = require('lodash');
  var rison = require('utils/rison');
  var location = require('modules').get('kibana/url');

  location.service('kbnUrl', function ($route, $location, $rootScope, globalState) {
    var self = this;
    self.reloading = false;

    self.change = function (url, paramObj, forceReload) {
      if (_.isBoolean(paramObj)) {
        forceReload = paramObj;
        paramObj = undefined;
      }

      url = self.eval(url, paramObj);

      if (url !== $location.url()) {
        $location.url(globalState.writeToUrl(url));
        if (forceReload || !self.matches(url)) {
          self.reload();
        }
      } else if (forceReload) {
        self.reload();
      }
    };

    self.eval = function (url, paramObj) {
      if (!_.isObject(paramObj)) {
        return url;
      }

      return parseUrlPrams(url, paramObj);
    };

    self.matches = function (url) {
      var route = $route.current.$$route;
      if (!route || !route.regexp) return false;
      return route.regexp.test(url);
    };

    $rootScope.$on('$routeUpdate', reloadingComplete);
    $rootScope.$on('$routeChangeStart', reloadingComplete);

    function parseUrlPrams(url, paramObj) {
      return url.replace(/\{([^\}]+)\}/g, function (match, expr) {
        var key = expr.split('|')[0].trim();

        if (_.isUndefined(paramObj[key])) {
          throw new Error('Replacement failed, key not found: ' + key);
        }

        return encodeURIComponent($rootScope.$eval(expr, paramObj));
      });
    }

    self.reload = function () {
      if (!self.reloading) {
        $route.reload();
        self.reloading = true;
      }
    };

    function reloadingComplete() {
      self.reloading = false;
    }
  });
});
