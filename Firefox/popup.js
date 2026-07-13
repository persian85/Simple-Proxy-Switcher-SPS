const saveBtn = document.getElementById('save');
const applyBtn = document.getElementById('apply');
const deleteBtn = document.getElementById('delete');
const clearBtn = document.getElementById('clear');
const list = document.getElementById('profileList');
const formTitle = document.getElementById('formTitle');

let editingIndex = null;

function loadProfiles() {
  chrome.storage.local.get(['profiles', 'activeProfileIndex'], (data) => {
    const profiles = data.profiles || [];
    list.innerHTML = '';

    // ایجاد گزینه ثابت Direct
    let directOpt = document.createElement('option');
    directOpt.value = "direct";
    directOpt.textContent = "➔ Direct Connection (No Proxy)";
    if (data.activeProfileIndex === "direct" || !data.activeProfileIndex) {
      directOpt.selected = true;
    }
    list.appendChild(directOpt);

    // بارگذاری سایر پروفایل‌ها
    profiles.forEach((p, index) => {
      let opt = document.createElement('option');
      opt.value = index;
      opt.textContent = `${p.name} (socks5://${p.host}:${p.port})`;
      if (String(data.activeProfileIndex) === String(index)) {
        opt.selected = true;
      }
      list.appendChild(opt);
    });

    // به روز رسانی فرم بر اساس انتخابِ لیست
    handleListChange();
  });
}

function handleListChange() {
  const val = list.value;
  if (!val || val === "direct") {
    resetForm();
    return;
  }

  const index = parseInt(val);
  chrome.storage.local.get(['profiles'], (data) => {
    const profiles = data.profiles || [];
    const p = profiles[index];
    if (p) {
      document.getElementById('name').value = p.name || '';
      document.getElementById('host').value = p.host || '';
      document.getElementById('port').value = p.port || '';
      document.getElementById('bypass').value = p.bypassList ? p.bypassList.join(', ') : '';
      
      formTitle.innerHTML = "Edit Profile";
      saveBtn.innerHTML = "Update Profile";
      saveBtn.style.backgroundColor = "#FF9800";
      editingIndex = index;
    }
  });
}

function resetForm() {
  document.getElementById('name').value = '';
  document.getElementById('host').value = '';
  document.getElementById('port').value = '';
  document.getElementById('bypass').value = '';
  formTitle.innerHTML = "Add Profile";
  saveBtn.innerHTML = "Save Profile";
  saveBtn.style.backgroundColor = "#4CAF50";
  editingIndex = null;
}

list.addEventListener('change', handleListChange);

saveBtn.addEventListener('click', () => {
  const name = document.getElementById('name').value;
  const host = document.getElementById('host').value;
  const port = document.getElementById('port').value;
  const bypassRaw = document.getElementById('bypass').value;
  
  if (!name || !host || !port) return alert('Please fill Name, Host, and Port fields');

  const bypassList = bypassRaw ? bypassRaw.split(',').map(item => item.trim()).filter(item => item) : [];

  chrome.storage.local.get(['profiles', 'activeProfileIndex'], (data) => {
    let profiles = data.profiles || [];
    
    if (editingIndex !== null) {
      profiles[editingIndex] = { name, host, port, bypassList };
      if (String(data.activeProfileIndex) === String(editingIndex)) {
        chrome.runtime.sendMessage({ action: "setProxy", host, port, bypassList });
      }
    } else {
      profiles.push({ name, host, port, bypassList });
    }

    chrome.storage.local.set({ profiles }, () => {
      loadProfiles();
      resetForm();
    });
  });
});

applyBtn.addEventListener('click', () => {
  if (list.value === '') return;

  if (list.value === "direct") {
    chrome.storage.local.set({ activeProfileIndex: "direct" }, () => {
      chrome.runtime.sendMessage({ action: "setDirect" }, () => window.close());
    });
  } else {
    const index = parseInt(list.value);
    chrome.storage.local.get(['profiles'], (data) => {
      const p = data.profiles[index];
      chrome.storage.local.set({ activeProfileIndex: index }, () => {
        chrome.runtime.sendMessage({ 
          action: "setProxy", 
          host: p.host, 
          port: p.port, 
          bypassList: p.bypassList || [] 
        }, () => window.close());
      });
    });
  }
});

deleteBtn.addEventListener('click', () => {
  if (list.value === '' || list.value === "direct") {
    return alert("You cannot delete the system default Direct profile!");
  }
  
  const index = parseInt(list.value);
  chrome.storage.local.get(['profiles', 'activeProfileIndex'], (data) => {
    let profiles = data.profiles || [];
    profiles.splice(index, 1);
    
    let updateData = { profiles: profiles };
    
    if (String(data.activeProfileIndex) === String(index)) {
      updateData.activeProfileIndex = "direct";
      chrome.runtime.sendMessage({ action: "setDirect" });
    } else if (typeof data.activeProfileIndex === 'number' && data.activeProfileIndex > index) {
      updateData.activeProfileIndex = data.activeProfileIndex - 1;
    }
    
    chrome.storage.local.set(updateData, () => {
      resetForm();
      loadProfiles();
    });
  });
});

clearBtn.addEventListener('click', () => {
  chrome.storage.local.set({ activeProfileIndex: null }, () => {
    chrome.runtime.sendMessage({ action: "clearProxy" }, () => window.close());
  });
});

loadProfiles();
// باز کردن امن لینک گیت‌هاب در تب جدید برای همگام‌سازی کامل کروم و فایرفاکس
document.querySelector('.footer a').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: e.target.href });
});
