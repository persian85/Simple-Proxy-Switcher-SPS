let activeProxy = null;

// تابعی برای خواندن آخرین وضعیت پروکسی از استوریج و بروزرسانی آیکون
function updateBadgeAndState() {
  browser.storage.local.get(['profiles', 'activeProfileIndex']).then((data) => {
    const profiles = data.profiles || [];
    const index = data.activeProfileIndex;

    if (index !== null && index !== undefined && index !== "direct" && profiles[index]) {
      activeProxy = profiles[index];
      browser.action.setBadgeBackgroundColor({ color: "#4CAF50" });
      browser.action.setBadgeText({ text: "ON" });
      browser.action.setTitle({ title: `Proxy Active\nSOCKS5: ${activeProxy.host}:${activeProxy.port}` });
    } else {
      activeProxy = null;
      browser.action.setBadgeBackgroundColor({ color: "#1E88E5" });
      browser.action.setBadgeText({ text: "DIR" });
      browser.action.setTitle({ title: "Simple Proxy Switcher\nMode: Direct Connection" });
    }
  });
}

// ۱. فراخوانی اولیه در زمان لود شدن افزونه
updateBadgeAndState();

// ۲. گوش دادن به پیام‌های پاپ‌آپ (زمانی که کاربر دکمه Apply یا Clear را می‌زند)
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  updateBadgeAndState();
  sendResponse({ status: "success" });
  return true;
});

// ۳. هسته اصلی پروکسی در فایرفاکس (جایگزین روش قدیمی PAC)
browser.proxy.onRequest.addListener(
  (requestInfo) => {
    // اگر پروکسی خاموش باشد، ترافیک مستقیم می‌رود
    if (!activeProxy) {
      return { type: "direct" };
    }

    try {
      const url = new URL(requestInfo.url);
      const host = url.hostname;
      const bypassRules = activeProxy.bypassList || [];

      // بررسی دامنه‌ها با لیست Bypass
      for (let rule of bypassRules) {
        let cleanRule = rule.replace(/\*/g, "").trim();
        if (cleanRule && (host.includes(cleanRule) || host === cleanRule)) {
          return { type: "direct" }; // عبور مستقیم برای دامنه‌های مستثنی شده
        }
      }
    } catch (e) {
       // اگر پارس کردن URL با خطا مواجه شد (مثل درخواست‌های سیستمی مرورگر)
       return { type: "direct" };
    }

    // هدایت ترافیک به سرور SOCKS5
    return {
      type: "socks",
      host: activeProxy.host,
      port: parseInt(activeProxy.port, 10),
      proxyDNS: true // ارسال درخواست‌های DNS از داخل پروکسی برای جلوگیری از نشت اطلاعات
    };
  },
  { urls: ["<all_urls>"] }
);
