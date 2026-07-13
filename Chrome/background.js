// تابع کمکی برای اعمال حالت دایرکت
function applyDirectConnection() {
  const config = { mode: "direct" };
  chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
    chrome.action.setBadgeBackgroundColor({ color: "#1E88E5" }, () => {
      chrome.action.setBadgeText({ text: "DIR" });
      // تنظیم متن طول‌تیپ برای حالت دایرکت
      chrome.action.setTitle({ title: "Simple Proxy Switcher\nMode: Direct Connection" });
    });
  });
}

// ۱. رویداد استارت‌آپ: به محض باز شدن مرورگر اجرا می‌شود
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ activeProfileIndex: "direct" }, () => {
    applyDirectConnection();
  });
});

// ۲. مدیریت پیام‌های دریافتی از پاپ‌آپ
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setProxy") {
    const config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: { 
          scheme: "socks5", 
          host: request.host, 
          port: parseInt(request.port) 
        },
        bypassList: request.bypassList
      }
    };
    
    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" }, () => {
        chrome.action.setBadgeText({ text: "ON" });
        // تنظیم نمایش آی‌پی و پورت پروکسی فعال در Tooltip
        chrome.action.setTitle({ title: `Proxy Active\nSOCKS5: ${request.host}:${request.port}` });
      });
    });
  } else if (request.action === "setDirect") {
    applyDirectConnection();
  } else if (request.action === "clearProxy") {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
      chrome.action.setBadgeText({ text: "" });
      // بازگرداندن متن تول‌تیپ به نام پیش‌فرض اکستنشن
      chrome.action.setTitle({ title: "Simple Proxy Switcher\nMode: System Default" });
    });
  }
  
  sendResponse({ status: "success" });
  return true;
});
