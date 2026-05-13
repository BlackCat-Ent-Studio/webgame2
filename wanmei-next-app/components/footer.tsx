export function Footer() {
  const links = [
    { label: "公司介绍", href: "https://www.wanmei.com/zh/intro.html" },
    { label: "招聘信息", href: "https://jobs.games.wanmei.com" },
    { label: "联系我们", href: "https://www.wanmei.com/zh/contact_us.html" },
    { label: "用户协议", href: "http://static.wanmei.com/passport/agreement/003.html" },
    { label: "个人信息保护政策", href: "http://static.wanmei.com/passport/agreement/005.html" },
    { label: "儿童个人信息保护指引", href: "http://static.wanmei.com/passport/agreement/children.html" },
    { label: "Cookie政策", href: "http://static.wanmei.com/passport/agreement/cookie-policy.html" },
    { label: "纠纷处理", href: "https://cs.wanmei.com/" },
    { label: "家长监护", href: "https://www.wanmei.com/jiazhang/" },
  ];

  return (
    <footer className="mt-12 border-t border-white/10 bg-[#0a0c10]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col items-center text-center gap-5">
        <a href="https://games.wanmei.com" className="block">
          <img
            src="/images/common/nav-logo-footer.png"
            alt="Wanmei Vietnam"
            className="h-8 md:h-10 w-auto opacity-90"
          />
        </a>

        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs md:text-sm text-white/70">
          {links.map((l, i) => (
            <li key={l.href} className="flex items-center gap-3">
              <a href={l.href} target="_blank" rel="noreferrer" className="hover:text-white">
                {l.label}
              </a>
              {i < links.length - 1 && <span className="text-white/20">|</span>}
            </li>
          ))}
        </ul>

        <p className="text-[11px] md:text-xs text-white/50 leading-relaxed max-w-3xl">
          《网络文化经营许可证》编号：
          <a href="https://www.wanmei.com/permit/culture.html" target="_blank" rel="noreferrer" className="hover:text-white">
            京网文[2024]0095-007号
          </a>{" "}
          网络视听许可证编号：
          <a href="https://www.wanmei.com/permit/audio.htm" target="_blank" rel="noreferrer" className="hover:text-white">
            0110587
          </a>
          <br />
          京ICP备
          <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" rel="noreferrer" className="hover:text-white">
            15025398号-6
          </a>{" "}
          京公网安备
          <a
            href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010502033859"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            11010502033859号
          </a>
          <br />© 完美世界 版权所有 Perfect World. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
