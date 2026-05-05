// ═══════════════════════════════════════════════════════════════
// NOTIFICACIONES DE TAREAS VENCIDAS
// ═══════════════════════════════════════════════════════════════

window.AnsoNotif = (function() {
  var ENABLED_KEY   = "anso-notif-enabled";
  var TIME_KEY      = "anso-notif-time";
  var LAST_DATE_KEY = "anso-notif-last-fire-date";
  var DEFAULT_TIME  = "09:00";

  var _scheduleTimer = null;

  function isSupported() {
    return typeof window !== "undefined" && "Notification" in window;
  }

  function permission() {
    return isSupported() ? Notification.permission : "unsupported";
  }

  function isEnabled() {
    if (!isSupported()) return false;
    return localStorage.getItem(ENABLED_KEY) === "1" && Notification.permission === "granted";
  }

  function getTime() {
    var t = localStorage.getItem(TIME_KEY);
    return /^\d{2}:\d{2}$/.test(t || "") ? t : DEFAULT_TIME;
  }

  function setTime(hhmm) {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return false;
    localStorage.setItem(TIME_KEY, hhmm);
    _rescheduleNext();
    return true;
  }

  function requestEnable() {
    if (!isSupported()) return Promise.resolve(false);
    var current = Notification.permission;
    var p = current === "default"
      ? Notification.requestPermission()
      : Promise.resolve(current);
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
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function _parseTime(hhmm) {
    var parts = hhmm.split(":");
    return { h: parseInt(parts[0], 10), m: parseInt(parts[1], 10) };
  }

  function _isPastDailyTime() {
    var now = new Date();
    var t = _parseTime(getTime());
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var thresholdMin = t.h * 60 + t.m;
    return nowMin >= thresholdMin;
  }

  function _msUntilNextDailyTime() {
    var now = new Date();
    var t = _parseTime(getTime());
    var next = new Date();
    next.setHours(t.h, t.m, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
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
        if (t.done) return;
        if (!t.dueDate) return;
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
    var today = _todayStr();
    var lastDate = localStorage.getItem(LAST_DATE_KEY);
    if (lastDate === today) return;
    if (!_isPastDailyTime()) return;

    var due = _gatherDueTasks();
    if (due.length > 0) _fireNotifications(due);
    localStorage.setItem(LAST_DATE_KEY, today);
  }

  function _fireNotifications(due) {
    if (due.length === 1) {
      var d = due[0];
      _showNotification(
        d.overdue ? "Tarea vencida" : "Tarea vence hoy",
        "[" + d.projectName + "] " + d.taskText,
        "antask-due-" + d.taskId,
        { projectId: d.projectId, taskId: d.taskId }
      );
      return;
    }
    var overdue = due.filter(function(x) { return x.overdue; }).length;
    var title = due.length + " tareas pendientes";
    var lines = due.slice(0, 5).map(function(x) {
      return (x.overdue ? "⚠ " : "· ") + x.taskText.slice(0, 60);
    });
    if (due.length > 5) lines.push("…y " + (due.length - 5) + " más");
    if (overdue > 0) {
      title = overdue + " vencida" + (overdue === 1 ? "" : "s") +
              " · " + (due.length - overdue) + " hoy";
    }
    _showNotification(title, lines.join("\n"), "antask-daily-" + _todayStr());
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
    var ms = Math.max(1000, Math.min(_msUntilNextDailyTime(), 24 * 60 * 60 * 1000));
    _scheduleTimer = setTimeout(function() {
      _checkAndFire();
      _rescheduleNext();
    }, ms);
  }

  function init() {
    if (!isSupported()) return;
    _checkAndFire();
    _rescheduleNext();
    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) _checkAndFire();
    });
    // Navegación al hacer clic en una notificación (si SW manda mensaje)
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
    getTime:       getTime,
    setTime:       setTime,
    requestEnable: requestEnable,
    disable:       disable,
    fireTest:      fireTest,
  };
})();
