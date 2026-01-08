// shims/dns.js
module.exports = {
  lookup: function (hostname, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    // Mock implementation
    if (callback) callback(null, hostname, 4);
  },

  resolve: function (hostname, rrtype, callback) {
    if (typeof rrtype === 'function') {
      callback = rrtype;
      rrtype = 'A';
    }
    if (callback) callback(null, [hostname]);
  },

  resolve4: function (hostname, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (callback) callback(null, [hostname]);
  },

  resolve6: function (hostname, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (callback) callback(null, [hostname]);
  },

  resolveMx: function (hostname, callback) {
    if (callback) callback(null, [{priority: 1, exchange: hostname}]);
  },

  resolveTxt: function (hostname, callback) {
    if (callback) callback(null, [[]]);
  },

  resolveSrv: function (hostname, callback) {
    if (callback) callback(null, []);
  },

  resolveNs: function (hostname, callback) {
    if (callback) callback(null, [hostname]);
  },

  resolveCname: function (hostname, callback) {
    if (callback) callback(null, [hostname]);
  },

  reverse: function (ip, callback) {
    if (callback) callback(null, [ip]);
  },

  setServers: function (servers) {},

  getServers: function () {
    return [];
  },

  // DNS error codes
  NOTFOUND: 'ENOTFOUND',
  NODATA: 'ENODATA',
  FORMERR: 'EFORMERR',
  SERVFAIL: 'ESERVFAIL',
  REFUSED: 'EREFUSED',
  BADQUERY: 'EBADQUERY',
  BADNAME: 'EBADNAME',
  BADFAMILY: 'EBADFAMILY',
  BADRESP: 'EBADRESP',
  CONNREFUSED: 'ECONNREFUSED',
  TIMEOUT: 'ETIMEOUT',
  EOF: 'EOF',
  FILE: 'EFILE',
  NOMEM: 'ENOMEM',
  DESTRUCTION: 'EDESTRUCTION',
  BADSTR: 'EBADSTR',
  BADFLAGS: 'EBADFLAGS',
  NONAME: 'ENONAME',
  BADHINTS: 'EBADHINTS',
  NOTINITIALIZED: 'ENOTINITIALIZED',
  LOADIPHLPAPI: 'ELOADIPHLPAPI',
  ADDRGETNETWORKPARAMS: 'EADDRGETNETWORKPARAMS',
  CANCELLED: 'ECANCELLED',
};
