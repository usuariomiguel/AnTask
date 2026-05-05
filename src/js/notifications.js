// ═══════════════════════════════════════════════════════════════
// NOTIFICACIONES DE TAREAS VENCIDAS (varios recordatorios al día)
// ═══════════════════════════════════════════════════════════════

window.AnsoNotif = (function() {
  var ENABLED_KEY    = "anso-notif-enabled";
  var TIMES_KEY      = "anso-notif-times";       // JSON array ["HH:MM", ...]
  var FIRED_KEY      = "anso-notif-fired";       // JSON { date, times: ["HH:MM"] }
  var LEGACY_TIME    = "anso-notif-time";        // single HH:MM (compat)
  var LEGACY_LAST    = "anso-notif-last-fire-date";
  var DEFAULT_TIMES  = ["09:00"];

  var _scheduleTimer = null;

  function isSupported() { return typeof window !== "undefined" && "Notification" in window; }
  function permission()  { return isSupported() ? Notification.permission : "unsupported"; }
  function isEnabled()   {
    if (!isSupported()) return false;
    return localStorage.getItem(ENABLED_KEY) === "1" && Notification.permission === "granted";
  }

  function _validTime(t)  { return /^\d{2}:\d{2}$/.test(t || ""); }
  function _normalize(arr) {
    var seen = {}, out = [];
    (arr || []).forEach(function(t) {
      if (_validTime(t) && !seen[t]) { seen[t] = true; out.push(t); }
    });
    out.sort();
    return out;
  }

  function getTimes() {
    var raw = localStorage.getItem(TIMES_KEY);
    if (raw) {
      try {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          var norm = _normalize(arr);
          if (norm.length) return norm;
        }
      } catch (e) {}
    }
    var legacy = localStorage.getItem(LEGACY_TIME);
    if (_validTime(legacy)) return [legacy];
    return DEFAULT_TIMES.slice();
  }

  function setTimes(arr) {
    var norm = _normalize(arr);
    if (!norm.length) return false;
    localStorage.setItem(TIMES_KEY, JSON.stringify(norm));
    _rescheduleNext();
    return true;
  }

  function addTime(hhmm)    {
    if (!_validTime(hhmm)) return false;
    var cur = getTimes();
    if (cur.indexOf(hhmm) !== -1) return false;
    cur.push(hhmm);
    return setTimes(cur);
  }

  function removeTime(hhmm) {
    var cur = getTimes().filter(function(t) { return t !== hhmm; });
    if (!cur.length) return false; // no permitir lista vacía
    return setTimes(cur);
  }

  function requestEnable() {
    if (!isSupported()) return Promise.resolve(false);
    var current = Notification.permission;
    var p = current === "default" ? Notification.requestPermission() : Promise.resolve(current);
    return p.then(function(perm) {
      if (perm !== "granted") {
        localStorage.setItem(ENABLED_KEY, "0");
        return false;
      }
      localStorage.setItem(ENABLED_KEY, "1");
      _checkAndFire();
      _rescheduleNext();
      return true;
    });
  }

  function disable() {
    localStorage.setItem(ENABLED_KEY, "0");
    if (_scheduleTimer) { clearTimeout(_scheduleTimer); _scheduleTimer = null; }
  }

  function fireTest() {
    if (!isEnabled()) return false;
    _showNotification(
      "antask · prueba",
      "Las notificaciones están funcionando correctamente.",
      "antask-test-" + Date.now()
    );
    return true;
  }

  // ─── Internas ───────────────────────────────────────────────

  function _todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function _parseTime(hhmm) {
    var p = hhmm.split(":");
    return { h: parseInt(p[0], 10), m: parseInt(p[1], 10) };
  }

  function _nowMin() {
    var n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }

  function _firedToday() {
    var raw = localStorage.getItem(FIRED_KEY);
    if (!raw) return [];
    try {
      var obj = JSON.parse(raw);
      if (obj && obj.date === _todayStr() && Array.isArray(obj.times)) return obj.times;
    } catch (e) {}
    return [];
  }

  function _markFired(hhmm) {
    var fired = _firedToday();
    if (fired.indexOf(hhmm) === -1) fired.push(hhmm);
    localStorage.setItem(FIRED_KEY, JSON.stringify({ date: _todayStr(), times: fired }));
  }

  function _pendingTimes() {
    var fired = _firedToday();
    var now   = _nowMin();
    return getTimes().filter(function(t) {
      if (fired.indexOf(t) !== -1) return false;
      var pt = _parseTime(t);
      return (pt.h * 60 + pt.m) <= now;
    });
  }

  function _msUntilNextTime() {
    var times = getTimes();
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var nextToday = null;
    times.forEach(function(t) {
      var pt = _parseTime(t);
      var min = pt.h * 60 + pt.m;
      if (min > nowMin && (nextToday === null || min < nextToday)) nextToday = min;
    });
    if (nextToday !== null) {
      var d = new Date();
      d.setHours(0, nextToday, 0, 0);
      return d.getTime() - now.getTime();
    }
    // primera hora de mañana
    var first = _parseTime(times[0]);
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(first.h, first.m, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }

  function _gatherDueTasks() {
    var raw = localStorage.getItem("anso-projects");
    if (!raw) return [];
    var projects;
    try { projects = JSON.parse(raw); } catch (e) { return []; }
    if (!Array.isArray(projects)) return [];
    var today = _todayStr();
    var due = [];
    projects.forEach(function(p) {
      if (!Array.isArray(p.tasks)) return;
      p.tasks.forEach(function(t) {
        if (t.done || !t.dueDate) return;
        if (t.dueDate <= today) {
          due.push({
            projectId:   p.id,
            projectName: p.name || "Sin nombre",
            taskId:      t.id,
            taskText:    t.text,
            dueDate:     t.dueDate,
            overdue:     t.dueDate < today,
          });
        }
      });
    });
    return due;
  }

  function _checkAndFire() {
    if (!isEnabled()) return;
    var pending = _pendingTimes();
    if (!pending.length) return;
    var due = _gatherDueTasks();
    pending.forEach(function(time) {
      if (due.length > 0) _fireNotificationsAt(due, time);
      _markFired(time);
    });
  }

  function _fireNotificationsAt(due, time) {
    var dateTag = _todayStr() + "-" + time;
    if (due.length === 1) {
      var d = due[0];
      _showNotification(
        d.overdue ? "Tarea vencida" : "Tarea vence hoy",
        "[" + d.projectName + "] " + d.taskText,
        "antask-due-" + d.taskId + "-" + dateTag,
        { projectId: d.projectId, taskId: d.taskId }
      );
      return;
    }
    var overdue = due.filter(function(x) { return x.overdue; }).length;
    var title   = due.length + " tareas pendientes";
    var lines   = due.slice(0, 5).map(function(x) {
      return (x.overdue ? "⚠ " : "· ") + x.taskText.slice(0, 60);
    });
    if (due.length > 5) lines.push("…y " + (due.length - 5) + " más");
    if (overdue > 0) {
      title = overdue + " vencida" + (overdue === 1 ? "" : "s") +
              " · " + (due.length - overdue) + " hoy";
    }
    _showNotification(title, lines.join("\n"), "antask-daily-" + dateTag);
  }

  function _showNotification(title, body, tag, data) {
    if (!isSupported() || Notification.permission !== "granted") return;
    var options = {
      body: body,
      tag: tag,
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      renotify: false,
      requireInteraction: false,
      data: data || {},
    };
    if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function(reg) {
        reg.showNotification(title, options);
      }).catch(function() {
        try { new Notification(title, options); } catch (e) {}
      });
    } else {
      try { new Notification(title, options); } catch (e) {}
    }
  }

  function _rescheduleNext() {
    if (_scheduleTimer) { clearTimeout(_scheduleTimer); _scheduleTimer = null; }
    if (!isEnabled()) return;
    var ms = Math.max(1000, Math.min(_msUntilNextTime(), 24 * 60 * 60 * 1000));
    _scheduleTimer = setTimeout(function() {
      _checkAndFire();
      _rescheduleNext();
    }, ms);
  }

  function init() {
    if (!isSupported()) return;
    // Limpieza migración legacy
    if (localStorage.getItem(LEGACY_LAST)) localStorage.removeItem(LEGACY_LAST);
    _checkAndFire();
    _rescheduleNext();
    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) _checkAndFire();
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", function(event) {
        if (!event.data || event.data.type !== "antask-notif-click") return;
        var data = event.data.data || {};
        if (data.projectId && window.location) {
          var url = new URL(window.location.href);
          url.searchParams.set("project", data.projectId);
          if (data.taskId) url.searchParams.set("task", data.taskId);
          window.history.replaceState(null, "", url.toString());
          if (typeof window.activateProject === "function") {
            window.activateProject(data.projectId);
            if (data.taskId && typeof window.navigateToTask === "function") {
              setTimeout(function() { window.navigateToTask(data.projectId, data.taskId); }, 100);
            }
          } else {
            window.location.reload();
          }
        }
      });
    }
  }

  return {
    init:          init,
    isSupported:   isSupported,
    permission:    permission,
    isEnabled:     isEnabled,
    getTimes:      getTimes,
    setTimes:      setTimes,
    addTime:       addTime,
    removeTime:    removeTime,
    requestEnable: requestEnable,
    disable:       disable,
    fireTest:      fireTest,
  };
})();
