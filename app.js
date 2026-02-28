(function() {
  var REMINDER_OFFSETS = [
    { key: '20b', min: -20, title: '提醒', body: '20 分钟后该吃药了' },
    { key: '10b', min: -10, title: '提醒', body: '10 分钟后该吃药了' },
    { key: '0', min: 0, title: '提醒', body: '到点啦，该吃药了' },
    { key: '10a', min: 10, title: '忘记吃药', body: '已过服药时间 10 分钟，请尽快服药' },
    { key: '30a', min: 30, title: '忘记吃药', body: '已过服药时间 30 分钟，请尽快服药' },
    { key: '60a', min: 60, title: '忘记吃药', body: '已过服药时间 1 小时，请尽快服药' }
  ];

  var schedules = [];
  var takens = {};
  var editingIds = null;
  var isRegisterMode = false;

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getAuth() {
    return typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null;
  }
  function getUserId() {
    var auth = getAuth();
    var user = auth ? auth.currentUser : null;
    return user ? user.uid : null;
  }

  function useFirebase() {
    return typeof db !== 'undefined' && db !== null && getUserId();
  }

  async function getSchedules() {
    var uid = getUserId();
    if (!uid || !db) return [];
    var snap = await db.collection('schedules').where('userId', '==', uid).get();
    return snap.docs.map(function(d) {
      var x = d.data();
      return { id: d.id, name: x.name, dosage: x.dosage || '', time: x.time };
    });
  }

  async function getTakens(date) {
    var uid = getUserId();
    if (!uid || !db) return {};
    var snap = await db.collection('takens').where('userId', '==', uid).where('date', '==', date).get();
    var out = {};
    snap.docs.forEach(function(d) {
      var x = d.data();
      out[x.scheduleId] = x.takenAt;
    });
    return out;
  }

  async function postTake(scheduleId, date) {
    var uid = getUserId();
    if (!uid || !db) return;
    var takenAt = new Date().toISOString();
    var docId = uid + '_' + scheduleId + '_' + date;
    await db.collection('takens').doc(docId).set({
      userId: uid,
      scheduleId: scheduleId,
      date: date,
      takenAt: takenAt
    });
  }

  async function deleteTake(scheduleId, date) {
    var uid = getUserId();
    if (!uid || !db) return;
    await db.collection('takens').doc(uid + '_' + scheduleId + '_' + date).delete();
  }

  async function postSchedules(name, dosage, times) {
    var uid = getUserId();
    if (!uid || !db) return;
    for (var i = 0; i < times.length; i++) {
      await db.collection('schedules').add({
        userId: uid,
        name: name,
        dosage: dosage || '',
        time: times[i]
      });
    }
  }

  async function deleteSchedules(ids) {
    var uid = getUserId();
    if (!uid || !db) return;
    var batch = db.batch();
    var takensSnap = await db.collection('takens').where('userId', '==', uid).get();
    takensSnap.docs.forEach(function(d) {
      var data = d.data();
      if (ids.indexOf(data.scheduleId) !== -1) batch.delete(d.ref);
    });
    ids.forEach(function(id) { batch.delete(db.collection('schedules').doc(id)); });
    await batch.commit();
  }

  function reminderKey(scheduleId, date, key) {
    return 'reminder_' + scheduleId + '_' + date + '_' + key;
  }
  function parseTimeHHmm(timeStr) {
    var p = timeStr.split(':').map(Number);
    return (p[0] || 0) * 60 + (p[1] || 0);
  }
  function getScheduledMinutesToday(timeStr) {
    var p = timeStr.split(':').map(Number);
    return (p[0] || 0) * 60 + (p[1] || 0);
  }
  function checkReminders(schedulesList, takensMap, date) {
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();
    var today = date || todayStr();
    schedulesList.forEach(function(s) {
      if (takensMap[s.id]) return;
      var scheduledMin = getScheduledMinutesToday(s.time);
      REMINDER_OFFSETS.forEach(function(r) {
        var targetMin = scheduledMin + r.min;
        if (nowMinutes < targetMin || nowMinutes >= targetMin + 1) return;
        var keyStr = reminderKey(s.id, today, r.key);
        if (sessionStorage.getItem(keyStr)) return;
        sessionStorage.setItem(keyStr, '1');
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(r.title + '：' + s.name, { body: r.body });
        }
      });
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderToday() {
    var date = todayStr();
    document.getElementById('todayDate').textContent = '日期：' + date;
    var list = document.getElementById('scheduleList');
    var empty = document.getElementById('emptyTip');
    var items = schedules.slice().sort(function(a, b) { return parseTimeHHmm(a.time) - parseTimeHHmm(b.time); });
    list.innerHTML = '';
    if (items.length === 0) {
      empty.classList.add('visible');
      return;
    }
    empty.classList.remove('visible');
    items.forEach(function(s) {
      var taken = !!takens[s.id];
      var li = document.createElement('li');
      li.className = 'schedule-item' + (taken ? ' taken' : '');
      li.innerHTML =
        '<span class="time">' + s.time + '</span>' +
        '<span class="name-wrap">' +
          '<span class="name">' + escapeHtml(s.name) + '</span>' +
          (s.dosage ? ' <span class="dosage">' + escapeHtml(s.dosage) + '</span>' : '') +
        '</span>' +
        (taken ? '<span class="taken-badge">已服用</span>' : '') +
        '<button type="button" class="toggle-taken' + (taken ? ' taken' : '') + '" data-id="' + escapeHtml(String(s.id)) + '" aria-label="标记已服用">' +
        (taken ? '✓' : '') + '</button>';
      list.appendChild(li);
    });
    list.querySelectorAll('.toggle-taken').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = btn.getAttribute('data-id');
        if (takens[id]) await deleteTake(id, date);
        else await postTake(id, date);
        takens = await getTakens(date);
        renderToday();
      });
    });
  }

  function groupSchedules() {
    var map = {};
    schedules.forEach(function(s) {
      var k = (s.name || '') + '\0' + (s.dosage || '');
      if (!map[k]) map[k] = [];
      map[k].push(s);
    });
    return Object.values(map);
  }

  function renderMedList() {
    var list = document.getElementById('medList');
    var groups = groupSchedules();
    list.innerHTML = '';
    groups.forEach(function(group) {
      var first = group[0];
      var times = group.map(function(s) { return s.time; }).sort(function(a, b) { return parseTimeHHmm(a) - parseTimeHHmm(b); });
      var ids = group.map(function(s) { return s.id; });
      var li = document.createElement('li');
      li.className = 'med-item';
      li.innerHTML =
        '<div class="info">' +
          '<div class="name-line">' +
            '<span class="name">' + escapeHtml(first.name) + '</span>' +
            (first.dosage ? ' <span class="dosage">' + escapeHtml(first.dosage) + '</span>' : '') +
          '</div>' +
          '<div class="times">' + times.join('、') + '</div>' +
        '</div>' +
        '<div class="actions">' +
          '<button type="button" class="btn-icon edit" data-ids="' + ids.map(function(id) { return escapeHtml(String(id)); }).join(',') + '" aria-label="编辑">✎</button>' +
          '<button type="button" class="btn-icon delete" data-ids="' + ids.map(function(id) { return escapeHtml(String(id)); }).join(',') + '" aria-label="删除">×</button>' +
        '</div>';
      list.appendChild(li);
    });
    list.querySelectorAll('.edit').forEach(function(btn) {
      btn.addEventListener('click', function() {
        openEditModal(btn.getAttribute('data-ids').split(','));
      });
    });
    list.querySelectorAll('.delete').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('确定删除该药物及所有服药时间？')) return;
        await deleteSchedules(btn.getAttribute('data-ids').split(','));
        load();
      });
    });
  }

  function addTimeRow(container, value) {
    var row = document.createElement('div');
    row.className = 'time-row';
    var input = document.createElement('input');
    input.type = 'time';
    input.value = value || '08:00';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'remove-time';
    btn.textContent = '×';
    btn.addEventListener('click', function() { row.remove(); });
    row.appendChild(input);
    row.appendChild(btn);
    container.appendChild(row);
  }

  function openAddModal() {
    editingIds = null;
    document.getElementById('modalTitle').textContent = '添加药物';
    document.getElementById('medId').value = '';
    document.getElementById('medName').value = '';
    document.getElementById('medDosage').value = '';
    var container = document.getElementById('timeInputs');
    container.innerHTML = '';
    addTimeRow(container, '08:00');
    document.getElementById('medModal').showModal();
  }

  function openEditModal(ids) {
    editingIds = ids;
    var group = schedules.filter(function(s) { return ids.indexOf(String(s.id)) !== -1; });
    var first = group[0];
    document.getElementById('modalTitle').textContent = '编辑药物';
    document.getElementById('medId').value = ids[0];
    document.getElementById('medName').value = first.name;
    document.getElementById('medDosage').value = first.dosage || '';
    var container = document.getElementById('timeInputs');
    container.innerHTML = '';
    group.slice().sort(function(a, b) { return parseTimeHHmm(a.time) - parseTimeHHmm(b.time); }).forEach(function(s) {
      addTimeRow(container, s.time);
    });
    document.getElementById('medModal').showModal();
  }

  async function load() {
    schedules = await getSchedules();
    takens = await getTakens(todayStr());
    renderToday();
    renderMedList();
  }

  function showNotifyStatus(text, isSuccess) {
    var el = document.getElementById('notifyStatus');
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    el.className = 'notify-status ' + (isSuccess ? 'notify-ok' : 'notify-warn');
    setTimeout(function() { el.hidden = true; }, 3000);
  }

  function setAuthError(msg) {
    var el = document.getElementById('authError');
    if (el) {
      el.textContent = msg || '';
      el.style.display = msg ? 'block' : 'none';
    }
  }

  function showApp(user) {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appMain').hidden = false;
    document.getElementById('userEmailDisplay').textContent = user ? user.email : '';
    load();
    setInterval(function() {
      checkReminders(schedules, takens, todayStr());
    }, 30 * 1000);
    setTimeout(function() { checkReminders(schedules, takens, todayStr()); }, 500);
  }

  function showLoginScreen() {
    document.getElementById('appMain').hidden = true;
    document.getElementById('authScreen').classList.remove('hidden');
    setAuthError('');
  }

  function switchAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('authTitle').textContent = isRegisterMode ? '注册' : '登录';
    document.getElementById('authDesc').textContent = isRegisterMode
      ? '注册后使用同一账号在任何设备登录，即可同步全部药物信息。'
      : '使用同一账号登录可同步全部药物信息，关闭网页后再次打开将保持登录。';
    document.getElementById('btnAuthSubmit').textContent = isRegisterMode ? '注册' : '登录';
    document.getElementById('btnAuthSwitch').textContent = isRegisterMode ? '已有账号？登录' : '没有账号？注册';
    setAuthError('');
  }

  function initAuth() {
    var auth = getAuth();
    if (!auth) {
      document.getElementById('authScreen').classList.remove('hidden');
      document.getElementById('appMain').hidden = true;
      document.getElementById('authDesc').textContent = '请先配置 Firebase 并启用 Authentication（邮箱/密码登录）。';
      document.getElementById('authForm').style.display = 'none';
      return;
    }

    auth.onAuthStateChanged(function(user) {
      if (user) {
        showApp(user);
      } else {
        showLoginScreen();
        document.getElementById('authForm').style.display = 'block';
      }
    });

    document.getElementById('authForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var email = document.getElementById('authEmail').value.trim();
      var password = document.getElementById('authPassword').value;
      setAuthError('');
      try {
        if (isRegisterMode) {
          await auth.createUserWithEmailAndPassword(email, password);
        } else {
          await auth.signInWithEmailAndPassword(email, password);
        }
      } catch (err) {
        var msg = err.code === 'auth/email-already-in-use' ? '该邮箱已注册，请直接登录' :
          err.code === 'auth/invalid-email' ? '请输入有效邮箱' :
          err.code === 'auth/weak-password' ? '密码至少 6 位' :
          err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' ? '邮箱或密码错误' :
          err.message || '登录失败';
        setAuthError(msg);
      }
    });

    document.getElementById('btnAuthSwitch').onclick = switchAuthMode;
    document.getElementById('btnLogout').onclick = function() {
      auth.signOut();
    };
  }

  document.getElementById('btnAddMed').addEventListener('click', openAddModal);
  document.getElementById('btnAddTime').addEventListener('click', function() {
    addTimeRow(document.getElementById('timeInputs'), '12:00');
  });
  document.getElementById('btnCancel').addEventListener('click', function() {
    document.getElementById('medModal').close();
  });
  document.getElementById('medForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('medName').value.trim();
    var dosage = document.getElementById('medDosage').value.trim();
    var timeInputs = document.getElementById('timeInputs').querySelectorAll('input[type="time"]');
    var times = Array.from(timeInputs).map(function(i) { return i.value; }).filter(Boolean);
    if (!times.length) {
      alert('请至少添加一个服药时间');
      return;
    }
    if (editingIds && editingIds.length) await deleteSchedules(editingIds);
    await postSchedules(name, dosage, times);
    document.getElementById('medModal').close();
    load();
  });

  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    document.getElementById('btnNotify').hidden = false;
    document.getElementById('btnNotify').onclick = async function() {
      var result = await Notification.requestPermission();
      document.getElementById('btnNotify').hidden = true;
      if (result === 'granted') {
        showNotifyStatus('已开启提醒通知，到点会收到推送', true);
      } else {
        showNotifyStatus('您已拒绝通知，到点将无法收到系统提醒', false);
        document.getElementById('btnNotify').hidden = false;
      }
    };
  } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    document.getElementById('btnNotify').hidden = true;
  }

  initAuth();
})();
