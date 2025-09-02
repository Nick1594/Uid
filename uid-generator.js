(function () {
  function safe(fn) {
    try { return fn(); } catch (e) { return ''; }
  }

  function getPlugins() {
    return safe(function () {
      if (!navigator.plugins) return '';
      var names = [];
      for (var i = 0; i < navigator.plugins.length; i++) {
        var p = navigator.plugins[i];
        names.push((p && p.name ? p.name : '') + '::' + (p && p.description ? p.description : ''));
      }
      return names.join('|');
    });
  }

  function getCanvasFP() {
    return safe(function () {
      var c = document.createElement('canvas');
      c.width = 240; c.height = 60;
      var ctx = c.getContext('2d');
      if (!ctx) return '';
      var g = ctx.createLinearGradient(0, 0, 240, 60);
      g.addColorStop(0.0, '#ff0000');
      g.addColorStop(0.5, '#00ff00');
      g.addColorStop(1.0, '#0000ff');
      ctx.fillStyle = g;
      ctx.textBaseline = 'alphabetic';
      ctx.font = '16px Arial, "Helvetica Neue", Helvetica, sans-serif';
      ctx.rotate(0.02);
      ctx.fillText('fingerprint-canvas-🙂-AaBbYyZz123', 10, 40);
      ctx.rotate(-0.02);
      ctx.strokeStyle = '#123456';
      ctx.beginPath(); ctx.arc(120, 30, 20, 0, Math.PI * 2, true); ctx.stroke();
      ctx.fillStyle = '#654321';
      ctx.fillRect(5, 5, 30, 20);
      var data = ctx.getImageData(0, 0, c.width, c.height).data;
      var out = [];
      for (var i = 0; i < data.length; i += 50) out.push(data[i]);
      return String.fromCharCode.apply(String, out);
    });
  }

  function getWebGLInfo() {
    return safe(function () {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';
      var debug = gl.getExtension('WEBGL_debug_renderer_info');
      var vendor = debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : '';
      var renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : '';
      return [vendor, renderer].join('|');
    });
  }

  function getScreenInfo() {
    return safe(function () {
      var s = window.screen || {};
      var ratio = (window.devicePixelRatio || 1);
      return [
        s.width || '',
        s.height || '',
        s.availWidth || '',
        s.availHeight || '',
        s.colorDepth || '',
        ratio
      ].join('x');
    });
  }

  function getLangs() {
    return safe(function () {
      var langs = [];
      if (navigator.languages && navigator.languages.length) {
        for (var i = 0; i < navigator.languages.length; i++) langs.push(navigator.languages[i]);
      } else if (navigator.language) {
        langs.push(navigator.language);
      } else if (navigator.userLanguage) {
        langs.push(navigator.userLanguage);
      }
      return langs.join(',');
    });
  }

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function toHex32(num) {
    var hex = (num >>> 0).toString(16);
    while (hex.length < 8) hex = '0' + hex;
    return hex;
  }

  function buildFingerprint() {
    var parts = [];
    parts.push(safe(function () { return navigator.userAgent || ''; }));
    parts.push(getLangs());
    parts.push(safe(function () { return navigator.platform || ''; }));
    parts.push(safe(function () { return navigator.doNotTrack || navigator.msDoNotTrack || ''; }));
    parts.push(safe(function () { return (typeof navigator.cookieEnabled !== 'undefined') ? navigator.cookieEnabled : ''; }));
    parts.push(safe(function () { return (navigator.maxTouchPoints || 0); }));
    parts.push(safe(function () { return (navigator.hardwareConcurrency || ''); }));
    parts.push(getScreenInfo());
    parts.push(String((new Date()).getTimezoneOffset() || ''));
    parts.push(getPlugins());
    parts.push(getCanvasFP());
    parts.push(getWebGLInfo());
    parts.push(safe(function () { return !!window.localStorage; }));
    parts.push(safe(function () { return !!window.sessionStorage; }));
    return parts.join('||');
  }

  function generateDeviceUID() {
    var fp = buildFingerprint();
    var h1 = fnv1a(fp);
    var h2 = fnv1a('::salt::' + fp);
    var h3 = fnv1a(fp + '::v2');
    var h4 = fnv1a('prefix-' + fp);
    return [
      toHex32(h1),
      toHex32(h2),
      toHex32(h3),
      toHex32(h4)
    ].join('');
  }

  if (typeof window !== 'undefined') {
    window.generateDeviceUID = generateDeviceUID;
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = generateDeviceUID;
  }
}());

var uid = (typeof generateDeviceUID === 'function') ? generateDeviceUID() : '';
