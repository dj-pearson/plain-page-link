;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js'], function (exports, module) {
    'use strict';

    var React, reactExports, ReactDOM;
    return {
      setters: [module => {
        React = module.R;
        reactExports = module.r;
        ReactDOM = module.e;
      }],
      execute: function () {
        exports({
          a: format,
          b: formatDistanceToNow,
          c: clsx,
          d: startOfMonth,
          e: eachDayOfInterval,
          f: formatDistance,
          g: endOfMonth,
          s: subDays
        });
        var jt = n => {
            switch (n) {
              case "success":
                return ee;
              case "info":
                return ae;
              case "warning":
                return oe;
              case "error":
                return se;
              default:
                return null;
            }
          },
          te = Array(12).fill(0),
          Yt = ({
            visible: n,
            className: e
          }) => React.createElement("div", {
            className: ["sonner-loading-wrapper", e].filter(Boolean).join(" "),
            "data-visible": n
          }, React.createElement("div", {
            className: "sonner-spinner"
          }, te.map((t, a) => React.createElement("div", {
            className: "sonner-loading-bar",
            key: `spinner-bar-${a}`
          })))),
          ee = React.createElement("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 20 20",
            fill: "currentColor",
            height: "20",
            width: "20"
          }, React.createElement("path", {
            fillRule: "evenodd",
            d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
            clipRule: "evenodd"
          })),
          oe = React.createElement("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "currentColor",
            height: "20",
            width: "20"
          }, React.createElement("path", {
            fillRule: "evenodd",
            d: "M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z",
            clipRule: "evenodd"
          })),
          ae = React.createElement("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 20 20",
            fill: "currentColor",
            height: "20",
            width: "20"
          }, React.createElement("path", {
            fillRule: "evenodd",
            d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z",
            clipRule: "evenodd"
          })),
          se = React.createElement("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 20 20",
            fill: "currentColor",
            height: "20",
            width: "20"
          }, React.createElement("path", {
            fillRule: "evenodd",
            d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z",
            clipRule: "evenodd"
          })),
          Ot = React.createElement("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            width: "12",
            height: "12",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }, React.createElement("line", {
            x1: "18",
            y1: "6",
            x2: "6",
            y2: "18"
          }), React.createElement("line", {
            x1: "6",
            y1: "6",
            x2: "18",
            y2: "18"
          }));
        var Ft = () => {
          let [n, e] = React.useState(document.hidden);
          return React.useEffect(() => {
            let t = () => {
              e(document.hidden);
            };
            return document.addEventListener("visibilitychange", t), () => window.removeEventListener("visibilitychange", t);
          }, []), n;
        };
        var bt = 1,
          yt = class {
            constructor() {
              this.subscribe = e => (this.subscribers.push(e), () => {
                let t = this.subscribers.indexOf(e);
                this.subscribers.splice(t, 1);
              });
              this.publish = e => {
                this.subscribers.forEach(t => t(e));
              };
              this.addToast = e => {
                this.publish(e), this.toasts = [...this.toasts, e];
              };
              this.create = e => {
                var S;
                let {
                    message: t,
                    ...a
                  } = e,
                  u = typeof (e == null ? void 0 : e.id) == "number" || ((S = e.id) == null ? void 0 : S.length) > 0 ? e.id : bt++,
                  f = this.toasts.find(g => g.id === u),
                  w = e.dismissible === void 0 ? true : e.dismissible;
                return this.dismissedToasts.has(u) && this.dismissedToasts.delete(u), f ? this.toasts = this.toasts.map(g => g.id === u ? (this.publish({
                  ...g,
                  ...e,
                  id: u,
                  title: t
                }), {
                  ...g,
                  ...e,
                  id: u,
                  dismissible: w,
                  title: t
                }) : g) : this.addToast({
                  title: t,
                  ...a,
                  dismissible: w,
                  id: u
                }), u;
              };
              this.dismiss = e => (this.dismissedToasts.add(e), e || this.toasts.forEach(t => {
                this.subscribers.forEach(a => a({
                  id: t.id,
                  dismiss: true
                }));
              }), this.subscribers.forEach(t => t({
                id: e,
                dismiss: true
              })), e);
              this.message = (e, t) => this.create({
                ...t,
                message: e
              });
              this.error = (e, t) => this.create({
                ...t,
                message: e,
                type: "error"
              });
              this.success = (e, t) => this.create({
                ...t,
                type: "success",
                message: e
              });
              this.info = (e, t) => this.create({
                ...t,
                type: "info",
                message: e
              });
              this.warning = (e, t) => this.create({
                ...t,
                type: "warning",
                message: e
              });
              this.loading = (e, t) => this.create({
                ...t,
                type: "loading",
                message: e
              });
              this.promise = (e, t) => {
                if (!t) return;
                let a;
                t.loading !== void 0 && (a = this.create({
                  ...t,
                  promise: e,
                  type: "loading",
                  message: t.loading,
                  description: typeof t.description != "function" ? t.description : void 0
                }));
                let u = e instanceof Promise ? e : e(),
                  f = a !== void 0,
                  w,
                  S = u.then(async i => {
                    if (w = ["resolve", i], React.isValidElement(i)) f = false, this.create({
                      id: a,
                      type: "default",
                      message: i
                    });else if (ie(i) && !i.ok) {
                      f = false;
                      let T = typeof t.error == "function" ? await t.error(`HTTP error! status: ${i.status}`) : t.error,
                        F = typeof t.description == "function" ? await t.description(`HTTP error! status: ${i.status}`) : t.description;
                      this.create({
                        id: a,
                        type: "error",
                        message: T,
                        description: F
                      });
                    } else if (t.success !== void 0) {
                      f = false;
                      let T = typeof t.success == "function" ? await t.success(i) : t.success,
                        F = typeof t.description == "function" ? await t.description(i) : t.description;
                      this.create({
                        id: a,
                        type: "success",
                        message: T,
                        description: F
                      });
                    }
                  }).catch(async i => {
                    if (w = ["reject", i], t.error !== void 0) {
                      f = false;
                      let D = typeof t.error == "function" ? await t.error(i) : t.error,
                        T = typeof t.description == "function" ? await t.description(i) : t.description;
                      this.create({
                        id: a,
                        type: "error",
                        message: D,
                        description: T
                      });
                    }
                  }).finally(() => {
                    var i;
                    f && (this.dismiss(a), a = void 0), (i = t.finally) == null || i.call(t);
                  }),
                  g = () => new Promise((i, D) => S.then(() => w[0] === "reject" ? D(w[1]) : i(w[1])).catch(D));
                return typeof a != "string" && typeof a != "number" ? {
                  unwrap: g
                } : Object.assign(a, {
                  unwrap: g
                });
              };
              this.custom = (e, t) => {
                let a = (t == null ? void 0 : t.id) || bt++;
                return this.create({
                  jsx: e(a),
                  id: a,
                  ...t
                }), a;
              };
              this.getActiveToasts = () => this.toasts.filter(e => !this.dismissedToasts.has(e.id));
              this.subscribers = [], this.toasts = [], this.dismissedToasts = new Set();
            }
          },
          v = new yt(),
          ne = (n, e) => {
            let t = (e == null ? void 0 : e.id) || bt++;
            return v.addToast({
              title: n,
              ...e,
              id: t
            }), t;
          },
          ie = n => n && typeof n == "object" && "ok" in n && typeof n.ok == "boolean" && "status" in n && typeof n.status == "number",
          le = ne,
          ce = () => v.toasts,
          de = () => v.getActiveToasts(),
          ue = exports("u", Object.assign(le, {
            success: v.success,
            info: v.info,
            warning: v.warning,
            error: v.error,
            custom: v.custom,
            message: v.message,
            promise: v.promise,
            dismiss: v.dismiss,
            loading: v.loading
          }, {
            getHistory: ce,
            getToasts: de
          }));
        function wt(n, {
          insertAt: e
        } = {}) {
          if (typeof document == "undefined") return;
          let t = document.head || document.getElementsByTagName("head")[0],
            a = document.createElement("style");
          a.type = "text/css", e === "top" && t.firstChild ? t.insertBefore(a, t.firstChild) : t.appendChild(a), a.styleSheet ? a.styleSheet.cssText = n : a.appendChild(document.createTextNode(n));
        }
        wt(`:where(html[dir="ltr"]),:where([data-sonner-toaster][dir="ltr"]){--toast-icon-margin-start: -3px;--toast-icon-margin-end: 4px;--toast-svg-margin-start: -1px;--toast-svg-margin-end: 0px;--toast-button-margin-start: auto;--toast-button-margin-end: 0;--toast-close-button-start: 0;--toast-close-button-end: unset;--toast-close-button-transform: translate(-35%, -35%)}:where(html[dir="rtl"]),:where([data-sonner-toaster][dir="rtl"]){--toast-icon-margin-start: 4px;--toast-icon-margin-end: -3px;--toast-svg-margin-start: 0px;--toast-svg-margin-end: -1px;--toast-button-margin-start: 0;--toast-button-margin-end: auto;--toast-close-button-start: unset;--toast-close-button-end: 0;--toast-close-button-transform: translate(35%, -35%)}:where([data-sonner-toaster]){position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1: hsl(0, 0%, 99%);--gray2: hsl(0, 0%, 97.3%);--gray3: hsl(0, 0%, 95.1%);--gray4: hsl(0, 0%, 93%);--gray5: hsl(0, 0%, 90.9%);--gray6: hsl(0, 0%, 88.7%);--gray7: hsl(0, 0%, 85.8%);--gray8: hsl(0, 0%, 78%);--gray9: hsl(0, 0%, 56.1%);--gray10: hsl(0, 0%, 52.3%);--gray11: hsl(0, 0%, 43.5%);--gray12: hsl(0, 0%, 9%);--border-radius: 8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:none;z-index:999999999;transition:transform .4s ease}:where([data-sonner-toaster][data-lifted="true"]){transform:translateY(-10px)}@media (hover: none) and (pointer: coarse){:where([data-sonner-toaster][data-lifted="true"]){transform:none}}:where([data-sonner-toaster][data-x-position="right"]){right:var(--offset-right)}:where([data-sonner-toaster][data-x-position="left"]){left:var(--offset-left)}:where([data-sonner-toaster][data-x-position="center"]){left:50%;transform:translate(-50%)}:where([data-sonner-toaster][data-y-position="top"]){top:var(--offset-top)}:where([data-sonner-toaster][data-y-position="bottom"]){bottom:var(--offset-bottom)}:where([data-sonner-toast]){--y: translateY(100%);--lift-amount: calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);filter:blur(0);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:none;overflow-wrap:anywhere}:where([data-sonner-toast][data-styled="true"]){padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px #0000001a;width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}:where([data-sonner-toast]:focus-visible){box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast][data-y-position="top"]){top:0;--y: translateY(-100%);--lift: 1;--lift-amount: calc(1 * var(--gap))}:where([data-sonner-toast][data-y-position="bottom"]){bottom:0;--y: translateY(100%);--lift: -1;--lift-amount: calc(var(--lift) * var(--gap))}:where([data-sonner-toast]) :where([data-description]){font-weight:400;line-height:1.4;color:inherit}:where([data-sonner-toast]) :where([data-title]){font-weight:500;line-height:1.5;color:inherit}:where([data-sonner-toast]) :where([data-icon]){display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}:where([data-sonner-toast][data-promise="true"]) :where([data-icon])>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}:where([data-sonner-toast]) :where([data-icon])>*{flex-shrink:0}:where([data-sonner-toast]) :where([data-icon]) svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}:where([data-sonner-toast]) :where([data-content]){display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;cursor:pointer;outline:none;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}:where([data-sonner-toast]) :where([data-button]):focus-visible{box-shadow:0 0 0 2px #0006}:where([data-sonner-toast]) :where([data-button]):first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}:where([data-sonner-toast]) :where([data-cancel]){color:var(--normal-text);background:rgba(0,0,0,.08)}:where([data-sonner-toast][data-theme="dark"]) :where([data-cancel]){background:rgba(255,255,255,.3)}:where([data-sonner-toast]) :where([data-close-button]){position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast] [data-close-button]{background:var(--gray1)}:where([data-sonner-toast]) :where([data-close-button]):focus-visible{box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast]) :where([data-disabled="true"]){cursor:not-allowed}:where([data-sonner-toast]):hover :where([data-close-button]):hover{background:var(--gray2);border-color:var(--gray5)}:where([data-sonner-toast][data-swiping="true"]):before{content:"";position:absolute;left:-50%;right:-50%;height:100%;z-index:-1}:where([data-sonner-toast][data-y-position="top"][data-swiping="true"]):before{bottom:50%;transform:scaleY(3) translateY(50%)}:where([data-sonner-toast][data-y-position="bottom"][data-swiping="true"]):before{top:50%;transform:scaleY(3) translateY(-50%)}:where([data-sonner-toast][data-swiping="false"][data-removed="true"]):before{content:"";position:absolute;inset:0;transform:scaleY(2)}:where([data-sonner-toast]):after{content:"";position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}:where([data-sonner-toast][data-mounted="true"]){--y: translateY(0);opacity:1}:where([data-sonner-toast][data-expanded="false"][data-front="false"]){--scale: var(--toasts-before) * .05 + 1;--y: translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}:where([data-sonner-toast])>*{transition:opacity .4s}:where([data-sonner-toast][data-expanded="false"][data-front="false"][data-styled="true"])>*{opacity:0}:where([data-sonner-toast][data-visible="false"]){opacity:0;pointer-events:none}:where([data-sonner-toast][data-mounted="true"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}:where([data-sonner-toast][data-removed="true"][data-front="true"][data-swipe-out="false"]){--y: translateY(calc(var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="false"]){--y: translateY(40%);opacity:0;transition:transform .5s,opacity .2s}:where([data-sonner-toast][data-removed="true"][data-front="false"]):before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y, 0px)) translate(var(--swipe-amount-x, 0px));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width: 600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-theme=light]{--normal-bg: #fff;--normal-border: var(--gray4);--normal-text: var(--gray12);--success-bg: hsl(143, 85%, 96%);--success-border: hsl(145, 92%, 91%);--success-text: hsl(140, 100%, 27%);--info-bg: hsl(208, 100%, 97%);--info-border: hsl(221, 91%, 91%);--info-text: hsl(210, 92%, 45%);--warning-bg: hsl(49, 100%, 97%);--warning-border: hsl(49, 91%, 91%);--warning-text: hsl(31, 92%, 45%);--error-bg: hsl(359, 100%, 97%);--error-border: hsl(359, 100%, 94%);--error-text: hsl(360, 100%, 45%)}[data-sonner-toaster][data-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg: #000;--normal-border: hsl(0, 0%, 20%);--normal-text: var(--gray1)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg: #fff;--normal-border: var(--gray3);--normal-text: var(--gray12)}[data-sonner-toaster][data-theme=dark]{--normal-bg: #000;--normal-bg-hover: hsl(0, 0%, 12%);--normal-border: hsl(0, 0%, 20%);--normal-border-hover: hsl(0, 0%, 25%);--normal-text: var(--gray1);--success-bg: hsl(150, 100%, 6%);--success-border: hsl(147, 100%, 12%);--success-text: hsl(150, 86%, 65%);--info-bg: hsl(215, 100%, 6%);--info-border: hsl(223, 100%, 12%);--info-text: hsl(216, 87%, 65%);--warning-bg: hsl(64, 100%, 6%);--warning-border: hsl(60, 100%, 12%);--warning-text: hsl(46, 87%, 65%);--error-bg: hsl(358, 76%, 10%);--error-border: hsl(357, 89%, 16%);--error-text: hsl(358, 100%, 81%)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success],[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info],[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning],[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error],[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size: 16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:nth-child(1){animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}to{opacity:.15}}@media (prefers-reduced-motion){[data-sonner-toast],[data-sonner-toast]>*,.sonner-loading-bar{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}
`);
        function tt(n) {
          return n.label !== void 0;
        }
        var pe = 3,
          me = "32px",
          ge = "16px",
          Wt = 4e3,
          he = 356,
          be = 14,
          ye = 20,
          we = 200;
        function M(...n) {
          return n.filter(Boolean).join(" ");
        }
        function xe(n) {
          let [e, t] = n.split("-"),
            a = [];
          return e && a.push(e), t && a.push(t), a;
        }
        var ve = n => {
          var Dt, Pt, Nt, Bt, Ct, kt, It, Mt, Ht, At, Lt;
          let {
              invert: e,
              toast: t,
              unstyled: a,
              interacting: u,
              setHeights: f,
              visibleToasts: w,
              heights: S,
              index: g,
              toasts: i,
              expanded: D,
              removeToast: T,
              defaultRichColors: F,
              closeButton: et,
              style: ut,
              cancelButtonStyle: ft,
              actionButtonStyle: l,
              className: ot = "",
              descriptionClassName: at = "",
              duration: X,
              position: st,
              gap: pt,
              loadingIcon: rt,
              expandByDefault: B,
              classNames: s,
              icons: P,
              closeButtonAriaLabel: nt = "Close toast",
              pauseWhenPageIsHidden: it
            } = n,
            [Y, C] = React.useState(null),
            [lt, J] = React.useState(null),
            [W, H] = React.useState(false),
            [A, mt] = React.useState(false),
            [L, z] = React.useState(false),
            [ct, d] = React.useState(false),
            [h, y] = React.useState(false),
            [R, j] = React.useState(0),
            [p, _] = React.useState(0),
            O = React.useRef(t.duration || X || Wt),
            G = React.useRef(null),
            k = React.useRef(null),
            Vt = g === 0,
            Ut = g + 1 <= w,
            N = t.type,
            V = t.dismissible !== false,
            Kt = t.className || "",
            Xt = t.descriptionClassName || "",
            dt = React.useMemo(() => S.findIndex(r => r.toastId === t.id) || 0, [S, t.id]),
            Jt = React.useMemo(() => {
              var r;
              return (r = t.closeButton) != null ? r : et;
            }, [t.closeButton, et]),
            Tt = React.useMemo(() => t.duration || X || Wt, [t.duration, X]),
            gt = React.useRef(0),
            U = React.useRef(0),
            St = React.useRef(0),
            K = React.useRef(null),
            [Gt, Qt] = st.split("-"),
            Rt = React.useMemo(() => S.reduce((r, m, c) => c >= dt ? r : r + m.height, 0), [S, dt]),
            Et = Ft(),
            qt = t.invert || e,
            ht = N === "loading";
          U.current = React.useMemo(() => dt * pt + Rt, [dt, Rt]), React.useEffect(() => {
            O.current = Tt;
          }, [Tt]), React.useEffect(() => {
            H(true);
          }, []), React.useEffect(() => {
            let r = k.current;
            if (r) {
              let m = r.getBoundingClientRect().height;
              return _(m), f(c => [{
                toastId: t.id,
                height: m,
                position: t.position
              }, ...c]), () => f(c => c.filter(b => b.toastId !== t.id));
            }
          }, [f, t.id]), React.useLayoutEffect(() => {
            if (!W) return;
            let r = k.current,
              m = r.style.height;
            r.style.height = "auto";
            let c = r.getBoundingClientRect().height;
            r.style.height = m, _(c), f(b => b.find(x => x.toastId === t.id) ? b.map(x => x.toastId === t.id ? {
              ...x,
              height: c
            } : x) : [{
              toastId: t.id,
              height: c,
              position: t.position
            }, ...b]);
          }, [W, t.title, t.description, f, t.id]);
          let $ = React.useCallback(() => {
            mt(true), j(U.current), f(r => r.filter(m => m.toastId !== t.id)), setTimeout(() => {
              T(t);
            }, we);
          }, [t, T, f, U]);
          React.useEffect(() => {
            if (t.promise && N === "loading" || t.duration === 1 / 0 || t.type === "loading") return;
            let r;
            return D || u || it && Et ? (() => {
              if (St.current < gt.current) {
                let b = new Date().getTime() - gt.current;
                O.current = O.current - b;
              }
              St.current = new Date().getTime();
            })() : (() => {
              O.current !== 1 / 0 && (gt.current = new Date().getTime(), r = setTimeout(() => {
                var b;
                (b = t.onAutoClose) == null || b.call(t, t), $();
              }, O.current));
            })(), () => clearTimeout(r);
          }, [D, u, t, N, it, Et, $]), React.useEffect(() => {
            t.delete && $();
          }, [$, t.delete]);
          function Zt() {
            var r, m, c;
            return P != null && P.loading ? React.createElement("div", {
              className: M(s == null ? void 0 : s.loader, (r = t == null ? void 0 : t.classNames) == null ? void 0 : r.loader, "sonner-loader"),
              "data-visible": N === "loading"
            }, P.loading) : rt ? React.createElement("div", {
              className: M(s == null ? void 0 : s.loader, (m = t == null ? void 0 : t.classNames) == null ? void 0 : m.loader, "sonner-loader"),
              "data-visible": N === "loading"
            }, rt) : React.createElement(Yt, {
              className: M(s == null ? void 0 : s.loader, (c = t == null ? void 0 : t.classNames) == null ? void 0 : c.loader),
              visible: N === "loading"
            });
          }
          return React.createElement("li", {
            tabIndex: 0,
            ref: k,
            className: M(ot, Kt, s == null ? void 0 : s.toast, (Dt = t == null ? void 0 : t.classNames) == null ? void 0 : Dt.toast, s == null ? void 0 : s.default, s == null ? void 0 : s[N], (Pt = t == null ? void 0 : t.classNames) == null ? void 0 : Pt[N]),
            "data-sonner-toast": "",
            "data-rich-colors": (Nt = t.richColors) != null ? Nt : F,
            "data-styled": !(t.jsx || t.unstyled || a),
            "data-mounted": W,
            "data-promise": !!t.promise,
            "data-swiped": h,
            "data-removed": A,
            "data-visible": Ut,
            "data-y-position": Gt,
            "data-x-position": Qt,
            "data-index": g,
            "data-front": Vt,
            "data-swiping": L,
            "data-dismissible": V,
            "data-type": N,
            "data-invert": qt,
            "data-swipe-out": ct,
            "data-swipe-direction": lt,
            "data-expanded": !!(D || B && W),
            style: {
              "--index": g,
              "--toasts-before": g,
              "--z-index": i.length - g,
              "--offset": `${A ? R : U.current}px`,
              "--initial-height": B ? "auto" : `${p}px`,
              ...ut,
              ...t.style
            },
            onDragEnd: () => {
              z(false), C(null), K.current = null;
            },
            onPointerDown: r => {
              ht || !V || (G.current = new Date(), j(U.current), r.target.setPointerCapture(r.pointerId), r.target.tagName !== "BUTTON" && (z(true), K.current = {
                x: r.clientX,
                y: r.clientY
              }));
            },
            onPointerUp: () => {
              var x, Q, q, Z;
              if (ct || !V) return;
              K.current = null;
              let r = Number(((x = k.current) == null ? void 0 : x.style.getPropertyValue("--swipe-amount-x").replace("px", "")) || 0),
                m = Number(((Q = k.current) == null ? void 0 : Q.style.getPropertyValue("--swipe-amount-y").replace("px", "")) || 0),
                c = new Date().getTime() - ((q = G.current) == null ? void 0 : q.getTime()),
                b = Y === "x" ? r : m,
                I = Math.abs(b) / c;
              if (Math.abs(b) >= ye || I > .11) {
                j(U.current), (Z = t.onDismiss) == null || Z.call(t, t), J(Y === "x" ? r > 0 ? "right" : "left" : m > 0 ? "down" : "up"), $(), d(true), y(false);
                return;
              }
              z(false), C(null);
            },
            onPointerMove: r => {
              var Q, q, Z, zt;
              if (!K.current || !V || ((Q = window.getSelection()) == null ? void 0 : Q.toString().length) > 0) return;
              let c = r.clientY - K.current.y,
                b = r.clientX - K.current.x,
                I = (q = n.swipeDirections) != null ? q : xe(st);
              !Y && (Math.abs(b) > 1 || Math.abs(c) > 1) && C(Math.abs(b) > Math.abs(c) ? "x" : "y");
              let x = {
                x: 0,
                y: 0
              };
              Y === "y" ? (I.includes("top") || I.includes("bottom")) && (I.includes("top") && c < 0 || I.includes("bottom") && c > 0) && (x.y = c) : Y === "x" && (I.includes("left") || I.includes("right")) && (I.includes("left") && b < 0 || I.includes("right") && b > 0) && (x.x = b), (Math.abs(x.x) > 0 || Math.abs(x.y) > 0) && y(true), (Z = k.current) == null || Z.style.setProperty("--swipe-amount-x", `${x.x}px`), (zt = k.current) == null || zt.style.setProperty("--swipe-amount-y", `${x.y}px`);
            }
          }, Jt && !t.jsx ? React.createElement("button", {
            "aria-label": nt,
            "data-disabled": ht,
            "data-close-button": true,
            onClick: ht || !V ? () => {} : () => {
              var r;
              $(), (r = t.onDismiss) == null || r.call(t, t);
            },
            className: M(s == null ? void 0 : s.closeButton, (Bt = t == null ? void 0 : t.classNames) == null ? void 0 : Bt.closeButton)
          }, (Ct = P == null ? void 0 : P.close) != null ? Ct : Ot) : null, t.jsx || reactExports.isValidElement(t.title) ? t.jsx ? t.jsx : typeof t.title == "function" ? t.title() : t.title : React.createElement(React.Fragment, null, N || t.icon || t.promise ? React.createElement("div", {
            "data-icon": "",
            className: M(s == null ? void 0 : s.icon, (kt = t == null ? void 0 : t.classNames) == null ? void 0 : kt.icon)
          }, t.promise || t.type === "loading" && !t.icon ? t.icon || Zt() : null, t.type !== "loading" ? t.icon || (P == null ? void 0 : P[N]) || jt(N) : null) : null, React.createElement("div", {
            "data-content": "",
            className: M(s == null ? void 0 : s.content, (It = t == null ? void 0 : t.classNames) == null ? void 0 : It.content)
          }, React.createElement("div", {
            "data-title": "",
            className: M(s == null ? void 0 : s.title, (Mt = t == null ? void 0 : t.classNames) == null ? void 0 : Mt.title)
          }, typeof t.title == "function" ? t.title() : t.title), t.description ? React.createElement("div", {
            "data-description": "",
            className: M(at, Xt, s == null ? void 0 : s.description, (Ht = t == null ? void 0 : t.classNames) == null ? void 0 : Ht.description)
          }, typeof t.description == "function" ? t.description() : t.description) : null), reactExports.isValidElement(t.cancel) ? t.cancel : t.cancel && tt(t.cancel) ? React.createElement("button", {
            "data-button": true,
            "data-cancel": true,
            style: t.cancelButtonStyle || ft,
            onClick: r => {
              var m, c;
              tt(t.cancel) && V && ((c = (m = t.cancel).onClick) == null || c.call(m, r), $());
            },
            className: M(s == null ? void 0 : s.cancelButton, (At = t == null ? void 0 : t.classNames) == null ? void 0 : At.cancelButton)
          }, t.cancel.label) : null, reactExports.isValidElement(t.action) ? t.action : t.action && tt(t.action) ? React.createElement("button", {
            "data-button": true,
            "data-action": true,
            style: t.actionButtonStyle || l,
            onClick: r => {
              var m, c;
              tt(t.action) && ((c = (m = t.action).onClick) == null || c.call(m, r), !r.defaultPrevented && $());
            },
            className: M(s == null ? void 0 : s.actionButton, (Lt = t == null ? void 0 : t.classNames) == null ? void 0 : Lt.actionButton)
          }, t.action.label) : null));
        };
        function _t() {
          if (typeof window == "undefined" || typeof document == "undefined") return "ltr";
          let n = document.documentElement.getAttribute("dir");
          return n === "auto" || !n ? window.getComputedStyle(document.documentElement).direction : n;
        }
        function Te(n, e) {
          let t = {};
          return [n, e].forEach((a, u) => {
            let f = u === 1,
              w = f ? "--mobile-offset" : "--offset",
              S = f ? ge : me;
            function g(i) {
              ["top", "right", "bottom", "left"].forEach(D => {
                t[`${w}-${D}`] = typeof i == "number" ? `${i}px` : i;
              });
            }
            typeof a == "number" || typeof a == "string" ? g(a) : typeof a == "object" ? ["top", "right", "bottom", "left"].forEach(i => {
              a[i] === void 0 ? t[`${w}-${i}`] = S : t[`${w}-${i}`] = typeof a[i] == "number" ? `${a[i]}px` : a[i];
            }) : g(S);
          }), t;
        }
        var $e = exports("$", reactExports.forwardRef(function (e, t) {
          let {
              invert: a,
              position: u = "bottom-right",
              hotkey: f = ["altKey", "KeyT"],
              expand: w,
              closeButton: S,
              className: g,
              offset: i,
              mobileOffset: D,
              theme: T = "light",
              richColors: F,
              duration: et,
              style: ut,
              visibleToasts: ft = pe,
              toastOptions: l,
              dir: ot = _t(),
              gap: at = be,
              loadingIcon: X,
              icons: st,
              containerAriaLabel: pt = "Notifications",
              pauseWhenPageIsHidden: rt
            } = e,
            [B, s] = React.useState([]),
            P = React.useMemo(() => Array.from(new Set([u].concat(B.filter(d => d.position).map(d => d.position)))), [B, u]),
            [nt, it] = React.useState([]),
            [Y, C] = React.useState(false),
            [lt, J] = React.useState(false),
            [W, H] = React.useState(T !== "system" ? T : typeof window != "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
            A = React.useRef(null),
            mt = f.join("+").replace(/Key/g, "").replace(/Digit/g, ""),
            L = React.useRef(null),
            z = React.useRef(false),
            ct = React.useCallback(d => {
              s(h => {
                var y;
                return (y = h.find(R => R.id === d.id)) != null && y.delete || v.dismiss(d.id), h.filter(({
                  id: R
                }) => R !== d.id);
              });
            }, []);
          return React.useEffect(() => v.subscribe(d => {
            if (d.dismiss) {
              s(h => h.map(y => y.id === d.id ? {
                ...y,
                delete: true
              } : y));
              return;
            }
            setTimeout(() => {
              ReactDOM.flushSync(() => {
                s(h => {
                  let y = h.findIndex(R => R.id === d.id);
                  return y !== -1 ? [...h.slice(0, y), {
                    ...h[y],
                    ...d
                  }, ...h.slice(y + 1)] : [d, ...h];
                });
              });
            });
          }), []), React.useEffect(() => {
            if (T !== "system") {
              H(T);
              return;
            }
            if (T === "system" && (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? H("dark") : H("light")), typeof window == "undefined") return;
            let d = window.matchMedia("(prefers-color-scheme: dark)");
            try {
              d.addEventListener("change", ({
                matches: h
              }) => {
                H(h ? "dark" : "light");
              });
            } catch (h) {
              d.addListener(({
                matches: y
              }) => {
                try {
                  H(y ? "dark" : "light");
                } catch (R) {
                  console.error(R);
                }
              });
            }
          }, [T]), React.useEffect(() => {
            B.length <= 1 && C(false);
          }, [B]), React.useEffect(() => {
            let d = h => {
              var R, j;
              f.every(p => h[p] || h.code === p) && (C(true), (R = A.current) == null || R.focus()), h.code === "Escape" && (document.activeElement === A.current || (j = A.current) != null && j.contains(document.activeElement)) && C(false);
            };
            return document.addEventListener("keydown", d), () => document.removeEventListener("keydown", d);
          }, [f]), React.useEffect(() => {
            if (A.current) return () => {
              L.current && (L.current.focus({
                preventScroll: true
              }), L.current = null, z.current = false);
            };
          }, [A.current]), React.createElement("section", {
            ref: t,
            "aria-label": `${pt} ${mt}`,
            tabIndex: -1,
            "aria-live": "polite",
            "aria-relevant": "additions text",
            "aria-atomic": "false",
            suppressHydrationWarning: true
          }, P.map((d, h) => {
            var j;
            let [y, R] = d.split("-");
            return B.length ? React.createElement("ol", {
              key: d,
              dir: ot === "auto" ? _t() : ot,
              tabIndex: -1,
              ref: A,
              className: g,
              "data-sonner-toaster": true,
              "data-theme": W,
              "data-y-position": y,
              "data-lifted": Y && B.length > 1 && !w,
              "data-x-position": R,
              style: {
                "--front-toast-height": `${((j = nt[0]) == null ? void 0 : j.height) || 0}px`,
                "--width": `${he}px`,
                "--gap": `${at}px`,
                ...ut,
                ...Te(i, D)
              },
              onBlur: p => {
                z.current && !p.currentTarget.contains(p.relatedTarget) && (z.current = false, L.current && (L.current.focus({
                  preventScroll: true
                }), L.current = null));
              },
              onFocus: p => {
                p.target instanceof HTMLElement && p.target.dataset.dismissible === "false" || z.current || (z.current = true, L.current = p.relatedTarget);
              },
              onMouseEnter: () => C(true),
              onMouseMove: () => C(true),
              onMouseLeave: () => {
                lt || C(false);
              },
              onDragEnd: () => C(false),
              onPointerDown: p => {
                p.target instanceof HTMLElement && p.target.dataset.dismissible === "false" || J(true);
              },
              onPointerUp: () => J(false)
            }, B.filter(p => !p.position && h === 0 || p.position === d).map((p, _) => {
              var O, G;
              return React.createElement(ve, {
                key: p.id,
                icons: st,
                index: _,
                toast: p,
                defaultRichColors: F,
                duration: (O = l == null ? void 0 : l.duration) != null ? O : et,
                className: l == null ? void 0 : l.className,
                descriptionClassName: l == null ? void 0 : l.descriptionClassName,
                invert: a,
                visibleToasts: ft,
                closeButton: (G = l == null ? void 0 : l.closeButton) != null ? G : S,
                interacting: lt,
                position: d,
                style: l == null ? void 0 : l.style,
                unstyled: l == null ? void 0 : l.unstyled,
                classNames: l == null ? void 0 : l.classNames,
                cancelButtonStyle: l == null ? void 0 : l.cancelButtonStyle,
                actionButtonStyle: l == null ? void 0 : l.actionButtonStyle,
                removeToast: ct,
                toasts: B.filter(k => k.position == p.position),
                heights: nt.filter(k => k.position == p.position),
                setHeights: it,
                expandByDefault: w,
                gap: at,
                loadingIcon: X,
                expanded: Y,
                pauseWhenPageIsHidden: rt,
                swipeDirections: e.swipeDirections
              });
            })) : null;
          }));
        }));
        function r(e) {
          var t,
            f,
            n = "";
          if ("string" == typeof e || "number" == typeof e) n += e;else if ("object" == typeof e) if (Array.isArray(e)) {
            var o = e.length;
            for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
          } else for (f in e) e[f] && (n && (n += " "), n += f);
          return n;
        }
        function clsx() {
          for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
          return n;
        }
        const CLASS_PART_SEPARATOR = '-';
        const createClassGroupUtils = config => {
          const classMap = createClassMap(config);
          const {
            conflictingClassGroups,
            conflictingClassGroupModifiers
          } = config;
          const getClassGroupId = className => {
            const classParts = className.split(CLASS_PART_SEPARATOR);
            // Classes like `-inset-1` produce an empty string as first classPart. We assume that classes for negative values are used correctly and remove it from classParts.
            if (classParts[0] === '' && classParts.length !== 1) {
              classParts.shift();
            }
            return getGroupRecursive(classParts, classMap) || getGroupIdForArbitraryProperty(className);
          };
          const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
            const conflicts = conflictingClassGroups[classGroupId] || [];
            if (hasPostfixModifier && conflictingClassGroupModifiers[classGroupId]) {
              return [...conflicts, ...conflictingClassGroupModifiers[classGroupId]];
            }
            return conflicts;
          };
          return {
            getClassGroupId,
            getConflictingClassGroupIds
          };
        };
        const getGroupRecursive = (classParts, classPartObject) => {
          if (classParts.length === 0) {
            return classPartObject.classGroupId;
          }
          const currentClassPart = classParts[0];
          const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
          const classGroupFromNextClassPart = nextClassPartObject ? getGroupRecursive(classParts.slice(1), nextClassPartObject) : undefined;
          if (classGroupFromNextClassPart) {
            return classGroupFromNextClassPart;
          }
          if (classPartObject.validators.length === 0) {
            return undefined;
          }
          const classRest = classParts.join(CLASS_PART_SEPARATOR);
          return classPartObject.validators.find(({
            validator
          }) => validator(classRest))?.classGroupId;
        };
        const arbitraryPropertyRegex = /^\[(.+)\]$/;
        const getGroupIdForArbitraryProperty = className => {
          if (arbitraryPropertyRegex.test(className)) {
            const arbitraryPropertyClassName = arbitraryPropertyRegex.exec(className)[1];
            const property = arbitraryPropertyClassName?.substring(0, arbitraryPropertyClassName.indexOf(':'));
            if (property) {
              // I use two dots here because one dot is used as prefix for class groups in plugins
              return 'arbitrary..' + property;
            }
          }
        };
        /**
         * Exported for testing only
         */
        const createClassMap = config => {
          const {
            theme,
            prefix
          } = config;
          const classMap = {
            nextPart: new Map(),
            validators: []
          };
          const prefixedClassGroupEntries = getPrefixedClassGroupEntries(Object.entries(config.classGroups), prefix);
          prefixedClassGroupEntries.forEach(([classGroupId, classGroup]) => {
            processClassesRecursively(classGroup, classMap, classGroupId, theme);
          });
          return classMap;
        };
        const processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
          classGroup.forEach(classDefinition => {
            if (typeof classDefinition === 'string') {
              const classPartObjectToEdit = classDefinition === '' ? classPartObject : getPart(classPartObject, classDefinition);
              classPartObjectToEdit.classGroupId = classGroupId;
              return;
            }
            if (typeof classDefinition === 'function') {
              if (isThemeGetter(classDefinition)) {
                processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
                return;
              }
              classPartObject.validators.push({
                validator: classDefinition,
                classGroupId
              });
              return;
            }
            Object.entries(classDefinition).forEach(([key, classGroup]) => {
              processClassesRecursively(classGroup, getPart(classPartObject, key), classGroupId, theme);
            });
          });
        };
        const getPart = (classPartObject, path) => {
          let currentClassPartObject = classPartObject;
          path.split(CLASS_PART_SEPARATOR).forEach(pathPart => {
            if (!currentClassPartObject.nextPart.has(pathPart)) {
              currentClassPartObject.nextPart.set(pathPart, {
                nextPart: new Map(),
                validators: []
              });
            }
            currentClassPartObject = currentClassPartObject.nextPart.get(pathPart);
          });
          return currentClassPartObject;
        };
        const isThemeGetter = func => func.isThemeGetter;
        const getPrefixedClassGroupEntries = (classGroupEntries, prefix) => {
          if (!prefix) {
            return classGroupEntries;
          }
          return classGroupEntries.map(([classGroupId, classGroup]) => {
            const prefixedClassGroup = classGroup.map(classDefinition => {
              if (typeof classDefinition === 'string') {
                return prefix + classDefinition;
              }
              if (typeof classDefinition === 'object') {
                return Object.fromEntries(Object.entries(classDefinition).map(([key, value]) => [prefix + key, value]));
              }
              return classDefinition;
            });
            return [classGroupId, prefixedClassGroup];
          });
        };

        // LRU cache inspired from hashlru (https://github.com/dominictarr/hashlru/blob/v1.0.4/index.js) but object replaced with Map to improve performance
        const createLruCache = maxCacheSize => {
          if (maxCacheSize < 1) {
            return {
              get: () => undefined,
              set: () => {}
            };
          }
          let cacheSize = 0;
          let cache = new Map();
          let previousCache = new Map();
          const update = (key, value) => {
            cache.set(key, value);
            cacheSize++;
            if (cacheSize > maxCacheSize) {
              cacheSize = 0;
              previousCache = cache;
              cache = new Map();
            }
          };
          return {
            get(key) {
              let value = cache.get(key);
              if (value !== undefined) {
                return value;
              }
              if ((value = previousCache.get(key)) !== undefined) {
                update(key, value);
                return value;
              }
            },
            set(key, value) {
              if (cache.has(key)) {
                cache.set(key, value);
              } else {
                update(key, value);
              }
            }
          };
        };
        const IMPORTANT_MODIFIER = '!';
        const createParseClassName = config => {
          const {
            separator,
            experimentalParseClassName
          } = config;
          const isSeparatorSingleCharacter = separator.length === 1;
          const firstSeparatorCharacter = separator[0];
          const separatorLength = separator.length;
          // parseClassName inspired by https://github.com/tailwindlabs/tailwindcss/blob/v3.2.2/src/util/splitAtTopLevelOnly.js
          const parseClassName = className => {
            const modifiers = [];
            let bracketDepth = 0;
            let modifierStart = 0;
            let postfixModifierPosition;
            for (let index = 0; index < className.length; index++) {
              let currentCharacter = className[index];
              if (bracketDepth === 0) {
                if (currentCharacter === firstSeparatorCharacter && (isSeparatorSingleCharacter || className.slice(index, index + separatorLength) === separator)) {
                  modifiers.push(className.slice(modifierStart, index));
                  modifierStart = index + separatorLength;
                  continue;
                }
                if (currentCharacter === '/') {
                  postfixModifierPosition = index;
                  continue;
                }
              }
              if (currentCharacter === '[') {
                bracketDepth++;
              } else if (currentCharacter === ']') {
                bracketDepth--;
              }
            }
            const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.substring(modifierStart);
            const hasImportantModifier = baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER);
            const baseClassName = hasImportantModifier ? baseClassNameWithImportantModifier.substring(1) : baseClassNameWithImportantModifier;
            const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : undefined;
            return {
              modifiers,
              hasImportantModifier,
              baseClassName,
              maybePostfixModifierPosition
            };
          };
          if (experimentalParseClassName) {
            return className => experimentalParseClassName({
              className,
              parseClassName
            });
          }
          return parseClassName;
        };
        /**
         * Sorts modifiers according to following schema:
         * - Predefined modifiers are sorted alphabetically
         * - When an arbitrary variant appears, it must be preserved which modifiers are before and after it
         */
        const sortModifiers = modifiers => {
          if (modifiers.length <= 1) {
            return modifiers;
          }
          const sortedModifiers = [];
          let unsortedModifiers = [];
          modifiers.forEach(modifier => {
            const isArbitraryVariant = modifier[0] === '[';
            if (isArbitraryVariant) {
              sortedModifiers.push(...unsortedModifiers.sort(), modifier);
              unsortedModifiers = [];
            } else {
              unsortedModifiers.push(modifier);
            }
          });
          sortedModifiers.push(...unsortedModifiers.sort());
          return sortedModifiers;
        };
        const createConfigUtils = config => ({
          cache: createLruCache(config.cacheSize),
          parseClassName: createParseClassName(config),
          ...createClassGroupUtils(config)
        });
        const SPLIT_CLASSES_REGEX = /\s+/;
        const mergeClassList = (classList, configUtils) => {
          const {
            parseClassName,
            getClassGroupId,
            getConflictingClassGroupIds
          } = configUtils;
          /**
           * Set of classGroupIds in following format:
           * `{importantModifier}{variantModifiers}{classGroupId}`
           * @example 'float'
           * @example 'hover:focus:bg-color'
           * @example 'md:!pr'
           */
          const classGroupsInConflict = [];
          const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
          let result = '';
          for (let index = classNames.length - 1; index >= 0; index -= 1) {
            const originalClassName = classNames[index];
            const {
              modifiers,
              hasImportantModifier,
              baseClassName,
              maybePostfixModifierPosition
            } = parseClassName(originalClassName);
            let hasPostfixModifier = Boolean(maybePostfixModifierPosition);
            let classGroupId = getClassGroupId(hasPostfixModifier ? baseClassName.substring(0, maybePostfixModifierPosition) : baseClassName);
            if (!classGroupId) {
              if (!hasPostfixModifier) {
                // Not a Tailwind class
                result = originalClassName + (result.length > 0 ? ' ' + result : result);
                continue;
              }
              classGroupId = getClassGroupId(baseClassName);
              if (!classGroupId) {
                // Not a Tailwind class
                result = originalClassName + (result.length > 0 ? ' ' + result : result);
                continue;
              }
              hasPostfixModifier = false;
            }
            const variantModifier = sortModifiers(modifiers).join(':');
            const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER : variantModifier;
            const classId = modifierId + classGroupId;
            if (classGroupsInConflict.includes(classId)) {
              // Tailwind class omitted due to conflict
              continue;
            }
            classGroupsInConflict.push(classId);
            const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
            for (let i = 0; i < conflictGroups.length; ++i) {
              const group = conflictGroups[i];
              classGroupsInConflict.push(modifierId + group);
            }
            // Tailwind class not in conflict
            result = originalClassName + (result.length > 0 ? ' ' + result : result);
          }
          return result;
        };

        /**
         * The code in this file is copied from https://github.com/lukeed/clsx and modified to suit the needs of tailwind-merge better.
         *
         * Specifically:
         * - Runtime code from https://github.com/lukeed/clsx/blob/v1.2.1/src/index.js
         * - TypeScript types from https://github.com/lukeed/clsx/blob/v1.2.1/clsx.d.ts
         *
         * Original code has MIT license: Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
         */
        function twJoin() {
          let index = 0;
          let argument;
          let resolvedValue;
          let string = '';
          while (index < arguments.length) {
            if (argument = arguments[index++]) {
              if (resolvedValue = toValue(argument)) {
                string && (string += ' ');
                string += resolvedValue;
              }
            }
          }
          return string;
        }
        const toValue = mix => {
          if (typeof mix === 'string') {
            return mix;
          }
          let resolvedValue;
          let string = '';
          for (let k = 0; k < mix.length; k++) {
            if (mix[k]) {
              if (resolvedValue = toValue(mix[k])) {
                string && (string += ' ');
                string += resolvedValue;
              }
            }
          }
          return string;
        };
        function createTailwindMerge(createConfigFirst, ...createConfigRest) {
          let configUtils;
          let cacheGet;
          let cacheSet;
          let functionToCall = initTailwindMerge;
          function initTailwindMerge(classList) {
            const config = createConfigRest.reduce((previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig), createConfigFirst());
            configUtils = createConfigUtils(config);
            cacheGet = configUtils.cache.get;
            cacheSet = configUtils.cache.set;
            functionToCall = tailwindMerge;
            return tailwindMerge(classList);
          }
          function tailwindMerge(classList) {
            const cachedResult = cacheGet(classList);
            if (cachedResult) {
              return cachedResult;
            }
            const result = mergeClassList(classList, configUtils);
            cacheSet(classList, result);
            return result;
          }
          return function callTailwindMerge() {
            return functionToCall(twJoin.apply(null, arguments));
          };
        }
        const fromTheme = key => {
          const themeGetter = theme => theme[key] || [];
          themeGetter.isThemeGetter = true;
          return themeGetter;
        };
        const arbitraryValueRegex = /^\[(?:([a-z-]+):)?(.+)\]$/i;
        const fractionRegex = /^\d+\/\d+$/;
        const stringLengths = /*#__PURE__*/new Set(['px', 'full', 'screen']);
        const tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
        const lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
        const colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/;
        // Shadow always begins with x and y offset separated by underscore optionally prepended by inset
        const shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
        const imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
        const isLength = value => isNumber(value) || stringLengths.has(value) || fractionRegex.test(value);
        const isArbitraryLength = value => getIsArbitraryValue(value, 'length', isLengthOnly);
        const isNumber = value => Boolean(value) && !Number.isNaN(Number(value));
        const isArbitraryNumber = value => getIsArbitraryValue(value, 'number', isNumber);
        const isInteger = value => Boolean(value) && Number.isInteger(Number(value));
        const isPercent = value => value.endsWith('%') && isNumber(value.slice(0, -1));
        const isArbitraryValue = value => arbitraryValueRegex.test(value);
        const isTshirtSize = value => tshirtUnitRegex.test(value);
        const sizeLabels = /*#__PURE__*/new Set(['length', 'size', 'percentage']);
        const isArbitrarySize = value => getIsArbitraryValue(value, sizeLabels, isNever);
        const isArbitraryPosition = value => getIsArbitraryValue(value, 'position', isNever);
        const imageLabels = /*#__PURE__*/new Set(['image', 'url']);
        const isArbitraryImage = value => getIsArbitraryValue(value, imageLabels, isImage);
        const isArbitraryShadow = value => getIsArbitraryValue(value, '', isShadow);
        const isAny = () => true;
        const getIsArbitraryValue = (value, label, testValue) => {
          const result = arbitraryValueRegex.exec(value);
          if (result) {
            if (result[1]) {
              return typeof label === 'string' ? result[1] === label : label.has(result[1]);
            }
            return testValue(result[2]);
          }
          return false;
        };
        const isLengthOnly = value =>
        // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
        // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
        // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
        lengthUnitRegex.test(value) && !colorFunctionRegex.test(value);
        const isNever = () => false;
        const isShadow = value => shadowRegex.test(value);
        const isImage = value => imageRegex.test(value);
        const getDefaultConfig = () => {
          const colors = fromTheme('colors');
          const spacing = fromTheme('spacing');
          const blur = fromTheme('blur');
          const brightness = fromTheme('brightness');
          const borderColor = fromTheme('borderColor');
          const borderRadius = fromTheme('borderRadius');
          const borderSpacing = fromTheme('borderSpacing');
          const borderWidth = fromTheme('borderWidth');
          const contrast = fromTheme('contrast');
          const grayscale = fromTheme('grayscale');
          const hueRotate = fromTheme('hueRotate');
          const invert = fromTheme('invert');
          const gap = fromTheme('gap');
          const gradientColorStops = fromTheme('gradientColorStops');
          const gradientColorStopPositions = fromTheme('gradientColorStopPositions');
          const inset = fromTheme('inset');
          const margin = fromTheme('margin');
          const opacity = fromTheme('opacity');
          const padding = fromTheme('padding');
          const saturate = fromTheme('saturate');
          const scale = fromTheme('scale');
          const sepia = fromTheme('sepia');
          const skew = fromTheme('skew');
          const space = fromTheme('space');
          const translate = fromTheme('translate');
          const getOverscroll = () => ['auto', 'contain', 'none'];
          const getOverflow = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'];
          const getSpacingWithAutoAndArbitrary = () => ['auto', isArbitraryValue, spacing];
          const getSpacingWithArbitrary = () => [isArbitraryValue, spacing];
          const getLengthWithEmptyAndArbitrary = () => ['', isLength, isArbitraryLength];
          const getNumberWithAutoAndArbitrary = () => ['auto', isNumber, isArbitraryValue];
          const getPositions = () => ['bottom', 'center', 'left', 'left-bottom', 'left-top', 'right', 'right-bottom', 'right-top', 'top'];
          const getLineStyles = () => ['solid', 'dashed', 'dotted', 'double', 'none'];
          const getBlendModes = () => ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
          const getAlign = () => ['start', 'end', 'center', 'between', 'around', 'evenly', 'stretch'];
          const getZeroAndEmpty = () => ['', '0', isArbitraryValue];
          const getBreaks = () => ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'];
          const getNumberAndArbitrary = () => [isNumber, isArbitraryValue];
          return {
            cacheSize: 500,
            separator: ':',
            theme: {
              colors: [isAny],
              spacing: [isLength, isArbitraryLength],
              blur: ['none', '', isTshirtSize, isArbitraryValue],
              brightness: getNumberAndArbitrary(),
              borderColor: [colors],
              borderRadius: ['none', '', 'full', isTshirtSize, isArbitraryValue],
              borderSpacing: getSpacingWithArbitrary(),
              borderWidth: getLengthWithEmptyAndArbitrary(),
              contrast: getNumberAndArbitrary(),
              grayscale: getZeroAndEmpty(),
              hueRotate: getNumberAndArbitrary(),
              invert: getZeroAndEmpty(),
              gap: getSpacingWithArbitrary(),
              gradientColorStops: [colors],
              gradientColorStopPositions: [isPercent, isArbitraryLength],
              inset: getSpacingWithAutoAndArbitrary(),
              margin: getSpacingWithAutoAndArbitrary(),
              opacity: getNumberAndArbitrary(),
              padding: getSpacingWithArbitrary(),
              saturate: getNumberAndArbitrary(),
              scale: getNumberAndArbitrary(),
              sepia: getZeroAndEmpty(),
              skew: getNumberAndArbitrary(),
              space: getSpacingWithArbitrary(),
              translate: getSpacingWithArbitrary()
            },
            classGroups: {
              // Layout
              /**
               * Aspect Ratio
               * @see https://tailwindcss.com/docs/aspect-ratio
               */
              aspect: [{
                aspect: ['auto', 'square', 'video', isArbitraryValue]
              }],
              /**
               * Container
               * @see https://tailwindcss.com/docs/container
               */
              container: ['container'],
              /**
               * Columns
               * @see https://tailwindcss.com/docs/columns
               */
              columns: [{
                columns: [isTshirtSize]
              }],
              /**
               * Break After
               * @see https://tailwindcss.com/docs/break-after
               */
              'break-after': [{
                'break-after': getBreaks()
              }],
              /**
               * Break Before
               * @see https://tailwindcss.com/docs/break-before
               */
              'break-before': [{
                'break-before': getBreaks()
              }],
              /**
               * Break Inside
               * @see https://tailwindcss.com/docs/break-inside
               */
              'break-inside': [{
                'break-inside': ['auto', 'avoid', 'avoid-page', 'avoid-column']
              }],
              /**
               * Box Decoration Break
               * @see https://tailwindcss.com/docs/box-decoration-break
               */
              'box-decoration': [{
                'box-decoration': ['slice', 'clone']
              }],
              /**
               * Box Sizing
               * @see https://tailwindcss.com/docs/box-sizing
               */
              box: [{
                box: ['border', 'content']
              }],
              /**
               * Display
               * @see https://tailwindcss.com/docs/display
               */
              display: ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'table', 'inline-table', 'table-caption', 'table-cell', 'table-column', 'table-column-group', 'table-footer-group', 'table-header-group', 'table-row-group', 'table-row', 'flow-root', 'grid', 'inline-grid', 'contents', 'list-item', 'hidden'],
              /**
               * Floats
               * @see https://tailwindcss.com/docs/float
               */
              float: [{
                float: ['right', 'left', 'none', 'start', 'end']
              }],
              /**
               * Clear
               * @see https://tailwindcss.com/docs/clear
               */
              clear: [{
                clear: ['left', 'right', 'both', 'none', 'start', 'end']
              }],
              /**
               * Isolation
               * @see https://tailwindcss.com/docs/isolation
               */
              isolation: ['isolate', 'isolation-auto'],
              /**
               * Object Fit
               * @see https://tailwindcss.com/docs/object-fit
               */
              'object-fit': [{
                object: ['contain', 'cover', 'fill', 'none', 'scale-down']
              }],
              /**
               * Object Position
               * @see https://tailwindcss.com/docs/object-position
               */
              'object-position': [{
                object: [...getPositions(), isArbitraryValue]
              }],
              /**
               * Overflow
               * @see https://tailwindcss.com/docs/overflow
               */
              overflow: [{
                overflow: getOverflow()
              }],
              /**
               * Overflow X
               * @see https://tailwindcss.com/docs/overflow
               */
              'overflow-x': [{
                'overflow-x': getOverflow()
              }],
              /**
               * Overflow Y
               * @see https://tailwindcss.com/docs/overflow
               */
              'overflow-y': [{
                'overflow-y': getOverflow()
              }],
              /**
               * Overscroll Behavior
               * @see https://tailwindcss.com/docs/overscroll-behavior
               */
              overscroll: [{
                overscroll: getOverscroll()
              }],
              /**
               * Overscroll Behavior X
               * @see https://tailwindcss.com/docs/overscroll-behavior
               */
              'overscroll-x': [{
                'overscroll-x': getOverscroll()
              }],
              /**
               * Overscroll Behavior Y
               * @see https://tailwindcss.com/docs/overscroll-behavior
               */
              'overscroll-y': [{
                'overscroll-y': getOverscroll()
              }],
              /**
               * Position
               * @see https://tailwindcss.com/docs/position
               */
              position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
              /**
               * Top / Right / Bottom / Left
               * @see https://tailwindcss.com/docs/top-right-bottom-left
               */
              inset: [{
                inset: [inset]
              }],
              /**
               * Right / Left
               * @see https://tailwindcss.com/docs/top-right-bottom-left
               */
              'inset-x': [{
                'inset-x': [inset]
              }],
              /**
               * Top / Bottom
               * @see https://tailwindcss.com/docs/top-right-bottom-left
               */
              'inset-y': [{
                'inset-y': [inset]
              }],
              /**
               * Start
               * @see https://tailwindcss.com/docs/top-right-bottom-left
               */
              start: [{
                start: [inset]
              }],
              /**
               * End
               * @see https://tailwindcss.com/docs/top-right-bottom-left
               */
              end: [{
                end: [inset]
              }],
              /**
               * Top
               * @see https://tailwindcss.com/docs/top-right-bottom-left
               */
              top: [{
                top: [inset]
              }],
              /**
               * Right
               * @see https://tailwindcss.com/docs/top-right-bottom-left
               */
              right: [{
                right: [inset]
              }],
              /**
               * Bottom
               * @see https://tailwindcss.com/docs/top-right-bottom-left
               */
              bottom: [{
                bottom: [inset]
              }],
              /**
               * Left
               * @see https://tailwindcss.com/docs/top-right-bottom-left
               */
              left: [{
                left: [inset]
              }],
              /**
               * Visibility
               * @see https://tailwindcss.com/docs/visibility
               */
              visibility: ['visible', 'invisible', 'collapse'],
              /**
               * Z-Index
               * @see https://tailwindcss.com/docs/z-index
               */
              z: [{
                z: ['auto', isInteger, isArbitraryValue]
              }],
              // Flexbox and Grid
              /**
               * Flex Basis
               * @see https://tailwindcss.com/docs/flex-basis
               */
              basis: [{
                basis: getSpacingWithAutoAndArbitrary()
              }],
              /**
               * Flex Direction
               * @see https://tailwindcss.com/docs/flex-direction
               */
              'flex-direction': [{
                flex: ['row', 'row-reverse', 'col', 'col-reverse']
              }],
              /**
               * Flex Wrap
               * @see https://tailwindcss.com/docs/flex-wrap
               */
              'flex-wrap': [{
                flex: ['wrap', 'wrap-reverse', 'nowrap']
              }],
              /**
               * Flex
               * @see https://tailwindcss.com/docs/flex
               */
              flex: [{
                flex: ['1', 'auto', 'initial', 'none', isArbitraryValue]
              }],
              /**
               * Flex Grow
               * @see https://tailwindcss.com/docs/flex-grow
               */
              grow: [{
                grow: getZeroAndEmpty()
              }],
              /**
               * Flex Shrink
               * @see https://tailwindcss.com/docs/flex-shrink
               */
              shrink: [{
                shrink: getZeroAndEmpty()
              }],
              /**
               * Order
               * @see https://tailwindcss.com/docs/order
               */
              order: [{
                order: ['first', 'last', 'none', isInteger, isArbitraryValue]
              }],
              /**
               * Grid Template Columns
               * @see https://tailwindcss.com/docs/grid-template-columns
               */
              'grid-cols': [{
                'grid-cols': [isAny]
              }],
              /**
               * Grid Column Start / End
               * @see https://tailwindcss.com/docs/grid-column
               */
              'col-start-end': [{
                col: ['auto', {
                  span: ['full', isInteger, isArbitraryValue]
                }, isArbitraryValue]
              }],
              /**
               * Grid Column Start
               * @see https://tailwindcss.com/docs/grid-column
               */
              'col-start': [{
                'col-start': getNumberWithAutoAndArbitrary()
              }],
              /**
               * Grid Column End
               * @see https://tailwindcss.com/docs/grid-column
               */
              'col-end': [{
                'col-end': getNumberWithAutoAndArbitrary()
              }],
              /**
               * Grid Template Rows
               * @see https://tailwindcss.com/docs/grid-template-rows
               */
              'grid-rows': [{
                'grid-rows': [isAny]
              }],
              /**
               * Grid Row Start / End
               * @see https://tailwindcss.com/docs/grid-row
               */
              'row-start-end': [{
                row: ['auto', {
                  span: [isInteger, isArbitraryValue]
                }, isArbitraryValue]
              }],
              /**
               * Grid Row Start
               * @see https://tailwindcss.com/docs/grid-row
               */
              'row-start': [{
                'row-start': getNumberWithAutoAndArbitrary()
              }],
              /**
               * Grid Row End
               * @see https://tailwindcss.com/docs/grid-row
               */
              'row-end': [{
                'row-end': getNumberWithAutoAndArbitrary()
              }],
              /**
               * Grid Auto Flow
               * @see https://tailwindcss.com/docs/grid-auto-flow
               */
              'grid-flow': [{
                'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense']
              }],
              /**
               * Grid Auto Columns
               * @see https://tailwindcss.com/docs/grid-auto-columns
               */
              'auto-cols': [{
                'auto-cols': ['auto', 'min', 'max', 'fr', isArbitraryValue]
              }],
              /**
               * Grid Auto Rows
               * @see https://tailwindcss.com/docs/grid-auto-rows
               */
              'auto-rows': [{
                'auto-rows': ['auto', 'min', 'max', 'fr', isArbitraryValue]
              }],
              /**
               * Gap
               * @see https://tailwindcss.com/docs/gap
               */
              gap: [{
                gap: [gap]
              }],
              /**
               * Gap X
               * @see https://tailwindcss.com/docs/gap
               */
              'gap-x': [{
                'gap-x': [gap]
              }],
              /**
               * Gap Y
               * @see https://tailwindcss.com/docs/gap
               */
              'gap-y': [{
                'gap-y': [gap]
              }],
              /**
               * Justify Content
               * @see https://tailwindcss.com/docs/justify-content
               */
              'justify-content': [{
                justify: ['normal', ...getAlign()]
              }],
              /**
               * Justify Items
               * @see https://tailwindcss.com/docs/justify-items
               */
              'justify-items': [{
                'justify-items': ['start', 'end', 'center', 'stretch']
              }],
              /**
               * Justify Self
               * @see https://tailwindcss.com/docs/justify-self
               */
              'justify-self': [{
                'justify-self': ['auto', 'start', 'end', 'center', 'stretch']
              }],
              /**
               * Align Content
               * @see https://tailwindcss.com/docs/align-content
               */
              'align-content': [{
                content: ['normal', ...getAlign(), 'baseline']
              }],
              /**
               * Align Items
               * @see https://tailwindcss.com/docs/align-items
               */
              'align-items': [{
                items: ['start', 'end', 'center', 'baseline', 'stretch']
              }],
              /**
               * Align Self
               * @see https://tailwindcss.com/docs/align-self
               */
              'align-self': [{
                self: ['auto', 'start', 'end', 'center', 'stretch', 'baseline']
              }],
              /**
               * Place Content
               * @see https://tailwindcss.com/docs/place-content
               */
              'place-content': [{
                'place-content': [...getAlign(), 'baseline']
              }],
              /**
               * Place Items
               * @see https://tailwindcss.com/docs/place-items
               */
              'place-items': [{
                'place-items': ['start', 'end', 'center', 'baseline', 'stretch']
              }],
              /**
               * Place Self
               * @see https://tailwindcss.com/docs/place-self
               */
              'place-self': [{
                'place-self': ['auto', 'start', 'end', 'center', 'stretch']
              }],
              // Spacing
              /**
               * Padding
               * @see https://tailwindcss.com/docs/padding
               */
              p: [{
                p: [padding]
              }],
              /**
               * Padding X
               * @see https://tailwindcss.com/docs/padding
               */
              px: [{
                px: [padding]
              }],
              /**
               * Padding Y
               * @see https://tailwindcss.com/docs/padding
               */
              py: [{
                py: [padding]
              }],
              /**
               * Padding Start
               * @see https://tailwindcss.com/docs/padding
               */
              ps: [{
                ps: [padding]
              }],
              /**
               * Padding End
               * @see https://tailwindcss.com/docs/padding
               */
              pe: [{
                pe: [padding]
              }],
              /**
               * Padding Top
               * @see https://tailwindcss.com/docs/padding
               */
              pt: [{
                pt: [padding]
              }],
              /**
               * Padding Right
               * @see https://tailwindcss.com/docs/padding
               */
              pr: [{
                pr: [padding]
              }],
              /**
               * Padding Bottom
               * @see https://tailwindcss.com/docs/padding
               */
              pb: [{
                pb: [padding]
              }],
              /**
               * Padding Left
               * @see https://tailwindcss.com/docs/padding
               */
              pl: [{
                pl: [padding]
              }],
              /**
               * Margin
               * @see https://tailwindcss.com/docs/margin
               */
              m: [{
                m: [margin]
              }],
              /**
               * Margin X
               * @see https://tailwindcss.com/docs/margin
               */
              mx: [{
                mx: [margin]
              }],
              /**
               * Margin Y
               * @see https://tailwindcss.com/docs/margin
               */
              my: [{
                my: [margin]
              }],
              /**
               * Margin Start
               * @see https://tailwindcss.com/docs/margin
               */
              ms: [{
                ms: [margin]
              }],
              /**
               * Margin End
               * @see https://tailwindcss.com/docs/margin
               */
              me: [{
                me: [margin]
              }],
              /**
               * Margin Top
               * @see https://tailwindcss.com/docs/margin
               */
              mt: [{
                mt: [margin]
              }],
              /**
               * Margin Right
               * @see https://tailwindcss.com/docs/margin
               */
              mr: [{
                mr: [margin]
              }],
              /**
               * Margin Bottom
               * @see https://tailwindcss.com/docs/margin
               */
              mb: [{
                mb: [margin]
              }],
              /**
               * Margin Left
               * @see https://tailwindcss.com/docs/margin
               */
              ml: [{
                ml: [margin]
              }],
              /**
               * Space Between X
               * @see https://tailwindcss.com/docs/space
               */
              'space-x': [{
                'space-x': [space]
              }],
              /**
               * Space Between X Reverse
               * @see https://tailwindcss.com/docs/space
               */
              'space-x-reverse': ['space-x-reverse'],
              /**
               * Space Between Y
               * @see https://tailwindcss.com/docs/space
               */
              'space-y': [{
                'space-y': [space]
              }],
              /**
               * Space Between Y Reverse
               * @see https://tailwindcss.com/docs/space
               */
              'space-y-reverse': ['space-y-reverse'],
              // Sizing
              /**
               * Width
               * @see https://tailwindcss.com/docs/width
               */
              w: [{
                w: ['auto', 'min', 'max', 'fit', 'svw', 'lvw', 'dvw', isArbitraryValue, spacing]
              }],
              /**
               * Min-Width
               * @see https://tailwindcss.com/docs/min-width
               */
              'min-w': [{
                'min-w': [isArbitraryValue, spacing, 'min', 'max', 'fit']
              }],
              /**
               * Max-Width
               * @see https://tailwindcss.com/docs/max-width
               */
              'max-w': [{
                'max-w': [isArbitraryValue, spacing, 'none', 'full', 'min', 'max', 'fit', 'prose', {
                  screen: [isTshirtSize]
                }, isTshirtSize]
              }],
              /**
               * Height
               * @see https://tailwindcss.com/docs/height
               */
              h: [{
                h: [isArbitraryValue, spacing, 'auto', 'min', 'max', 'fit', 'svh', 'lvh', 'dvh']
              }],
              /**
               * Min-Height
               * @see https://tailwindcss.com/docs/min-height
               */
              'min-h': [{
                'min-h': [isArbitraryValue, spacing, 'min', 'max', 'fit', 'svh', 'lvh', 'dvh']
              }],
              /**
               * Max-Height
               * @see https://tailwindcss.com/docs/max-height
               */
              'max-h': [{
                'max-h': [isArbitraryValue, spacing, 'min', 'max', 'fit', 'svh', 'lvh', 'dvh']
              }],
              /**
               * Size
               * @see https://tailwindcss.com/docs/size
               */
              size: [{
                size: [isArbitraryValue, spacing, 'auto', 'min', 'max', 'fit']
              }],
              // Typography
              /**
               * Font Size
               * @see https://tailwindcss.com/docs/font-size
               */
              'font-size': [{
                text: ['base', isTshirtSize, isArbitraryLength]
              }],
              /**
               * Font Smoothing
               * @see https://tailwindcss.com/docs/font-smoothing
               */
              'font-smoothing': ['antialiased', 'subpixel-antialiased'],
              /**
               * Font Style
               * @see https://tailwindcss.com/docs/font-style
               */
              'font-style': ['italic', 'not-italic'],
              /**
               * Font Weight
               * @see https://tailwindcss.com/docs/font-weight
               */
              'font-weight': [{
                font: ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black', isArbitraryNumber]
              }],
              /**
               * Font Family
               * @see https://tailwindcss.com/docs/font-family
               */
              'font-family': [{
                font: [isAny]
              }],
              /**
               * Font Variant Numeric
               * @see https://tailwindcss.com/docs/font-variant-numeric
               */
              'fvn-normal': ['normal-nums'],
              /**
               * Font Variant Numeric
               * @see https://tailwindcss.com/docs/font-variant-numeric
               */
              'fvn-ordinal': ['ordinal'],
              /**
               * Font Variant Numeric
               * @see https://tailwindcss.com/docs/font-variant-numeric
               */
              'fvn-slashed-zero': ['slashed-zero'],
              /**
               * Font Variant Numeric
               * @see https://tailwindcss.com/docs/font-variant-numeric
               */
              'fvn-figure': ['lining-nums', 'oldstyle-nums'],
              /**
               * Font Variant Numeric
               * @see https://tailwindcss.com/docs/font-variant-numeric
               */
              'fvn-spacing': ['proportional-nums', 'tabular-nums'],
              /**
               * Font Variant Numeric
               * @see https://tailwindcss.com/docs/font-variant-numeric
               */
              'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
              /**
               * Letter Spacing
               * @see https://tailwindcss.com/docs/letter-spacing
               */
              tracking: [{
                tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest', isArbitraryValue]
              }],
              /**
               * Line Clamp
               * @see https://tailwindcss.com/docs/line-clamp
               */
              'line-clamp': [{
                'line-clamp': ['none', isNumber, isArbitraryNumber]
              }],
              /**
               * Line Height
               * @see https://tailwindcss.com/docs/line-height
               */
              leading: [{
                leading: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose', isLength, isArbitraryValue]
              }],
              /**
               * List Style Image
               * @see https://tailwindcss.com/docs/list-style-image
               */
              'list-image': [{
                'list-image': ['none', isArbitraryValue]
              }],
              /**
               * List Style Type
               * @see https://tailwindcss.com/docs/list-style-type
               */
              'list-style-type': [{
                list: ['none', 'disc', 'decimal', isArbitraryValue]
              }],
              /**
               * List Style Position
               * @see https://tailwindcss.com/docs/list-style-position
               */
              'list-style-position': [{
                list: ['inside', 'outside']
              }],
              /**
               * Placeholder Color
               * @deprecated since Tailwind CSS v3.0.0
               * @see https://tailwindcss.com/docs/placeholder-color
               */
              'placeholder-color': [{
                placeholder: [colors]
              }],
              /**
               * Placeholder Opacity
               * @see https://tailwindcss.com/docs/placeholder-opacity
               */
              'placeholder-opacity': [{
                'placeholder-opacity': [opacity]
              }],
              /**
               * Text Alignment
               * @see https://tailwindcss.com/docs/text-align
               */
              'text-alignment': [{
                text: ['left', 'center', 'right', 'justify', 'start', 'end']
              }],
              /**
               * Text Color
               * @see https://tailwindcss.com/docs/text-color
               */
              'text-color': [{
                text: [colors]
              }],
              /**
               * Text Opacity
               * @see https://tailwindcss.com/docs/text-opacity
               */
              'text-opacity': [{
                'text-opacity': [opacity]
              }],
              /**
               * Text Decoration
               * @see https://tailwindcss.com/docs/text-decoration
               */
              'text-decoration': ['underline', 'overline', 'line-through', 'no-underline'],
              /**
               * Text Decoration Style
               * @see https://tailwindcss.com/docs/text-decoration-style
               */
              'text-decoration-style': [{
                decoration: [...getLineStyles(), 'wavy']
              }],
              /**
               * Text Decoration Thickness
               * @see https://tailwindcss.com/docs/text-decoration-thickness
               */
              'text-decoration-thickness': [{
                decoration: ['auto', 'from-font', isLength, isArbitraryLength]
              }],
              /**
               * Text Underline Offset
               * @see https://tailwindcss.com/docs/text-underline-offset
               */
              'underline-offset': [{
                'underline-offset': ['auto', isLength, isArbitraryValue]
              }],
              /**
               * Text Decoration Color
               * @see https://tailwindcss.com/docs/text-decoration-color
               */
              'text-decoration-color': [{
                decoration: [colors]
              }],
              /**
               * Text Transform
               * @see https://tailwindcss.com/docs/text-transform
               */
              'text-transform': ['uppercase', 'lowercase', 'capitalize', 'normal-case'],
              /**
               * Text Overflow
               * @see https://tailwindcss.com/docs/text-overflow
               */
              'text-overflow': ['truncate', 'text-ellipsis', 'text-clip'],
              /**
               * Text Wrap
               * @see https://tailwindcss.com/docs/text-wrap
               */
              'text-wrap': [{
                text: ['wrap', 'nowrap', 'balance', 'pretty']
              }],
              /**
               * Text Indent
               * @see https://tailwindcss.com/docs/text-indent
               */
              indent: [{
                indent: getSpacingWithArbitrary()
              }],
              /**
               * Vertical Alignment
               * @see https://tailwindcss.com/docs/vertical-align
               */
              'vertical-align': [{
                align: ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom', 'sub', 'super', isArbitraryValue]
              }],
              /**
               * Whitespace
               * @see https://tailwindcss.com/docs/whitespace
               */
              whitespace: [{
                whitespace: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces']
              }],
              /**
               * Word Break
               * @see https://tailwindcss.com/docs/word-break
               */
              break: [{
                break: ['normal', 'words', 'all', 'keep']
              }],
              /**
               * Hyphens
               * @see https://tailwindcss.com/docs/hyphens
               */
              hyphens: [{
                hyphens: ['none', 'manual', 'auto']
              }],
              /**
               * Content
               * @see https://tailwindcss.com/docs/content
               */
              content: [{
                content: ['none', isArbitraryValue]
              }],
              // Backgrounds
              /**
               * Background Attachment
               * @see https://tailwindcss.com/docs/background-attachment
               */
              'bg-attachment': [{
                bg: ['fixed', 'local', 'scroll']
              }],
              /**
               * Background Clip
               * @see https://tailwindcss.com/docs/background-clip
               */
              'bg-clip': [{
                'bg-clip': ['border', 'padding', 'content', 'text']
              }],
              /**
               * Background Opacity
               * @deprecated since Tailwind CSS v3.0.0
               * @see https://tailwindcss.com/docs/background-opacity
               */
              'bg-opacity': [{
                'bg-opacity': [opacity]
              }],
              /**
               * Background Origin
               * @see https://tailwindcss.com/docs/background-origin
               */
              'bg-origin': [{
                'bg-origin': ['border', 'padding', 'content']
              }],
              /**
               * Background Position
               * @see https://tailwindcss.com/docs/background-position
               */
              'bg-position': [{
                bg: [...getPositions(), isArbitraryPosition]
              }],
              /**
               * Background Repeat
               * @see https://tailwindcss.com/docs/background-repeat
               */
              'bg-repeat': [{
                bg: ['no-repeat', {
                  repeat: ['', 'x', 'y', 'round', 'space']
                }]
              }],
              /**
               * Background Size
               * @see https://tailwindcss.com/docs/background-size
               */
              'bg-size': [{
                bg: ['auto', 'cover', 'contain', isArbitrarySize]
              }],
              /**
               * Background Image
               * @see https://tailwindcss.com/docs/background-image
               */
              'bg-image': [{
                bg: ['none', {
                  'gradient-to': ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl']
                }, isArbitraryImage]
              }],
              /**
               * Background Color
               * @see https://tailwindcss.com/docs/background-color
               */
              'bg-color': [{
                bg: [colors]
              }],
              /**
               * Gradient Color Stops From Position
               * @see https://tailwindcss.com/docs/gradient-color-stops
               */
              'gradient-from-pos': [{
                from: [gradientColorStopPositions]
              }],
              /**
               * Gradient Color Stops Via Position
               * @see https://tailwindcss.com/docs/gradient-color-stops
               */
              'gradient-via-pos': [{
                via: [gradientColorStopPositions]
              }],
              /**
               * Gradient Color Stops To Position
               * @see https://tailwindcss.com/docs/gradient-color-stops
               */
              'gradient-to-pos': [{
                to: [gradientColorStopPositions]
              }],
              /**
               * Gradient Color Stops From
               * @see https://tailwindcss.com/docs/gradient-color-stops
               */
              'gradient-from': [{
                from: [gradientColorStops]
              }],
              /**
               * Gradient Color Stops Via
               * @see https://tailwindcss.com/docs/gradient-color-stops
               */
              'gradient-via': [{
                via: [gradientColorStops]
              }],
              /**
               * Gradient Color Stops To
               * @see https://tailwindcss.com/docs/gradient-color-stops
               */
              'gradient-to': [{
                to: [gradientColorStops]
              }],
              // Borders
              /**
               * Border Radius
               * @see https://tailwindcss.com/docs/border-radius
               */
              rounded: [{
                rounded: [borderRadius]
              }],
              /**
               * Border Radius Start
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-s': [{
                'rounded-s': [borderRadius]
              }],
              /**
               * Border Radius End
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-e': [{
                'rounded-e': [borderRadius]
              }],
              /**
               * Border Radius Top
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-t': [{
                'rounded-t': [borderRadius]
              }],
              /**
               * Border Radius Right
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-r': [{
                'rounded-r': [borderRadius]
              }],
              /**
               * Border Radius Bottom
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-b': [{
                'rounded-b': [borderRadius]
              }],
              /**
               * Border Radius Left
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-l': [{
                'rounded-l': [borderRadius]
              }],
              /**
               * Border Radius Start Start
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-ss': [{
                'rounded-ss': [borderRadius]
              }],
              /**
               * Border Radius Start End
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-se': [{
                'rounded-se': [borderRadius]
              }],
              /**
               * Border Radius End End
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-ee': [{
                'rounded-ee': [borderRadius]
              }],
              /**
               * Border Radius End Start
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-es': [{
                'rounded-es': [borderRadius]
              }],
              /**
               * Border Radius Top Left
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-tl': [{
                'rounded-tl': [borderRadius]
              }],
              /**
               * Border Radius Top Right
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-tr': [{
                'rounded-tr': [borderRadius]
              }],
              /**
               * Border Radius Bottom Right
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-br': [{
                'rounded-br': [borderRadius]
              }],
              /**
               * Border Radius Bottom Left
               * @see https://tailwindcss.com/docs/border-radius
               */
              'rounded-bl': [{
                'rounded-bl': [borderRadius]
              }],
              /**
               * Border Width
               * @see https://tailwindcss.com/docs/border-width
               */
              'border-w': [{
                border: [borderWidth]
              }],
              /**
               * Border Width X
               * @see https://tailwindcss.com/docs/border-width
               */
              'border-w-x': [{
                'border-x': [borderWidth]
              }],
              /**
               * Border Width Y
               * @see https://tailwindcss.com/docs/border-width
               */
              'border-w-y': [{
                'border-y': [borderWidth]
              }],
              /**
               * Border Width Start
               * @see https://tailwindcss.com/docs/border-width
               */
              'border-w-s': [{
                'border-s': [borderWidth]
              }],
              /**
               * Border Width End
               * @see https://tailwindcss.com/docs/border-width
               */
              'border-w-e': [{
                'border-e': [borderWidth]
              }],
              /**
               * Border Width Top
               * @see https://tailwindcss.com/docs/border-width
               */
              'border-w-t': [{
                'border-t': [borderWidth]
              }],
              /**
               * Border Width Right
               * @see https://tailwindcss.com/docs/border-width
               */
              'border-w-r': [{
                'border-r': [borderWidth]
              }],
              /**
               * Border Width Bottom
               * @see https://tailwindcss.com/docs/border-width
               */
              'border-w-b': [{
                'border-b': [borderWidth]
              }],
              /**
               * Border Width Left
               * @see https://tailwindcss.com/docs/border-width
               */
              'border-w-l': [{
                'border-l': [borderWidth]
              }],
              /**
               * Border Opacity
               * @see https://tailwindcss.com/docs/border-opacity
               */
              'border-opacity': [{
                'border-opacity': [opacity]
              }],
              /**
               * Border Style
               * @see https://tailwindcss.com/docs/border-style
               */
              'border-style': [{
                border: [...getLineStyles(), 'hidden']
              }],
              /**
               * Divide Width X
               * @see https://tailwindcss.com/docs/divide-width
               */
              'divide-x': [{
                'divide-x': [borderWidth]
              }],
              /**
               * Divide Width X Reverse
               * @see https://tailwindcss.com/docs/divide-width
               */
              'divide-x-reverse': ['divide-x-reverse'],
              /**
               * Divide Width Y
               * @see https://tailwindcss.com/docs/divide-width
               */
              'divide-y': [{
                'divide-y': [borderWidth]
              }],
              /**
               * Divide Width Y Reverse
               * @see https://tailwindcss.com/docs/divide-width
               */
              'divide-y-reverse': ['divide-y-reverse'],
              /**
               * Divide Opacity
               * @see https://tailwindcss.com/docs/divide-opacity
               */
              'divide-opacity': [{
                'divide-opacity': [opacity]
              }],
              /**
               * Divide Style
               * @see https://tailwindcss.com/docs/divide-style
               */
              'divide-style': [{
                divide: getLineStyles()
              }],
              /**
               * Border Color
               * @see https://tailwindcss.com/docs/border-color
               */
              'border-color': [{
                border: [borderColor]
              }],
              /**
               * Border Color X
               * @see https://tailwindcss.com/docs/border-color
               */
              'border-color-x': [{
                'border-x': [borderColor]
              }],
              /**
               * Border Color Y
               * @see https://tailwindcss.com/docs/border-color
               */
              'border-color-y': [{
                'border-y': [borderColor]
              }],
              /**
               * Border Color S
               * @see https://tailwindcss.com/docs/border-color
               */
              'border-color-s': [{
                'border-s': [borderColor]
              }],
              /**
               * Border Color E
               * @see https://tailwindcss.com/docs/border-color
               */
              'border-color-e': [{
                'border-e': [borderColor]
              }],
              /**
               * Border Color Top
               * @see https://tailwindcss.com/docs/border-color
               */
              'border-color-t': [{
                'border-t': [borderColor]
              }],
              /**
               * Border Color Right
               * @see https://tailwindcss.com/docs/border-color
               */
              'border-color-r': [{
                'border-r': [borderColor]
              }],
              /**
               * Border Color Bottom
               * @see https://tailwindcss.com/docs/border-color
               */
              'border-color-b': [{
                'border-b': [borderColor]
              }],
              /**
               * Border Color Left
               * @see https://tailwindcss.com/docs/border-color
               */
              'border-color-l': [{
                'border-l': [borderColor]
              }],
              /**
               * Divide Color
               * @see https://tailwindcss.com/docs/divide-color
               */
              'divide-color': [{
                divide: [borderColor]
              }],
              /**
               * Outline Style
               * @see https://tailwindcss.com/docs/outline-style
               */
              'outline-style': [{
                outline: ['', ...getLineStyles()]
              }],
              /**
               * Outline Offset
               * @see https://tailwindcss.com/docs/outline-offset
               */
              'outline-offset': [{
                'outline-offset': [isLength, isArbitraryValue]
              }],
              /**
               * Outline Width
               * @see https://tailwindcss.com/docs/outline-width
               */
              'outline-w': [{
                outline: [isLength, isArbitraryLength]
              }],
              /**
               * Outline Color
               * @see https://tailwindcss.com/docs/outline-color
               */
              'outline-color': [{
                outline: [colors]
              }],
              /**
               * Ring Width
               * @see https://tailwindcss.com/docs/ring-width
               */
              'ring-w': [{
                ring: getLengthWithEmptyAndArbitrary()
              }],
              /**
               * Ring Width Inset
               * @see https://tailwindcss.com/docs/ring-width
               */
              'ring-w-inset': ['ring-inset'],
              /**
               * Ring Color
               * @see https://tailwindcss.com/docs/ring-color
               */
              'ring-color': [{
                ring: [colors]
              }],
              /**
               * Ring Opacity
               * @see https://tailwindcss.com/docs/ring-opacity
               */
              'ring-opacity': [{
                'ring-opacity': [opacity]
              }],
              /**
               * Ring Offset Width
               * @see https://tailwindcss.com/docs/ring-offset-width
               */
              'ring-offset-w': [{
                'ring-offset': [isLength, isArbitraryLength]
              }],
              /**
               * Ring Offset Color
               * @see https://tailwindcss.com/docs/ring-offset-color
               */
              'ring-offset-color': [{
                'ring-offset': [colors]
              }],
              // Effects
              /**
               * Box Shadow
               * @see https://tailwindcss.com/docs/box-shadow
               */
              shadow: [{
                shadow: ['', 'inner', 'none', isTshirtSize, isArbitraryShadow]
              }],
              /**
               * Box Shadow Color
               * @see https://tailwindcss.com/docs/box-shadow-color
               */
              'shadow-color': [{
                shadow: [isAny]
              }],
              /**
               * Opacity
               * @see https://tailwindcss.com/docs/opacity
               */
              opacity: [{
                opacity: [opacity]
              }],
              /**
               * Mix Blend Mode
               * @see https://tailwindcss.com/docs/mix-blend-mode
               */
              'mix-blend': [{
                'mix-blend': [...getBlendModes(), 'plus-lighter', 'plus-darker']
              }],
              /**
               * Background Blend Mode
               * @see https://tailwindcss.com/docs/background-blend-mode
               */
              'bg-blend': [{
                'bg-blend': getBlendModes()
              }],
              // Filters
              /**
               * Filter
               * @deprecated since Tailwind CSS v3.0.0
               * @see https://tailwindcss.com/docs/filter
               */
              filter: [{
                filter: ['', 'none']
              }],
              /**
               * Blur
               * @see https://tailwindcss.com/docs/blur
               */
              blur: [{
                blur: [blur]
              }],
              /**
               * Brightness
               * @see https://tailwindcss.com/docs/brightness
               */
              brightness: [{
                brightness: [brightness]
              }],
              /**
               * Contrast
               * @see https://tailwindcss.com/docs/contrast
               */
              contrast: [{
                contrast: [contrast]
              }],
              /**
               * Drop Shadow
               * @see https://tailwindcss.com/docs/drop-shadow
               */
              'drop-shadow': [{
                'drop-shadow': ['', 'none', isTshirtSize, isArbitraryValue]
              }],
              /**
               * Grayscale
               * @see https://tailwindcss.com/docs/grayscale
               */
              grayscale: [{
                grayscale: [grayscale]
              }],
              /**
               * Hue Rotate
               * @see https://tailwindcss.com/docs/hue-rotate
               */
              'hue-rotate': [{
                'hue-rotate': [hueRotate]
              }],
              /**
               * Invert
               * @see https://tailwindcss.com/docs/invert
               */
              invert: [{
                invert: [invert]
              }],
              /**
               * Saturate
               * @see https://tailwindcss.com/docs/saturate
               */
              saturate: [{
                saturate: [saturate]
              }],
              /**
               * Sepia
               * @see https://tailwindcss.com/docs/sepia
               */
              sepia: [{
                sepia: [sepia]
              }],
              /**
               * Backdrop Filter
               * @deprecated since Tailwind CSS v3.0.0
               * @see https://tailwindcss.com/docs/backdrop-filter
               */
              'backdrop-filter': [{
                'backdrop-filter': ['', 'none']
              }],
              /**
               * Backdrop Blur
               * @see https://tailwindcss.com/docs/backdrop-blur
               */
              'backdrop-blur': [{
                'backdrop-blur': [blur]
              }],
              /**
               * Backdrop Brightness
               * @see https://tailwindcss.com/docs/backdrop-brightness
               */
              'backdrop-brightness': [{
                'backdrop-brightness': [brightness]
              }],
              /**
               * Backdrop Contrast
               * @see https://tailwindcss.com/docs/backdrop-contrast
               */
              'backdrop-contrast': [{
                'backdrop-contrast': [contrast]
              }],
              /**
               * Backdrop Grayscale
               * @see https://tailwindcss.com/docs/backdrop-grayscale
               */
              'backdrop-grayscale': [{
                'backdrop-grayscale': [grayscale]
              }],
              /**
               * Backdrop Hue Rotate
               * @see https://tailwindcss.com/docs/backdrop-hue-rotate
               */
              'backdrop-hue-rotate': [{
                'backdrop-hue-rotate': [hueRotate]
              }],
              /**
               * Backdrop Invert
               * @see https://tailwindcss.com/docs/backdrop-invert
               */
              'backdrop-invert': [{
                'backdrop-invert': [invert]
              }],
              /**
               * Backdrop Opacity
               * @see https://tailwindcss.com/docs/backdrop-opacity
               */
              'backdrop-opacity': [{
                'backdrop-opacity': [opacity]
              }],
              /**
               * Backdrop Saturate
               * @see https://tailwindcss.com/docs/backdrop-saturate
               */
              'backdrop-saturate': [{
                'backdrop-saturate': [saturate]
              }],
              /**
               * Backdrop Sepia
               * @see https://tailwindcss.com/docs/backdrop-sepia
               */
              'backdrop-sepia': [{
                'backdrop-sepia': [sepia]
              }],
              // Tables
              /**
               * Border Collapse
               * @see https://tailwindcss.com/docs/border-collapse
               */
              'border-collapse': [{
                border: ['collapse', 'separate']
              }],
              /**
               * Border Spacing
               * @see https://tailwindcss.com/docs/border-spacing
               */
              'border-spacing': [{
                'border-spacing': [borderSpacing]
              }],
              /**
               * Border Spacing X
               * @see https://tailwindcss.com/docs/border-spacing
               */
              'border-spacing-x': [{
                'border-spacing-x': [borderSpacing]
              }],
              /**
               * Border Spacing Y
               * @see https://tailwindcss.com/docs/border-spacing
               */
              'border-spacing-y': [{
                'border-spacing-y': [borderSpacing]
              }],
              /**
               * Table Layout
               * @see https://tailwindcss.com/docs/table-layout
               */
              'table-layout': [{
                table: ['auto', 'fixed']
              }],
              /**
               * Caption Side
               * @see https://tailwindcss.com/docs/caption-side
               */
              caption: [{
                caption: ['top', 'bottom']
              }],
              // Transitions and Animation
              /**
               * Tranisition Property
               * @see https://tailwindcss.com/docs/transition-property
               */
              transition: [{
                transition: ['none', 'all', '', 'colors', 'opacity', 'shadow', 'transform', isArbitraryValue]
              }],
              /**
               * Transition Duration
               * @see https://tailwindcss.com/docs/transition-duration
               */
              duration: [{
                duration: getNumberAndArbitrary()
              }],
              /**
               * Transition Timing Function
               * @see https://tailwindcss.com/docs/transition-timing-function
               */
              ease: [{
                ease: ['linear', 'in', 'out', 'in-out', isArbitraryValue]
              }],
              /**
               * Transition Delay
               * @see https://tailwindcss.com/docs/transition-delay
               */
              delay: [{
                delay: getNumberAndArbitrary()
              }],
              /**
               * Animation
               * @see https://tailwindcss.com/docs/animation
               */
              animate: [{
                animate: ['none', 'spin', 'ping', 'pulse', 'bounce', isArbitraryValue]
              }],
              // Transforms
              /**
               * Transform
               * @see https://tailwindcss.com/docs/transform
               */
              transform: [{
                transform: ['', 'gpu', 'none']
              }],
              /**
               * Scale
               * @see https://tailwindcss.com/docs/scale
               */
              scale: [{
                scale: [scale]
              }],
              /**
               * Scale X
               * @see https://tailwindcss.com/docs/scale
               */
              'scale-x': [{
                'scale-x': [scale]
              }],
              /**
               * Scale Y
               * @see https://tailwindcss.com/docs/scale
               */
              'scale-y': [{
                'scale-y': [scale]
              }],
              /**
               * Rotate
               * @see https://tailwindcss.com/docs/rotate
               */
              rotate: [{
                rotate: [isInteger, isArbitraryValue]
              }],
              /**
               * Translate X
               * @see https://tailwindcss.com/docs/translate
               */
              'translate-x': [{
                'translate-x': [translate]
              }],
              /**
               * Translate Y
               * @see https://tailwindcss.com/docs/translate
               */
              'translate-y': [{
                'translate-y': [translate]
              }],
              /**
               * Skew X
               * @see https://tailwindcss.com/docs/skew
               */
              'skew-x': [{
                'skew-x': [skew]
              }],
              /**
               * Skew Y
               * @see https://tailwindcss.com/docs/skew
               */
              'skew-y': [{
                'skew-y': [skew]
              }],
              /**
               * Transform Origin
               * @see https://tailwindcss.com/docs/transform-origin
               */
              'transform-origin': [{
                origin: ['center', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left', isArbitraryValue]
              }],
              // Interactivity
              /**
               * Accent Color
               * @see https://tailwindcss.com/docs/accent-color
               */
              accent: [{
                accent: ['auto', colors]
              }],
              /**
               * Appearance
               * @see https://tailwindcss.com/docs/appearance
               */
              appearance: [{
                appearance: ['none', 'auto']
              }],
              /**
               * Cursor
               * @see https://tailwindcss.com/docs/cursor
               */
              cursor: [{
                cursor: ['auto', 'default', 'pointer', 'wait', 'text', 'move', 'help', 'not-allowed', 'none', 'context-menu', 'progress', 'cell', 'crosshair', 'vertical-text', 'alias', 'copy', 'no-drop', 'grab', 'grabbing', 'all-scroll', 'col-resize', 'row-resize', 'n-resize', 'e-resize', 's-resize', 'w-resize', 'ne-resize', 'nw-resize', 'se-resize', 'sw-resize', 'ew-resize', 'ns-resize', 'nesw-resize', 'nwse-resize', 'zoom-in', 'zoom-out', isArbitraryValue]
              }],
              /**
               * Caret Color
               * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
               */
              'caret-color': [{
                caret: [colors]
              }],
              /**
               * Pointer Events
               * @see https://tailwindcss.com/docs/pointer-events
               */
              'pointer-events': [{
                'pointer-events': ['none', 'auto']
              }],
              /**
               * Resize
               * @see https://tailwindcss.com/docs/resize
               */
              resize: [{
                resize: ['none', 'y', 'x', '']
              }],
              /**
               * Scroll Behavior
               * @see https://tailwindcss.com/docs/scroll-behavior
               */
              'scroll-behavior': [{
                scroll: ['auto', 'smooth']
              }],
              /**
               * Scroll Margin
               * @see https://tailwindcss.com/docs/scroll-margin
               */
              'scroll-m': [{
                'scroll-m': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Margin X
               * @see https://tailwindcss.com/docs/scroll-margin
               */
              'scroll-mx': [{
                'scroll-mx': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Margin Y
               * @see https://tailwindcss.com/docs/scroll-margin
               */
              'scroll-my': [{
                'scroll-my': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Margin Start
               * @see https://tailwindcss.com/docs/scroll-margin
               */
              'scroll-ms': [{
                'scroll-ms': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Margin End
               * @see https://tailwindcss.com/docs/scroll-margin
               */
              'scroll-me': [{
                'scroll-me': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Margin Top
               * @see https://tailwindcss.com/docs/scroll-margin
               */
              'scroll-mt': [{
                'scroll-mt': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Margin Right
               * @see https://tailwindcss.com/docs/scroll-margin
               */
              'scroll-mr': [{
                'scroll-mr': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Margin Bottom
               * @see https://tailwindcss.com/docs/scroll-margin
               */
              'scroll-mb': [{
                'scroll-mb': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Margin Left
               * @see https://tailwindcss.com/docs/scroll-margin
               */
              'scroll-ml': [{
                'scroll-ml': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Padding
               * @see https://tailwindcss.com/docs/scroll-padding
               */
              'scroll-p': [{
                'scroll-p': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Padding X
               * @see https://tailwindcss.com/docs/scroll-padding
               */
              'scroll-px': [{
                'scroll-px': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Padding Y
               * @see https://tailwindcss.com/docs/scroll-padding
               */
              'scroll-py': [{
                'scroll-py': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Padding Start
               * @see https://tailwindcss.com/docs/scroll-padding
               */
              'scroll-ps': [{
                'scroll-ps': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Padding End
               * @see https://tailwindcss.com/docs/scroll-padding
               */
              'scroll-pe': [{
                'scroll-pe': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Padding Top
               * @see https://tailwindcss.com/docs/scroll-padding
               */
              'scroll-pt': [{
                'scroll-pt': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Padding Right
               * @see https://tailwindcss.com/docs/scroll-padding
               */
              'scroll-pr': [{
                'scroll-pr': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Padding Bottom
               * @see https://tailwindcss.com/docs/scroll-padding
               */
              'scroll-pb': [{
                'scroll-pb': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Padding Left
               * @see https://tailwindcss.com/docs/scroll-padding
               */
              'scroll-pl': [{
                'scroll-pl': getSpacingWithArbitrary()
              }],
              /**
               * Scroll Snap Align
               * @see https://tailwindcss.com/docs/scroll-snap-align
               */
              'snap-align': [{
                snap: ['start', 'end', 'center', 'align-none']
              }],
              /**
               * Scroll Snap Stop
               * @see https://tailwindcss.com/docs/scroll-snap-stop
               */
              'snap-stop': [{
                snap: ['normal', 'always']
              }],
              /**
               * Scroll Snap Type
               * @see https://tailwindcss.com/docs/scroll-snap-type
               */
              'snap-type': [{
                snap: ['none', 'x', 'y', 'both']
              }],
              /**
               * Scroll Snap Type Strictness
               * @see https://tailwindcss.com/docs/scroll-snap-type
               */
              'snap-strictness': [{
                snap: ['mandatory', 'proximity']
              }],
              /**
               * Touch Action
               * @see https://tailwindcss.com/docs/touch-action
               */
              touch: [{
                touch: ['auto', 'none', 'manipulation']
              }],
              /**
               * Touch Action X
               * @see https://tailwindcss.com/docs/touch-action
               */
              'touch-x': [{
                'touch-pan': ['x', 'left', 'right']
              }],
              /**
               * Touch Action Y
               * @see https://tailwindcss.com/docs/touch-action
               */
              'touch-y': [{
                'touch-pan': ['y', 'up', 'down']
              }],
              /**
               * Touch Action Pinch Zoom
               * @see https://tailwindcss.com/docs/touch-action
               */
              'touch-pz': ['touch-pinch-zoom'],
              /**
               * User Select
               * @see https://tailwindcss.com/docs/user-select
               */
              select: [{
                select: ['none', 'text', 'all', 'auto']
              }],
              /**
               * Will Change
               * @see https://tailwindcss.com/docs/will-change
               */
              'will-change': [{
                'will-change': ['auto', 'scroll', 'contents', 'transform', isArbitraryValue]
              }],
              // SVG
              /**
               * Fill
               * @see https://tailwindcss.com/docs/fill
               */
              fill: [{
                fill: [colors, 'none']
              }],
              /**
               * Stroke Width
               * @see https://tailwindcss.com/docs/stroke-width
               */
              'stroke-w': [{
                stroke: [isLength, isArbitraryLength, isArbitraryNumber]
              }],
              /**
               * Stroke
               * @see https://tailwindcss.com/docs/stroke
               */
              stroke: [{
                stroke: [colors, 'none']
              }],
              // Accessibility
              /**
               * Screen Readers
               * @see https://tailwindcss.com/docs/screen-readers
               */
              sr: ['sr-only', 'not-sr-only'],
              /**
               * Forced Color Adjust
               * @see https://tailwindcss.com/docs/forced-color-adjust
               */
              'forced-color-adjust': [{
                'forced-color-adjust': ['auto', 'none']
              }]
            },
            conflictingClassGroups: {
              overflow: ['overflow-x', 'overflow-y'],
              overscroll: ['overscroll-x', 'overscroll-y'],
              inset: ['inset-x', 'inset-y', 'start', 'end', 'top', 'right', 'bottom', 'left'],
              'inset-x': ['right', 'left'],
              'inset-y': ['top', 'bottom'],
              flex: ['basis', 'grow', 'shrink'],
              gap: ['gap-x', 'gap-y'],
              p: ['px', 'py', 'ps', 'pe', 'pt', 'pr', 'pb', 'pl'],
              px: ['pr', 'pl'],
              py: ['pt', 'pb'],
              m: ['mx', 'my', 'ms', 'me', 'mt', 'mr', 'mb', 'ml'],
              mx: ['mr', 'ml'],
              my: ['mt', 'mb'],
              size: ['w', 'h'],
              'font-size': ['leading'],
              'fvn-normal': ['fvn-ordinal', 'fvn-slashed-zero', 'fvn-figure', 'fvn-spacing', 'fvn-fraction'],
              'fvn-ordinal': ['fvn-normal'],
              'fvn-slashed-zero': ['fvn-normal'],
              'fvn-figure': ['fvn-normal'],
              'fvn-spacing': ['fvn-normal'],
              'fvn-fraction': ['fvn-normal'],
              'line-clamp': ['display', 'overflow'],
              rounded: ['rounded-s', 'rounded-e', 'rounded-t', 'rounded-r', 'rounded-b', 'rounded-l', 'rounded-ss', 'rounded-se', 'rounded-ee', 'rounded-es', 'rounded-tl', 'rounded-tr', 'rounded-br', 'rounded-bl'],
              'rounded-s': ['rounded-ss', 'rounded-es'],
              'rounded-e': ['rounded-se', 'rounded-ee'],
              'rounded-t': ['rounded-tl', 'rounded-tr'],
              'rounded-r': ['rounded-tr', 'rounded-br'],
              'rounded-b': ['rounded-br', 'rounded-bl'],
              'rounded-l': ['rounded-tl', 'rounded-bl'],
              'border-spacing': ['border-spacing-x', 'border-spacing-y'],
              'border-w': ['border-w-s', 'border-w-e', 'border-w-t', 'border-w-r', 'border-w-b', 'border-w-l'],
              'border-w-x': ['border-w-r', 'border-w-l'],
              'border-w-y': ['border-w-t', 'border-w-b'],
              'border-color': ['border-color-s', 'border-color-e', 'border-color-t', 'border-color-r', 'border-color-b', 'border-color-l'],
              'border-color-x': ['border-color-r', 'border-color-l'],
              'border-color-y': ['border-color-t', 'border-color-b'],
              'scroll-m': ['scroll-mx', 'scroll-my', 'scroll-ms', 'scroll-me', 'scroll-mt', 'scroll-mr', 'scroll-mb', 'scroll-ml'],
              'scroll-mx': ['scroll-mr', 'scroll-ml'],
              'scroll-my': ['scroll-mt', 'scroll-mb'],
              'scroll-p': ['scroll-px', 'scroll-py', 'scroll-ps', 'scroll-pe', 'scroll-pt', 'scroll-pr', 'scroll-pb', 'scroll-pl'],
              'scroll-px': ['scroll-pr', 'scroll-pl'],
              'scroll-py': ['scroll-pt', 'scroll-pb'],
              touch: ['touch-x', 'touch-y', 'touch-pz'],
              'touch-x': ['touch'],
              'touch-y': ['touch'],
              'touch-pz': ['touch']
            },
            conflictingClassGroupModifiers: {
              'font-size': ['leading']
            }
          };
        };
        const twMerge = exports("t", /*#__PURE__*/createTailwindMerge(getDefaultConfig));

        /**
         * @name toDate
         * @category Common Helpers
         * @summary Convert the given argument to an instance of Date.
         *
         * @description
         * Convert the given argument to an instance of Date.
         *
         * If the argument is an instance of Date, the function returns its clone.
         *
         * If the argument is a number, it is treated as a timestamp.
         *
         * If the argument is none of the above, the function returns Invalid Date.
         *
         * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param argument - The value to convert
         *
         * @returns The parsed date in the local time zone
         *
         * @example
         * // Clone the date:
         * const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
         * //=> Tue Feb 11 2014 11:30:30
         *
         * @example
         * // Convert the timestamp to date:
         * const result = toDate(1392098430000)
         * //=> Tue Feb 11 2014 11:30:30
         */
        function toDate(argument) {
          const argStr = Object.prototype.toString.call(argument);

          // Clone the date
          if (argument instanceof Date || typeof argument === "object" && argStr === "[object Date]") {
            // Prevent the date to lose the milliseconds when passed to new Date() in IE10
            return new argument.constructor(+argument);
          } else if (typeof argument === "number" || argStr === "[object Number]" || typeof argument === "string" || argStr === "[object String]") {
            // TODO: Can we get rid of as?
            return new Date(argument);
          } else {
            // TODO: Can we get rid of as?
            return new Date(NaN);
          }
        }

        /**
         * @name constructFrom
         * @category Generic Helpers
         * @summary Constructs a date using the reference date and the value
         *
         * @description
         * The function constructs a new date using the constructor from the reference
         * date and the given value. It helps to build generic functions that accept
         * date extensions.
         *
         * It defaults to `Date` if the passed reference date is a number or a string.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The reference date to take constructor from
         * @param value - The value to create the date
         *
         * @returns Date initialized using the given date and value
         *
         * @example
         * import { constructFrom } from 'date-fns'
         *
         * // A function that clones a date preserving the original type
         * function cloneDate<DateType extends Date(date: DateType): DateType {
         *   return constructFrom(
         *     date, // Use contrustor from the given date
         *     date.getTime() // Use the date value to create a new date
         *   )
         * }
         */
        function constructFrom(date, value) {
          if (date instanceof Date) {
            return new date.constructor(value);
          } else {
            return new Date(value);
          }
        }

        /**
         * @name addDays
         * @category Day Helpers
         * @summary Add the specified number of days to the given date.
         *
         * @description
         * Add the specified number of days to the given date.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The date to be changed
         * @param amount - The amount of days to be added.
         *
         * @returns The new date with the days added
         *
         * @example
         * // Add 10 days to 1 September 2014:
         * const result = addDays(new Date(2014, 8, 1), 10)
         * //=> Thu Sep 11 2014 00:00:00
         */
        function addDays(date, amount) {
          const _date = toDate(date);
          if (isNaN(amount)) return constructFrom(date, NaN);
          if (!amount) {
            // If 0 days, no-op to avoid changing times in the hour before end of DST
            return _date;
          }
          _date.setDate(_date.getDate() + amount);
          return _date;
        }

        /**
         * @module constants
         * @summary Useful constants
         * @description
         * Collection of useful date constants.
         *
         * The constants could be imported from `date-fns/constants`:
         *
         * ```ts
         * import { maxTime, minTime } from "./constants/date-fns/constants";
         *
         * function isAllowedTime(time) {
         *   return time <= maxTime && time >= minTime;
         * }
         * ```
         */

        /**
         * @constant
         * @name millisecondsInWeek
         * @summary Milliseconds in 1 week.
         */
        const millisecondsInWeek = 604800000;

        /**
         * @constant
         * @name millisecondsInDay
         * @summary Milliseconds in 1 day.
         */
        const millisecondsInDay = 86400000;

        /**
         * @constant
         * @name minutesInMonth
         * @summary Minutes in 1 month.
         */
        const minutesInMonth = 43200;

        /**
         * @constant
         * @name minutesInDay
         * @summary Minutes in 1 day.
         */
        const minutesInDay = 1440;
        let defaultOptions = {};
        function getDefaultOptions() {
          return defaultOptions;
        }

        /**
         * The {@link startOfWeek} function options.
         */

        /**
         * @name startOfWeek
         * @category Week Helpers
         * @summary Return the start of a week for the given date.
         *
         * @description
         * Return the start of a week for the given date.
         * The result will be in the local timezone.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         * @param options - An object with options
         *
         * @returns The start of a week
         *
         * @example
         * // The start of a week for 2 September 2014 11:55:00:
         * const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
         * //=> Sun Aug 31 2014 00:00:00
         *
         * @example
         * // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
         * const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
         * //=> Mon Sep 01 2014 00:00:00
         */
        function startOfWeek(date, options) {
          const defaultOptions = getDefaultOptions();
          const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions.weekStartsOn ?? defaultOptions.locale?.options?.weekStartsOn ?? 0;
          const _date = toDate(date);
          const day = _date.getDay();
          const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
          _date.setDate(_date.getDate() - diff);
          _date.setHours(0, 0, 0, 0);
          return _date;
        }

        /**
         * @name startOfISOWeek
         * @category ISO Week Helpers
         * @summary Return the start of an ISO week for the given date.
         *
         * @description
         * Return the start of an ISO week for the given date.
         * The result will be in the local timezone.
         *
         * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         *
         * @returns The start of an ISO week
         *
         * @example
         * // The start of an ISO week for 2 September 2014 11:55:00:
         * const result = startOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
         * //=> Mon Sep 01 2014 00:00:00
         */
        function startOfISOWeek(date) {
          return startOfWeek(date, {
            weekStartsOn: 1
          });
        }

        /**
         * @name getISOWeekYear
         * @category ISO Week-Numbering Year Helpers
         * @summary Get the ISO week-numbering year of the given date.
         *
         * @description
         * Get the ISO week-numbering year of the given date,
         * which always starts 3 days before the year's first Thursday.
         *
         * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The given date
         *
         * @returns The ISO week-numbering year
         *
         * @example
         * // Which ISO-week numbering year is 2 January 2005?
         * const result = getISOWeekYear(new Date(2005, 0, 2))
         * //=> 2004
         */
        function getISOWeekYear(date) {
          const _date = toDate(date);
          const year = _date.getFullYear();
          const fourthOfJanuaryOfNextYear = constructFrom(date, 0);
          fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
          fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
          const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
          const fourthOfJanuaryOfThisYear = constructFrom(date, 0);
          fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
          fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
          const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
          if (_date.getTime() >= startOfNextYear.getTime()) {
            return year + 1;
          } else if (_date.getTime() >= startOfThisYear.getTime()) {
            return year;
          } else {
            return year - 1;
          }
        }

        /**
         * @name startOfDay
         * @category Day Helpers
         * @summary Return the start of a day for the given date.
         *
         * @description
         * Return the start of a day for the given date.
         * The result will be in the local timezone.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         *
         * @returns The start of a day
         *
         * @example
         * // The start of a day for 2 September 2014 11:55:00:
         * const result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
         * //=> Tue Sep 02 2014 00:00:00
         */
        function startOfDay(date) {
          const _date = toDate(date);
          _date.setHours(0, 0, 0, 0);
          return _date;
        }

        /**
         * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
         * They usually appear for dates that denote time before the timezones were introduced
         * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
         * and GMT+01:00:00 after that date)
         *
         * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
         * which would lead to incorrect calculations.
         *
         * This function returns the timezone offset in milliseconds that takes seconds in account.
         */
        function getTimezoneOffsetInMilliseconds(date) {
          const _date = toDate(date);
          const utcDate = new Date(Date.UTC(_date.getFullYear(), _date.getMonth(), _date.getDate(), _date.getHours(), _date.getMinutes(), _date.getSeconds(), _date.getMilliseconds()));
          utcDate.setUTCFullYear(_date.getFullYear());
          return +date - +utcDate;
        }

        /**
         * @name differenceInCalendarDays
         * @category Day Helpers
         * @summary Get the number of calendar days between the given dates.
         *
         * @description
         * Get the number of calendar days between the given dates. This means that the times are removed
         * from the dates and then the difference in days is calculated.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param dateLeft - The later date
         * @param dateRight - The earlier date
         *
         * @returns The number of calendar days
         *
         * @example
         * // How many calendar days are between
         * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
         * const result = differenceInCalendarDays(
         *   new Date(2012, 6, 2, 0, 0),
         *   new Date(2011, 6, 2, 23, 0)
         * )
         * //=> 366
         * // How many calendar days are between
         * // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
         * const result = differenceInCalendarDays(
         *   new Date(2011, 6, 3, 0, 1),
         *   new Date(2011, 6, 2, 23, 59)
         * )
         * //=> 1
         */
        function differenceInCalendarDays(dateLeft, dateRight) {
          const startOfDayLeft = startOfDay(dateLeft);
          const startOfDayRight = startOfDay(dateRight);
          const timestampLeft = +startOfDayLeft - getTimezoneOffsetInMilliseconds(startOfDayLeft);
          const timestampRight = +startOfDayRight - getTimezoneOffsetInMilliseconds(startOfDayRight);

          // Round the number of days to the nearest integer because the number of
          // milliseconds in a day is not constant (e.g. it's different in the week of
          // the daylight saving time clock shift).
          return Math.round((timestampLeft - timestampRight) / millisecondsInDay);
        }

        /**
         * @name startOfISOWeekYear
         * @category ISO Week-Numbering Year Helpers
         * @summary Return the start of an ISO week-numbering year for the given date.
         *
         * @description
         * Return the start of an ISO week-numbering year,
         * which always starts 3 days before the year's first Thursday.
         * The result will be in the local timezone.
         *
         * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         *
         * @returns The start of an ISO week-numbering year
         *
         * @example
         * // The start of an ISO week-numbering year for 2 July 2005:
         * const result = startOfISOWeekYear(new Date(2005, 6, 2))
         * //=> Mon Jan 03 2005 00:00:00
         */
        function startOfISOWeekYear(date) {
          const year = getISOWeekYear(date);
          const fourthOfJanuary = constructFrom(date, 0);
          fourthOfJanuary.setFullYear(year, 0, 4);
          fourthOfJanuary.setHours(0, 0, 0, 0);
          return startOfISOWeek(fourthOfJanuary);
        }

        /**
         * @name compareAsc
         * @category Common Helpers
         * @summary Compare the two dates and return -1, 0 or 1.
         *
         * @description
         * Compare the two dates and return 1 if the first date is after the second,
         * -1 if the first date is before the second or 0 if dates are equal.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param dateLeft - The first date to compare
         * @param dateRight - The second date to compare
         *
         * @returns The result of the comparison
         *
         * @example
         * // Compare 11 February 1987 and 10 July 1989:
         * const result = compareAsc(new Date(1987, 1, 11), new Date(1989, 6, 10))
         * //=> -1
         *
         * @example
         * // Sort the array of dates:
         * const result = [
         *   new Date(1995, 6, 2),
         *   new Date(1987, 1, 11),
         *   new Date(1989, 6, 10)
         * ].sort(compareAsc)
         * //=> [
         * //   Wed Feb 11 1987 00:00:00,
         * //   Mon Jul 10 1989 00:00:00,
         * //   Sun Jul 02 1995 00:00:00
         * // ]
         */
        function compareAsc(dateLeft, dateRight) {
          const _dateLeft = toDate(dateLeft);
          const _dateRight = toDate(dateRight);
          const diff = _dateLeft.getTime() - _dateRight.getTime();
          if (diff < 0) {
            return -1;
          } else if (diff > 0) {
            return 1;
            // Return 0 if diff is 0; return NaN if diff is NaN
          } else {
            return diff;
          }
        }

        /**
         * @name constructNow
         * @category Generic Helpers
         * @summary Constructs a new current date using the passed value constructor.
         * @pure false
         *
         * @description
         * The function constructs a new current date using the constructor from
         * the reference date. It helps to build generic functions that accept date
         * extensions and use the current date.
         *
         * It defaults to `Date` if the passed reference date is a number or a string.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The reference date to take constructor from
         *
         * @returns Current date initialized using the given date constructor
         *
         * @example
         * import { constructNow, isSameDay } from 'date-fns'
         *
         * function isToday<DateType extends Date>(
         *   date: DateType | number | string,
         * ): boolean {
         *   // If we were to use `new Date()` directly, the function would  behave
         *   // differently in different timezones and return false for the same date.
         *   return isSameDay(date, constructNow(date));
         * }
         */
        function constructNow(date) {
          return constructFrom(date, Date.now());
        }

        /**
         * @name isDate
         * @category Common Helpers
         * @summary Is the given value a date?
         *
         * @description
         * Returns true if the given value is an instance of Date. The function works for dates transferred across iframes.
         *
         * @param value - The value to check
         *
         * @returns True if the given value is a date
         *
         * @example
         * // For a valid date:
         * const result = isDate(new Date())
         * //=> true
         *
         * @example
         * // For an invalid date:
         * const result = isDate(new Date(NaN))
         * //=> true
         *
         * @example
         * // For some value:
         * const result = isDate('2014-02-31')
         * //=> false
         *
         * @example
         * // For an object:
         * const result = isDate({})
         * //=> false
         */
        function isDate(value) {
          return value instanceof Date || typeof value === "object" && Object.prototype.toString.call(value) === "[object Date]";
        }

        /**
         * @name isValid
         * @category Common Helpers
         * @summary Is the given date valid?
         *
         * @description
         * Returns false if argument is Invalid Date and true otherwise.
         * Argument is converted to Date using `toDate`. See [toDate](https://date-fns.org/docs/toDate)
         * Invalid Date is a Date, whose time value is NaN.
         *
         * Time value of Date: http://es5.github.io/#x15.9.1.1
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The date to check
         *
         * @returns The date is valid
         *
         * @example
         * // For the valid date:
         * const result = isValid(new Date(2014, 1, 31))
         * //=> true
         *
         * @example
         * // For the value, convertable into a date:
         * const result = isValid(1393804800000)
         * //=> true
         *
         * @example
         * // For the invalid date:
         * const result = isValid(new Date(''))
         * //=> false
         */
        function isValid(date) {
          if (!isDate(date) && typeof date !== "number") {
            return false;
          }
          const _date = toDate(date);
          return !isNaN(Number(_date));
        }

        /**
         * @name differenceInCalendarMonths
         * @category Month Helpers
         * @summary Get the number of calendar months between the given dates.
         *
         * @description
         * Get the number of calendar months between the given dates.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param dateLeft - The later date
         * @param dateRight - The earlier date
         *
         * @returns The number of calendar months
         *
         * @example
         * // How many calendar months are between 31 January 2014 and 1 September 2014?
         * const result = differenceInCalendarMonths(
         *   new Date(2014, 8, 1),
         *   new Date(2014, 0, 31)
         * )
         * //=> 8
         */
        function differenceInCalendarMonths(dateLeft, dateRight) {
          const _dateLeft = toDate(dateLeft);
          const _dateRight = toDate(dateRight);
          const yearDiff = _dateLeft.getFullYear() - _dateRight.getFullYear();
          const monthDiff = _dateLeft.getMonth() - _dateRight.getMonth();
          return yearDiff * 12 + monthDiff;
        }
        function getRoundingMethod(method) {
          return number => {
            const round = method ? Math[method] : Math.trunc;
            const result = round(number);
            // Prevent negative zero
            return result === 0 ? 0 : result;
          };
        }

        /**
         * @name differenceInMilliseconds
         * @category Millisecond Helpers
         * @summary Get the number of milliseconds between the given dates.
         *
         * @description
         * Get the number of milliseconds between the given dates.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param dateLeft - The later date
         * @param dateRight - The earlier date
         *
         * @returns The number of milliseconds
         *
         * @example
         * // How many milliseconds are between
         * // 2 July 2014 12:30:20.600 and 2 July 2014 12:30:21.700?
         * const result = differenceInMilliseconds(
         *   new Date(2014, 6, 2, 12, 30, 21, 700),
         *   new Date(2014, 6, 2, 12, 30, 20, 600)
         * )
         * //=> 1100
         */
        function differenceInMilliseconds(dateLeft, dateRight) {
          return +toDate(dateLeft) - +toDate(dateRight);
        }

        /**
         * @name endOfDay
         * @category Day Helpers
         * @summary Return the end of a day for the given date.
         *
         * @description
         * Return the end of a day for the given date.
         * The result will be in the local timezone.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         *
         * @returns The end of a day
         *
         * @example
         * // The end of a day for 2 September 2014 11:55:00:
         * const result = endOfDay(new Date(2014, 8, 2, 11, 55, 0))
         * //=> Tue Sep 02 2014 23:59:59.999
         */
        function endOfDay(date) {
          const _date = toDate(date);
          _date.setHours(23, 59, 59, 999);
          return _date;
        }

        /**
         * @name endOfMonth
         * @category Month Helpers
         * @summary Return the end of a month for the given date.
         *
         * @description
         * Return the end of a month for the given date.
         * The result will be in the local timezone.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         *
         * @returns The end of a month
         *
         * @example
         * // The end of a month for 2 September 2014 11:55:00:
         * const result = endOfMonth(new Date(2014, 8, 2, 11, 55, 0))
         * //=> Tue Sep 30 2014 23:59:59.999
         */
        function endOfMonth(date) {
          const _date = toDate(date);
          const month = _date.getMonth();
          _date.setFullYear(_date.getFullYear(), month + 1, 0);
          _date.setHours(23, 59, 59, 999);
          return _date;
        }

        /**
         * @name isLastDayOfMonth
         * @category Month Helpers
         * @summary Is the given date the last day of a month?
         *
         * @description
         * Is the given date the last day of a month?
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The date to check
          * @returns The date is the last day of a month
         *
         * @example
         * // Is 28 February 2014 the last day of a month?
         * const result = isLastDayOfMonth(new Date(2014, 1, 28))
         * //=> true
         */
        function isLastDayOfMonth(date) {
          const _date = toDate(date);
          return +endOfDay(_date) === +endOfMonth(_date);
        }

        /**
         * @name differenceInMonths
         * @category Month Helpers
         * @summary Get the number of full months between the given dates.
         *
         * @description
         * Get the number of full months between the given dates using trunc as a default rounding method.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param dateLeft - The later date
         * @param dateRight - The earlier date
         *
         * @returns The number of full months
         *
         * @example
         * // How many full months are between 31 January 2014 and 1 September 2014?
         * const result = differenceInMonths(new Date(2014, 8, 1), new Date(2014, 0, 31))
         * //=> 7
         */
        function differenceInMonths(dateLeft, dateRight) {
          const _dateLeft = toDate(dateLeft);
          const _dateRight = toDate(dateRight);
          const sign = compareAsc(_dateLeft, _dateRight);
          const difference = Math.abs(differenceInCalendarMonths(_dateLeft, _dateRight));
          let result;

          // Check for the difference of less than month
          if (difference < 1) {
            result = 0;
          } else {
            if (_dateLeft.getMonth() === 1 && _dateLeft.getDate() > 27) {
              // This will check if the date is end of Feb and assign a higher end of month date
              // to compare it with Jan
              _dateLeft.setDate(30);
            }
            _dateLeft.setMonth(_dateLeft.getMonth() - sign * difference);

            // Math.abs(diff in full months - diff in calendar months) === 1 if last calendar month is not full
            // If so, result must be decreased by 1 in absolute value
            let isLastMonthNotFull = compareAsc(_dateLeft, _dateRight) === -sign;

            // Check for cases of one full calendar month
            if (isLastDayOfMonth(toDate(dateLeft)) && difference === 1 && compareAsc(dateLeft, _dateRight) === 1) {
              isLastMonthNotFull = false;
            }
            result = sign * (difference - Number(isLastMonthNotFull));
          }

          // Prevent negative zero
          return result === 0 ? 0 : result;
        }

        /**
         * The {@link differenceInSeconds} function options.
         */

        /**
         * @name differenceInSeconds
         * @category Second Helpers
         * @summary Get the number of seconds between the given dates.
         *
         * @description
         * Get the number of seconds between the given dates.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param dateLeft - The later date
         * @param dateRight - The earlier date
         * @param options - An object with options.
         *
         * @returns The number of seconds
         *
         * @example
         * // How many seconds are between
         * // 2 July 2014 12:30:07.999 and 2 July 2014 12:30:20.000?
         * const result = differenceInSeconds(
         *   new Date(2014, 6, 2, 12, 30, 20, 0),
         *   new Date(2014, 6, 2, 12, 30, 7, 999)
         * )
         * //=> 12
         */
        function differenceInSeconds(dateLeft, dateRight, options) {
          const diff = differenceInMilliseconds(dateLeft, dateRight) / 1000;
          return getRoundingMethod(options?.roundingMethod)(diff);
        }

        /**
         * The {@link eachDayOfInterval} function options.
         */

        /**
         * @name eachDayOfInterval
         * @category Interval Helpers
         * @summary Return the array of dates within the specified time interval.
         *
         * @description
         * Return the array of dates within the specified time interval.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param interval - The interval.
         * @param options - An object with options.
         *
         * @returns The array with starts of days from the day of the interval start to the day of the interval end
         *
         * @example
         * // Each day between 6 October 2014 and 10 October 2014:
         * const result = eachDayOfInterval({
         *   start: new Date(2014, 9, 6),
         *   end: new Date(2014, 9, 10)
         * })
         * //=> [
         * //   Mon Oct 06 2014 00:00:00,
         * //   Tue Oct 07 2014 00:00:00,
         * //   Wed Oct 08 2014 00:00:00,
         * //   Thu Oct 09 2014 00:00:00,
         * //   Fri Oct 10 2014 00:00:00
         * // ]
         */
        function eachDayOfInterval(interval, options) {
          const startDate = toDate(interval.start);
          const endDate = toDate(interval.end);
          let reversed = +startDate > +endDate;
          const endTime = reversed ? +startDate : +endDate;
          const currentDate = reversed ? endDate : startDate;
          currentDate.setHours(0, 0, 0, 0);
          let step = 1;
          const dates = [];
          while (+currentDate <= endTime) {
            dates.push(toDate(currentDate));
            currentDate.setDate(currentDate.getDate() + step);
            currentDate.setHours(0, 0, 0, 0);
          }
          return reversed ? dates.reverse() : dates;
        }

        /**
         * @name startOfMonth
         * @category Month Helpers
         * @summary Return the start of a month for the given date.
         *
         * @description
         * Return the start of a month for the given date.
         * The result will be in the local timezone.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         *
         * @returns The start of a month
         *
         * @example
         * // The start of a month for 2 September 2014 11:55:00:
         * const result = startOfMonth(new Date(2014, 8, 2, 11, 55, 0))
         * //=> Mon Sep 01 2014 00:00:00
         */
        function startOfMonth(date) {
          const _date = toDate(date);
          _date.setDate(1);
          _date.setHours(0, 0, 0, 0);
          return _date;
        }

        /**
         * @name startOfYear
         * @category Year Helpers
         * @summary Return the start of a year for the given date.
         *
         * @description
         * Return the start of a year for the given date.
         * The result will be in the local timezone.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         *
         * @returns The start of a year
         *
         * @example
         * // The start of a year for 2 September 2014 11:55:00:
         * const result = startOfYear(new Date(2014, 8, 2, 11, 55, 00))
         * //=> Wed Jan 01 2014 00:00:00
         */
        function startOfYear(date) {
          const cleanDate = toDate(date);
          const _date = constructFrom(date, 0);
          _date.setFullYear(cleanDate.getFullYear(), 0, 1);
          _date.setHours(0, 0, 0, 0);
          return _date;
        }
        const formatDistanceLocale = {
          lessThanXSeconds: {
            one: "less than a second",
            other: "less than {{count}} seconds"
          },
          xSeconds: {
            one: "1 second",
            other: "{{count}} seconds"
          },
          halfAMinute: "half a minute",
          lessThanXMinutes: {
            one: "less than a minute",
            other: "less than {{count}} minutes"
          },
          xMinutes: {
            one: "1 minute",
            other: "{{count}} minutes"
          },
          aboutXHours: {
            one: "about 1 hour",
            other: "about {{count}} hours"
          },
          xHours: {
            one: "1 hour",
            other: "{{count}} hours"
          },
          xDays: {
            one: "1 day",
            other: "{{count}} days"
          },
          aboutXWeeks: {
            one: "about 1 week",
            other: "about {{count}} weeks"
          },
          xWeeks: {
            one: "1 week",
            other: "{{count}} weeks"
          },
          aboutXMonths: {
            one: "about 1 month",
            other: "about {{count}} months"
          },
          xMonths: {
            one: "1 month",
            other: "{{count}} months"
          },
          aboutXYears: {
            one: "about 1 year",
            other: "about {{count}} years"
          },
          xYears: {
            one: "1 year",
            other: "{{count}} years"
          },
          overXYears: {
            one: "over 1 year",
            other: "over {{count}} years"
          },
          almostXYears: {
            one: "almost 1 year",
            other: "almost {{count}} years"
          }
        };
        const formatDistance$1 = (token, count, options) => {
          let result;
          const tokenValue = formatDistanceLocale[token];
          if (typeof tokenValue === "string") {
            result = tokenValue;
          } else if (count === 1) {
            result = tokenValue.one;
          } else {
            result = tokenValue.other.replace("{{count}}", count.toString());
          }
          if (options?.addSuffix) {
            if (options.comparison && options.comparison > 0) {
              return "in " + result;
            } else {
              return result + " ago";
            }
          }
          return result;
        };
        function buildFormatLongFn(args) {
          return (options = {}) => {
            // TODO: Remove String()
            const width = options.width ? String(options.width) : args.defaultWidth;
            const format = args.formats[width] || args.formats[args.defaultWidth];
            return format;
          };
        }
        const dateFormats = {
          full: "EEEE, MMMM do, y",
          long: "MMMM do, y",
          medium: "MMM d, y",
          short: "MM/dd/yyyy"
        };
        const timeFormats = {
          full: "h:mm:ss a zzzz",
          long: "h:mm:ss a z",
          medium: "h:mm:ss a",
          short: "h:mm a"
        };
        const dateTimeFormats = {
          full: "{{date}} 'at' {{time}}",
          long: "{{date}} 'at' {{time}}",
          medium: "{{date}}, {{time}}",
          short: "{{date}}, {{time}}"
        };
        const formatLong = {
          date: buildFormatLongFn({
            formats: dateFormats,
            defaultWidth: "full"
          }),
          time: buildFormatLongFn({
            formats: timeFormats,
            defaultWidth: "full"
          }),
          dateTime: buildFormatLongFn({
            formats: dateTimeFormats,
            defaultWidth: "full"
          })
        };
        const formatRelativeLocale = {
          lastWeek: "'last' eeee 'at' p",
          yesterday: "'yesterday at' p",
          today: "'today at' p",
          tomorrow: "'tomorrow at' p",
          nextWeek: "eeee 'at' p",
          other: "P"
        };
        const formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];

        /* eslint-disable no-unused-vars */

        /**
         * The localize function argument callback which allows to convert raw value to
         * the actual type.
         *
         * @param value - The value to convert
         *
         * @returns The converted value
         */

        /**
         * The map of localized values for each width.
         */

        /**
         * The index type of the locale unit value. It types conversion of units of
         * values that don't start at 0 (i.e. quarters).
         */

        /**
         * Converts the unit value to the tuple of values.
         */

        /**
         * The tuple of localized era values. The first element represents BC,
         * the second element represents AD.
         */

        /**
         * The tuple of localized quarter values. The first element represents Q1.
         */

        /**
         * The tuple of localized day values. The first element represents Sunday.
         */

        /**
         * The tuple of localized month values. The first element represents January.
         */

        function buildLocalizeFn(args) {
          return (value, options) => {
            const context = options?.context ? String(options.context) : "standalone";
            let valuesArray;
            if (context === "formatting" && args.formattingValues) {
              const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
              const width = options?.width ? String(options.width) : defaultWidth;
              valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
            } else {
              const defaultWidth = args.defaultWidth;
              const width = options?.width ? String(options.width) : args.defaultWidth;
              valuesArray = args.values[width] || args.values[defaultWidth];
            }
            const index = args.argumentCallback ? args.argumentCallback(value) : value;

            // @ts-expect-error - For some reason TypeScript just don't want to match it, no matter how hard we try. I challenge you to try to remove it!
            return valuesArray[index];
          };
        }
        const eraValues = {
          narrow: ["B", "A"],
          abbreviated: ["BC", "AD"],
          wide: ["Before Christ", "Anno Domini"]
        };
        const quarterValues = {
          narrow: ["1", "2", "3", "4"],
          abbreviated: ["Q1", "Q2", "Q3", "Q4"],
          wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
        };

        // Note: in English, the names of days of the week and months are capitalized.
        // If you are making a new locale based on this one, check if the same is true for the language you're working on.
        // Generally, formatted dates should look like they are in the middle of a sentence,
        // e.g. in Spanish language the weekdays and months should be in the lowercase.
        const monthValues = {
          narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
          abbreviated: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          wide: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        };
        const dayValues = {
          narrow: ["S", "M", "T", "W", "T", "F", "S"],
          short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
          abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          wide: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        };
        const dayPeriodValues = {
          narrow: {
            am: "a",
            pm: "p",
            midnight: "mi",
            noon: "n",
            morning: "morning",
            afternoon: "afternoon",
            evening: "evening",
            night: "night"
          },
          abbreviated: {
            am: "AM",
            pm: "PM",
            midnight: "midnight",
            noon: "noon",
            morning: "morning",
            afternoon: "afternoon",
            evening: "evening",
            night: "night"
          },
          wide: {
            am: "a.m.",
            pm: "p.m.",
            midnight: "midnight",
            noon: "noon",
            morning: "morning",
            afternoon: "afternoon",
            evening: "evening",
            night: "night"
          }
        };
        const formattingDayPeriodValues = {
          narrow: {
            am: "a",
            pm: "p",
            midnight: "mi",
            noon: "n",
            morning: "in the morning",
            afternoon: "in the afternoon",
            evening: "in the evening",
            night: "at night"
          },
          abbreviated: {
            am: "AM",
            pm: "PM",
            midnight: "midnight",
            noon: "noon",
            morning: "in the morning",
            afternoon: "in the afternoon",
            evening: "in the evening",
            night: "at night"
          },
          wide: {
            am: "a.m.",
            pm: "p.m.",
            midnight: "midnight",
            noon: "noon",
            morning: "in the morning",
            afternoon: "in the afternoon",
            evening: "in the evening",
            night: "at night"
          }
        };
        const ordinalNumber = (dirtyNumber, _options) => {
          const number = Number(dirtyNumber);

          // If ordinal numbers depend on context, for example,
          // if they are different for different grammatical genders,
          // use `options.unit`.
          //
          // `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
          // 'day', 'hour', 'minute', 'second'.

          const rem100 = number % 100;
          if (rem100 > 20 || rem100 < 10) {
            switch (rem100 % 10) {
              case 1:
                return number + "st";
              case 2:
                return number + "nd";
              case 3:
                return number + "rd";
            }
          }
          return number + "th";
        };
        const localize = {
          ordinalNumber,
          era: buildLocalizeFn({
            values: eraValues,
            defaultWidth: "wide"
          }),
          quarter: buildLocalizeFn({
            values: quarterValues,
            defaultWidth: "wide",
            argumentCallback: quarter => quarter - 1
          }),
          month: buildLocalizeFn({
            values: monthValues,
            defaultWidth: "wide"
          }),
          day: buildLocalizeFn({
            values: dayValues,
            defaultWidth: "wide"
          }),
          dayPeriod: buildLocalizeFn({
            values: dayPeriodValues,
            defaultWidth: "wide",
            formattingValues: formattingDayPeriodValues,
            defaultFormattingWidth: "wide"
          })
        };
        function buildMatchFn(args) {
          return (string, options = {}) => {
            const width = options.width;
            const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
            const matchResult = string.match(matchPattern);
            if (!matchResult) {
              return null;
            }
            const matchedString = matchResult[0];
            const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
            const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, pattern => pattern.test(matchedString)) :
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
            findKey(parsePatterns, pattern => pattern.test(matchedString));
            let value;
            value = args.valueCallback ? args.valueCallback(key) : key;
            value = options.valueCallback ?
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
            options.valueCallback(value) : value;
            const rest = string.slice(matchedString.length);
            return {
              value,
              rest
            };
          };
        }
        function findKey(object, predicate) {
          for (const key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
              return key;
            }
          }
          return undefined;
        }
        function findIndex(array, predicate) {
          for (let key = 0; key < array.length; key++) {
            if (predicate(array[key])) {
              return key;
            }
          }
          return undefined;
        }
        function buildMatchPatternFn(args) {
          return (string, options = {}) => {
            const matchResult = string.match(args.matchPattern);
            if (!matchResult) return null;
            const matchedString = matchResult[0];
            const parseResult = string.match(args.parsePattern);
            if (!parseResult) return null;
            let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
            value = options.valueCallback ? options.valueCallback(value) : value;
            const rest = string.slice(matchedString.length);
            return {
              value,
              rest
            };
          };
        }
        const matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
        const parseOrdinalNumberPattern = /\d+/i;
        const matchEraPatterns = {
          narrow: /^(b|a)/i,
          abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
          wide: /^(before christ|before common era|anno domini|common era)/i
        };
        const parseEraPatterns = {
          any: [/^b/i, /^(a|c)/i]
        };
        const matchQuarterPatterns = {
          narrow: /^[1234]/i,
          abbreviated: /^q[1234]/i,
          wide: /^[1234](th|st|nd|rd)? quarter/i
        };
        const parseQuarterPatterns = {
          any: [/1/i, /2/i, /3/i, /4/i]
        };
        const matchMonthPatterns = {
          narrow: /^[jfmasond]/i,
          abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
          wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
        };
        const parseMonthPatterns = {
          narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
          any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
        };
        const matchDayPatterns = {
          narrow: /^[smtwf]/i,
          short: /^(su|mo|tu|we|th|fr|sa)/i,
          abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
          wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
        };
        const parseDayPatterns = {
          narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
          any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
        };
        const matchDayPeriodPatterns = {
          narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
          any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
        };
        const parseDayPeriodPatterns = {
          any: {
            am: /^a/i,
            pm: /^p/i,
            midnight: /^mi/i,
            noon: /^no/i,
            morning: /morning/i,
            afternoon: /afternoon/i,
            evening: /evening/i,
            night: /night/i
          }
        };
        const match = {
          ordinalNumber: buildMatchPatternFn({
            matchPattern: matchOrdinalNumberPattern,
            parsePattern: parseOrdinalNumberPattern,
            valueCallback: value => parseInt(value, 10)
          }),
          era: buildMatchFn({
            matchPatterns: matchEraPatterns,
            defaultMatchWidth: "wide",
            parsePatterns: parseEraPatterns,
            defaultParseWidth: "any"
          }),
          quarter: buildMatchFn({
            matchPatterns: matchQuarterPatterns,
            defaultMatchWidth: "wide",
            parsePatterns: parseQuarterPatterns,
            defaultParseWidth: "any",
            valueCallback: index => index + 1
          }),
          month: buildMatchFn({
            matchPatterns: matchMonthPatterns,
            defaultMatchWidth: "wide",
            parsePatterns: parseMonthPatterns,
            defaultParseWidth: "any"
          }),
          day: buildMatchFn({
            matchPatterns: matchDayPatterns,
            defaultMatchWidth: "wide",
            parsePatterns: parseDayPatterns,
            defaultParseWidth: "any"
          }),
          dayPeriod: buildMatchFn({
            matchPatterns: matchDayPeriodPatterns,
            defaultMatchWidth: "any",
            parsePatterns: parseDayPeriodPatterns,
            defaultParseWidth: "any"
          })
        };

        /**
         * @category Locales
         * @summary English locale (United States).
         * @language English
         * @iso-639-2 eng
         * @author Sasha Koss [@kossnocorp](https://github.com/kossnocorp)
         * @author Lesha Koss [@leshakoss](https://github.com/leshakoss)
         */
        const enUS = {
          code: "en-US",
          formatDistance: formatDistance$1,
          formatLong: formatLong,
          formatRelative: formatRelative,
          localize: localize,
          match: match,
          options: {
            weekStartsOn: 0 /* Sunday */,
            firstWeekContainsDate: 1
          }
        };

        /**
         * @name getDayOfYear
         * @category Day Helpers
         * @summary Get the day of the year of the given date.
         *
         * @description
         * Get the day of the year of the given date.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The given date
         *
         * @returns The day of year
         *
         * @example
         * // Which day of the year is 2 July 2014?
         * const result = getDayOfYear(new Date(2014, 6, 2))
         * //=> 183
         */
        function getDayOfYear(date) {
          const _date = toDate(date);
          const diff = differenceInCalendarDays(_date, startOfYear(_date));
          const dayOfYear = diff + 1;
          return dayOfYear;
        }

        /**
         * @name getISOWeek
         * @category ISO Week Helpers
         * @summary Get the ISO week of the given date.
         *
         * @description
         * Get the ISO week of the given date.
         *
         * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The given date
         *
         * @returns The ISO week
         *
         * @example
         * // Which week of the ISO-week numbering year is 2 January 2005?
         * const result = getISOWeek(new Date(2005, 0, 2))
         * //=> 53
         */
        function getISOWeek(date) {
          const _date = toDate(date);
          const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);

          // Round the number of weeks to the nearest integer because the number of
          // milliseconds in a week is not constant (e.g. it's different in the week of
          // the daylight saving time clock shift).
          return Math.round(diff / millisecondsInWeek) + 1;
        }

        /**
         * The {@link getWeekYear} function options.
         */

        /**
         * @name getWeekYear
         * @category Week-Numbering Year Helpers
         * @summary Get the local week-numbering year of the given date.
         *
         * @description
         * Get the local week-numbering year of the given date.
         * The exact calculation depends on the values of
         * `options.weekStartsOn` (which is the index of the first day of the week)
         * and `options.firstWeekContainsDate` (which is the day of January, which is always in
         * the first week of the week-numbering year)
         *
         * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The given date
         * @param options - An object with options.
         *
         * @returns The local week-numbering year
         *
         * @example
         * // Which week numbering year is 26 December 2004 with the default settings?
         * const result = getWeekYear(new Date(2004, 11, 26))
         * //=> 2005
         *
         * @example
         * // Which week numbering year is 26 December 2004 if week starts on Saturday?
         * const result = getWeekYear(new Date(2004, 11, 26), { weekStartsOn: 6 })
         * //=> 2004
         *
         * @example
         * // Which week numbering year is 26 December 2004 if the first week contains 4 January?
         * const result = getWeekYear(new Date(2004, 11, 26), { firstWeekContainsDate: 4 })
         * //=> 2004
         */
        function getWeekYear(date, options) {
          const _date = toDate(date);
          const year = _date.getFullYear();
          const defaultOptions = getDefaultOptions();
          const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions.firstWeekContainsDate ?? defaultOptions.locale?.options?.firstWeekContainsDate ?? 1;
          const firstWeekOfNextYear = constructFrom(date, 0);
          firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
          firstWeekOfNextYear.setHours(0, 0, 0, 0);
          const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
          const firstWeekOfThisYear = constructFrom(date, 0);
          firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
          firstWeekOfThisYear.setHours(0, 0, 0, 0);
          const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
          if (_date.getTime() >= startOfNextYear.getTime()) {
            return year + 1;
          } else if (_date.getTime() >= startOfThisYear.getTime()) {
            return year;
          } else {
            return year - 1;
          }
        }

        /**
         * The {@link startOfWeekYear} function options.
         */

        /**
         * @name startOfWeekYear
         * @category Week-Numbering Year Helpers
         * @summary Return the start of a local week-numbering year for the given date.
         *
         * @description
         * Return the start of a local week-numbering year.
         * The exact calculation depends on the values of
         * `options.weekStartsOn` (which is the index of the first day of the week)
         * and `options.firstWeekContainsDate` (which is the day of January, which is always in
         * the first week of the week-numbering year)
         *
         * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         * @param options - An object with options
         *
         * @returns The start of a week-numbering year
         *
         * @example
         * // The start of an a week-numbering year for 2 July 2005 with default settings:
         * const result = startOfWeekYear(new Date(2005, 6, 2))
         * //=> Sun Dec 26 2004 00:00:00
         *
         * @example
         * // The start of a week-numbering year for 2 July 2005
         * // if Monday is the first day of week
         * // and 4 January is always in the first week of the year:
         * const result = startOfWeekYear(new Date(2005, 6, 2), {
         *   weekStartsOn: 1,
         *   firstWeekContainsDate: 4
         * })
         * //=> Mon Jan 03 2005 00:00:00
         */
        function startOfWeekYear(date, options) {
          const defaultOptions = getDefaultOptions();
          const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions.firstWeekContainsDate ?? defaultOptions.locale?.options?.firstWeekContainsDate ?? 1;
          const year = getWeekYear(date, options);
          const firstWeek = constructFrom(date, 0);
          firstWeek.setFullYear(year, 0, firstWeekContainsDate);
          firstWeek.setHours(0, 0, 0, 0);
          const _date = startOfWeek(firstWeek, options);
          return _date;
        }

        /**
         * The {@link getWeek} function options.
         */

        /**
         * @name getWeek
         * @category Week Helpers
         * @summary Get the local week index of the given date.
         *
         * @description
         * Get the local week index of the given date.
         * The exact calculation depends on the values of
         * `options.weekStartsOn` (which is the index of the first day of the week)
         * and `options.firstWeekContainsDate` (which is the day of January, which is always in
         * the first week of the week-numbering year)
         *
         * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The given date
         * @param options - An object with options
         *
         * @returns The week
         *
         * @example
         * // Which week of the local week numbering year is 2 January 2005 with default options?
         * const result = getWeek(new Date(2005, 0, 2))
         * //=> 2
         *
         * @example
         * // Which week of the local week numbering year is 2 January 2005,
         * // if Monday is the first day of the week,
         * // and the first week of the year always contains 4 January?
         * const result = getWeek(new Date(2005, 0, 2), {
         *   weekStartsOn: 1,
         *   firstWeekContainsDate: 4
         * })
         * //=> 53
         */

        function getWeek(date, options) {
          const _date = toDate(date);
          const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);

          // Round the number of weeks to the nearest integer because the number of
          // milliseconds in a week is not constant (e.g. it's different in the week of
          // the daylight saving time clock shift).
          return Math.round(diff / millisecondsInWeek) + 1;
        }
        function addLeadingZeros(number, targetLength) {
          const sign = number < 0 ? "-" : "";
          const output = Math.abs(number).toString().padStart(targetLength, "0");
          return sign + output;
        }

        /*
         * |     | Unit                           |     | Unit                           |
         * |-----|--------------------------------|-----|--------------------------------|
         * |  a  | AM, PM                         |  A* |                                |
         * |  d  | Day of month                   |  D  |                                |
         * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
         * |  m  | Minute                         |  M  | Month                          |
         * |  s  | Second                         |  S  | Fraction of second             |
         * |  y  | Year (abs)                     |  Y  |                                |
         *
         * Letters marked by * are not implemented but reserved by Unicode standard.
         */

        const lightFormatters = {
          // Year
          y(date, token) {
            // From http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_tokens
            // | Year     |     y | yy |   yyy |  yyyy | yyyyy |
            // |----------|-------|----|-------|-------|-------|
            // | AD 1     |     1 | 01 |   001 |  0001 | 00001 |
            // | AD 12    |    12 | 12 |   012 |  0012 | 00012 |
            // | AD 123   |   123 | 23 |   123 |  0123 | 00123 |
            // | AD 1234  |  1234 | 34 |  1234 |  1234 | 01234 |
            // | AD 12345 | 12345 | 45 | 12345 | 12345 | 12345 |

            const signedYear = date.getFullYear();
            // Returns 1 for 1 BC (which is year 0 in JavaScript)
            const year = signedYear > 0 ? signedYear : 1 - signedYear;
            return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
          },
          // Month
          M(date, token) {
            const month = date.getMonth();
            return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
          },
          // Day of the month
          d(date, token) {
            return addLeadingZeros(date.getDate(), token.length);
          },
          // AM or PM
          a(date, token) {
            const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
            switch (token) {
              case "a":
              case "aa":
                return dayPeriodEnumValue.toUpperCase();
              case "aaa":
                return dayPeriodEnumValue;
              case "aaaaa":
                return dayPeriodEnumValue[0];
              case "aaaa":
              default:
                return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
            }
          },
          // Hour [1-12]
          h(date, token) {
            return addLeadingZeros(date.getHours() % 12 || 12, token.length);
          },
          // Hour [0-23]
          H(date, token) {
            return addLeadingZeros(date.getHours(), token.length);
          },
          // Minute
          m(date, token) {
            return addLeadingZeros(date.getMinutes(), token.length);
          },
          // Second
          s(date, token) {
            return addLeadingZeros(date.getSeconds(), token.length);
          },
          // Fraction of second
          S(date, token) {
            const numberOfDigits = token.length;
            const milliseconds = date.getMilliseconds();
            const fractionalSeconds = Math.trunc(milliseconds * Math.pow(10, numberOfDigits - 3));
            return addLeadingZeros(fractionalSeconds, token.length);
          }
        };
        const dayPeriodEnum = {
          midnight: "midnight",
          noon: "noon",
          morning: "morning",
          afternoon: "afternoon",
          evening: "evening",
          night: "night"
        };

        /*
         * |     | Unit                           |     | Unit                           |
         * |-----|--------------------------------|-----|--------------------------------|
         * |  a  | AM, PM                         |  A* | Milliseconds in day            |
         * |  b  | AM, PM, noon, midnight         |  B  | Flexible day period            |
         * |  c  | Stand-alone local day of week  |  C* | Localized hour w/ day period   |
         * |  d  | Day of month                   |  D  | Day of year                    |
         * |  e  | Local day of week              |  E  | Day of week                    |
         * |  f  |                                |  F* | Day of week in month           |
         * |  g* | Modified Julian day            |  G  | Era                            |
         * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
         * |  i! | ISO day of week                |  I! | ISO week of year               |
         * |  j* | Localized hour w/ day period   |  J* | Localized hour w/o day period  |
         * |  k  | Hour [1-24]                    |  K  | Hour [0-11]                    |
         * |  l* | (deprecated)                   |  L  | Stand-alone month              |
         * |  m  | Minute                         |  M  | Month                          |
         * |  n  |                                |  N  |                                |
         * |  o! | Ordinal number modifier        |  O  | Timezone (GMT)                 |
         * |  p! | Long localized time            |  P! | Long localized date            |
         * |  q  | Stand-alone quarter            |  Q  | Quarter                        |
         * |  r* | Related Gregorian year         |  R! | ISO week-numbering year        |
         * |  s  | Second                         |  S  | Fraction of second             |
         * |  t! | Seconds timestamp              |  T! | Milliseconds timestamp         |
         * |  u  | Extended year                  |  U* | Cyclic year                    |
         * |  v* | Timezone (generic non-locat.)  |  V* | Timezone (location)            |
         * |  w  | Local week of year             |  W* | Week of month                  |
         * |  x  | Timezone (ISO-8601 w/o Z)      |  X  | Timezone (ISO-8601)            |
         * |  y  | Year (abs)                     |  Y  | Local week-numbering year      |
         * |  z  | Timezone (specific non-locat.) |  Z* | Timezone (aliases)             |
         *
         * Letters marked by * are not implemented but reserved by Unicode standard.
         *
         * Letters marked by ! are non-standard, but implemented by date-fns:
         * - `o` modifies the previous token to turn it into an ordinal (see `format` docs)
         * - `i` is ISO day of week. For `i` and `ii` is returns numeric ISO week days,
         *   i.e. 7 for Sunday, 1 for Monday, etc.
         * - `I` is ISO week of year, as opposed to `w` which is local week of year.
         * - `R` is ISO week-numbering year, as opposed to `Y` which is local week-numbering year.
         *   `R` is supposed to be used in conjunction with `I` and `i`
         *   for universal ISO week-numbering date, whereas
         *   `Y` is supposed to be used in conjunction with `w` and `e`
         *   for week-numbering date specific to the locale.
         * - `P` is long localized date format
         * - `p` is long localized time format
         */

        const formatters = {
          // Era
          G: function (date, token, localize) {
            const era = date.getFullYear() > 0 ? 1 : 0;
            switch (token) {
              // AD, BC
              case "G":
              case "GG":
              case "GGG":
                return localize.era(era, {
                  width: "abbreviated"
                });
              // A, B
              case "GGGGG":
                return localize.era(era, {
                  width: "narrow"
                });
              // Anno Domini, Before Christ
              case "GGGG":
              default:
                return localize.era(era, {
                  width: "wide"
                });
            }
          },
          // Year
          y: function (date, token, localize) {
            // Ordinal number
            if (token === "yo") {
              const signedYear = date.getFullYear();
              // Returns 1 for 1 BC (which is year 0 in JavaScript)
              const year = signedYear > 0 ? signedYear : 1 - signedYear;
              return localize.ordinalNumber(year, {
                unit: "year"
              });
            }
            return lightFormatters.y(date, token);
          },
          // Local week-numbering year
          Y: function (date, token, localize, options) {
            const signedWeekYear = getWeekYear(date, options);
            // Returns 1 for 1 BC (which is year 0 in JavaScript)
            const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;

            // Two digit year
            if (token === "YY") {
              const twoDigitYear = weekYear % 100;
              return addLeadingZeros(twoDigitYear, 2);
            }

            // Ordinal number
            if (token === "Yo") {
              return localize.ordinalNumber(weekYear, {
                unit: "year"
              });
            }

            // Padding
            return addLeadingZeros(weekYear, token.length);
          },
          // ISO week-numbering year
          R: function (date, token) {
            const isoWeekYear = getISOWeekYear(date);

            // Padding
            return addLeadingZeros(isoWeekYear, token.length);
          },
          // Extended year. This is a single number designating the year of this calendar system.
          // The main difference between `y` and `u` localizers are B.C. years:
          // | Year | `y` | `u` |
          // |------|-----|-----|
          // | AC 1 |   1 |   1 |
          // | BC 1 |   1 |   0 |
          // | BC 2 |   2 |  -1 |
          // Also `yy` always returns the last two digits of a year,
          // while `uu` pads single digit years to 2 characters and returns other years unchanged.
          u: function (date, token) {
            const year = date.getFullYear();
            return addLeadingZeros(year, token.length);
          },
          // Quarter
          Q: function (date, token, localize) {
            const quarter = Math.ceil((date.getMonth() + 1) / 3);
            switch (token) {
              // 1, 2, 3, 4
              case "Q":
                return String(quarter);
              // 01, 02, 03, 04
              case "QQ":
                return addLeadingZeros(quarter, 2);
              // 1st, 2nd, 3rd, 4th
              case "Qo":
                return localize.ordinalNumber(quarter, {
                  unit: "quarter"
                });
              // Q1, Q2, Q3, Q4
              case "QQQ":
                return localize.quarter(quarter, {
                  width: "abbreviated",
                  context: "formatting"
                });
              // 1, 2, 3, 4 (narrow quarter; could be not numerical)
              case "QQQQQ":
                return localize.quarter(quarter, {
                  width: "narrow",
                  context: "formatting"
                });
              // 1st quarter, 2nd quarter, ...
              case "QQQQ":
              default:
                return localize.quarter(quarter, {
                  width: "wide",
                  context: "formatting"
                });
            }
          },
          // Stand-alone quarter
          q: function (date, token, localize) {
            const quarter = Math.ceil((date.getMonth() + 1) / 3);
            switch (token) {
              // 1, 2, 3, 4
              case "q":
                return String(quarter);
              // 01, 02, 03, 04
              case "qq":
                return addLeadingZeros(quarter, 2);
              // 1st, 2nd, 3rd, 4th
              case "qo":
                return localize.ordinalNumber(quarter, {
                  unit: "quarter"
                });
              // Q1, Q2, Q3, Q4
              case "qqq":
                return localize.quarter(quarter, {
                  width: "abbreviated",
                  context: "standalone"
                });
              // 1, 2, 3, 4 (narrow quarter; could be not numerical)
              case "qqqqq":
                return localize.quarter(quarter, {
                  width: "narrow",
                  context: "standalone"
                });
              // 1st quarter, 2nd quarter, ...
              case "qqqq":
              default:
                return localize.quarter(quarter, {
                  width: "wide",
                  context: "standalone"
                });
            }
          },
          // Month
          M: function (date, token, localize) {
            const month = date.getMonth();
            switch (token) {
              case "M":
              case "MM":
                return lightFormatters.M(date, token);
              // 1st, 2nd, ..., 12th
              case "Mo":
                return localize.ordinalNumber(month + 1, {
                  unit: "month"
                });
              // Jan, Feb, ..., Dec
              case "MMM":
                return localize.month(month, {
                  width: "abbreviated",
                  context: "formatting"
                });
              // J, F, ..., D
              case "MMMMM":
                return localize.month(month, {
                  width: "narrow",
                  context: "formatting"
                });
              // January, February, ..., December
              case "MMMM":
              default:
                return localize.month(month, {
                  width: "wide",
                  context: "formatting"
                });
            }
          },
          // Stand-alone month
          L: function (date, token, localize) {
            const month = date.getMonth();
            switch (token) {
              // 1, 2, ..., 12
              case "L":
                return String(month + 1);
              // 01, 02, ..., 12
              case "LL":
                return addLeadingZeros(month + 1, 2);
              // 1st, 2nd, ..., 12th
              case "Lo":
                return localize.ordinalNumber(month + 1, {
                  unit: "month"
                });
              // Jan, Feb, ..., Dec
              case "LLL":
                return localize.month(month, {
                  width: "abbreviated",
                  context: "standalone"
                });
              // J, F, ..., D
              case "LLLLL":
                return localize.month(month, {
                  width: "narrow",
                  context: "standalone"
                });
              // January, February, ..., December
              case "LLLL":
              default:
                return localize.month(month, {
                  width: "wide",
                  context: "standalone"
                });
            }
          },
          // Local week of year
          w: function (date, token, localize, options) {
            const week = getWeek(date, options);
            if (token === "wo") {
              return localize.ordinalNumber(week, {
                unit: "week"
              });
            }
            return addLeadingZeros(week, token.length);
          },
          // ISO week of year
          I: function (date, token, localize) {
            const isoWeek = getISOWeek(date);
            if (token === "Io") {
              return localize.ordinalNumber(isoWeek, {
                unit: "week"
              });
            }
            return addLeadingZeros(isoWeek, token.length);
          },
          // Day of the month
          d: function (date, token, localize) {
            if (token === "do") {
              return localize.ordinalNumber(date.getDate(), {
                unit: "date"
              });
            }
            return lightFormatters.d(date, token);
          },
          // Day of year
          D: function (date, token, localize) {
            const dayOfYear = getDayOfYear(date);
            if (token === "Do") {
              return localize.ordinalNumber(dayOfYear, {
                unit: "dayOfYear"
              });
            }
            return addLeadingZeros(dayOfYear, token.length);
          },
          // Day of week
          E: function (date, token, localize) {
            const dayOfWeek = date.getDay();
            switch (token) {
              // Tue
              case "E":
              case "EE":
              case "EEE":
                return localize.day(dayOfWeek, {
                  width: "abbreviated",
                  context: "formatting"
                });
              // T
              case "EEEEE":
                return localize.day(dayOfWeek, {
                  width: "narrow",
                  context: "formatting"
                });
              // Tu
              case "EEEEEE":
                return localize.day(dayOfWeek, {
                  width: "short",
                  context: "formatting"
                });
              // Tuesday
              case "EEEE":
              default:
                return localize.day(dayOfWeek, {
                  width: "wide",
                  context: "formatting"
                });
            }
          },
          // Local day of week
          e: function (date, token, localize, options) {
            const dayOfWeek = date.getDay();
            const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
            switch (token) {
              // Numerical value (Nth day of week with current locale or weekStartsOn)
              case "e":
                return String(localDayOfWeek);
              // Padded numerical value
              case "ee":
                return addLeadingZeros(localDayOfWeek, 2);
              // 1st, 2nd, ..., 7th
              case "eo":
                return localize.ordinalNumber(localDayOfWeek, {
                  unit: "day"
                });
              case "eee":
                return localize.day(dayOfWeek, {
                  width: "abbreviated",
                  context: "formatting"
                });
              // T
              case "eeeee":
                return localize.day(dayOfWeek, {
                  width: "narrow",
                  context: "formatting"
                });
              // Tu
              case "eeeeee":
                return localize.day(dayOfWeek, {
                  width: "short",
                  context: "formatting"
                });
              // Tuesday
              case "eeee":
              default:
                return localize.day(dayOfWeek, {
                  width: "wide",
                  context: "formatting"
                });
            }
          },
          // Stand-alone local day of week
          c: function (date, token, localize, options) {
            const dayOfWeek = date.getDay();
            const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
            switch (token) {
              // Numerical value (same as in `e`)
              case "c":
                return String(localDayOfWeek);
              // Padded numerical value
              case "cc":
                return addLeadingZeros(localDayOfWeek, token.length);
              // 1st, 2nd, ..., 7th
              case "co":
                return localize.ordinalNumber(localDayOfWeek, {
                  unit: "day"
                });
              case "ccc":
                return localize.day(dayOfWeek, {
                  width: "abbreviated",
                  context: "standalone"
                });
              // T
              case "ccccc":
                return localize.day(dayOfWeek, {
                  width: "narrow",
                  context: "standalone"
                });
              // Tu
              case "cccccc":
                return localize.day(dayOfWeek, {
                  width: "short",
                  context: "standalone"
                });
              // Tuesday
              case "cccc":
              default:
                return localize.day(dayOfWeek, {
                  width: "wide",
                  context: "standalone"
                });
            }
          },
          // ISO day of week
          i: function (date, token, localize) {
            const dayOfWeek = date.getDay();
            const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
            switch (token) {
              // 2
              case "i":
                return String(isoDayOfWeek);
              // 02
              case "ii":
                return addLeadingZeros(isoDayOfWeek, token.length);
              // 2nd
              case "io":
                return localize.ordinalNumber(isoDayOfWeek, {
                  unit: "day"
                });
              // Tue
              case "iii":
                return localize.day(dayOfWeek, {
                  width: "abbreviated",
                  context: "formatting"
                });
              // T
              case "iiiii":
                return localize.day(dayOfWeek, {
                  width: "narrow",
                  context: "formatting"
                });
              // Tu
              case "iiiiii":
                return localize.day(dayOfWeek, {
                  width: "short",
                  context: "formatting"
                });
              // Tuesday
              case "iiii":
              default:
                return localize.day(dayOfWeek, {
                  width: "wide",
                  context: "formatting"
                });
            }
          },
          // AM or PM
          a: function (date, token, localize) {
            const hours = date.getHours();
            const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
            switch (token) {
              case "a":
              case "aa":
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "abbreviated",
                  context: "formatting"
                });
              case "aaa":
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "abbreviated",
                  context: "formatting"
                }).toLowerCase();
              case "aaaaa":
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "narrow",
                  context: "formatting"
                });
              case "aaaa":
              default:
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "wide",
                  context: "formatting"
                });
            }
          },
          // AM, PM, midnight, noon
          b: function (date, token, localize) {
            const hours = date.getHours();
            let dayPeriodEnumValue;
            if (hours === 12) {
              dayPeriodEnumValue = dayPeriodEnum.noon;
            } else if (hours === 0) {
              dayPeriodEnumValue = dayPeriodEnum.midnight;
            } else {
              dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
            }
            switch (token) {
              case "b":
              case "bb":
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "abbreviated",
                  context: "formatting"
                });
              case "bbb":
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "abbreviated",
                  context: "formatting"
                }).toLowerCase();
              case "bbbbb":
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "narrow",
                  context: "formatting"
                });
              case "bbbb":
              default:
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "wide",
                  context: "formatting"
                });
            }
          },
          // in the morning, in the afternoon, in the evening, at night
          B: function (date, token, localize) {
            const hours = date.getHours();
            let dayPeriodEnumValue;
            if (hours >= 17) {
              dayPeriodEnumValue = dayPeriodEnum.evening;
            } else if (hours >= 12) {
              dayPeriodEnumValue = dayPeriodEnum.afternoon;
            } else if (hours >= 4) {
              dayPeriodEnumValue = dayPeriodEnum.morning;
            } else {
              dayPeriodEnumValue = dayPeriodEnum.night;
            }
            switch (token) {
              case "B":
              case "BB":
              case "BBB":
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "abbreviated",
                  context: "formatting"
                });
              case "BBBBB":
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "narrow",
                  context: "formatting"
                });
              case "BBBB":
              default:
                return localize.dayPeriod(dayPeriodEnumValue, {
                  width: "wide",
                  context: "formatting"
                });
            }
          },
          // Hour [1-12]
          h: function (date, token, localize) {
            if (token === "ho") {
              let hours = date.getHours() % 12;
              if (hours === 0) hours = 12;
              return localize.ordinalNumber(hours, {
                unit: "hour"
              });
            }
            return lightFormatters.h(date, token);
          },
          // Hour [0-23]
          H: function (date, token, localize) {
            if (token === "Ho") {
              return localize.ordinalNumber(date.getHours(), {
                unit: "hour"
              });
            }
            return lightFormatters.H(date, token);
          },
          // Hour [0-11]
          K: function (date, token, localize) {
            const hours = date.getHours() % 12;
            if (token === "Ko") {
              return localize.ordinalNumber(hours, {
                unit: "hour"
              });
            }
            return addLeadingZeros(hours, token.length);
          },
          // Hour [1-24]
          k: function (date, token, localize) {
            let hours = date.getHours();
            if (hours === 0) hours = 24;
            if (token === "ko") {
              return localize.ordinalNumber(hours, {
                unit: "hour"
              });
            }
            return addLeadingZeros(hours, token.length);
          },
          // Minute
          m: function (date, token, localize) {
            if (token === "mo") {
              return localize.ordinalNumber(date.getMinutes(), {
                unit: "minute"
              });
            }
            return lightFormatters.m(date, token);
          },
          // Second
          s: function (date, token, localize) {
            if (token === "so") {
              return localize.ordinalNumber(date.getSeconds(), {
                unit: "second"
              });
            }
            return lightFormatters.s(date, token);
          },
          // Fraction of second
          S: function (date, token) {
            return lightFormatters.S(date, token);
          },
          // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
          X: function (date, token, _localize) {
            const timezoneOffset = date.getTimezoneOffset();
            if (timezoneOffset === 0) {
              return "Z";
            }
            switch (token) {
              // Hours and optional minutes
              case "X":
                return formatTimezoneWithOptionalMinutes(timezoneOffset);

              // Hours, minutes and optional seconds without `:` delimiter
              // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
              // so this token always has the same output as `XX`
              case "XXXX":
              case "XX":
                // Hours and minutes without `:` delimiter
                return formatTimezone(timezoneOffset);

              // Hours, minutes and optional seconds with `:` delimiter
              // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
              // so this token always has the same output as `XXX`
              case "XXXXX":
              case "XXX": // Hours and minutes with `:` delimiter
              default:
                return formatTimezone(timezoneOffset, ":");
            }
          },
          // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
          x: function (date, token, _localize) {
            const timezoneOffset = date.getTimezoneOffset();
            switch (token) {
              // Hours and optional minutes
              case "x":
                return formatTimezoneWithOptionalMinutes(timezoneOffset);

              // Hours, minutes and optional seconds without `:` delimiter
              // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
              // so this token always has the same output as `xx`
              case "xxxx":
              case "xx":
                // Hours and minutes without `:` delimiter
                return formatTimezone(timezoneOffset);

              // Hours, minutes and optional seconds with `:` delimiter
              // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
              // so this token always has the same output as `xxx`
              case "xxxxx":
              case "xxx": // Hours and minutes with `:` delimiter
              default:
                return formatTimezone(timezoneOffset, ":");
            }
          },
          // Timezone (GMT)
          O: function (date, token, _localize) {
            const timezoneOffset = date.getTimezoneOffset();
            switch (token) {
              // Short
              case "O":
              case "OO":
              case "OOO":
                return "GMT" + formatTimezoneShort(timezoneOffset, ":");
              // Long
              case "OOOO":
              default:
                return "GMT" + formatTimezone(timezoneOffset, ":");
            }
          },
          // Timezone (specific non-location)
          z: function (date, token, _localize) {
            const timezoneOffset = date.getTimezoneOffset();
            switch (token) {
              // Short
              case "z":
              case "zz":
              case "zzz":
                return "GMT" + formatTimezoneShort(timezoneOffset, ":");
              // Long
              case "zzzz":
              default:
                return "GMT" + formatTimezone(timezoneOffset, ":");
            }
          },
          // Seconds timestamp
          t: function (date, token, _localize) {
            const timestamp = Math.trunc(date.getTime() / 1000);
            return addLeadingZeros(timestamp, token.length);
          },
          // Milliseconds timestamp
          T: function (date, token, _localize) {
            const timestamp = date.getTime();
            return addLeadingZeros(timestamp, token.length);
          }
        };
        function formatTimezoneShort(offset, delimiter = "") {
          const sign = offset > 0 ? "-" : "+";
          const absOffset = Math.abs(offset);
          const hours = Math.trunc(absOffset / 60);
          const minutes = absOffset % 60;
          if (minutes === 0) {
            return sign + String(hours);
          }
          return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
        }
        function formatTimezoneWithOptionalMinutes(offset, delimiter) {
          if (offset % 60 === 0) {
            const sign = offset > 0 ? "-" : "+";
            return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
          }
          return formatTimezone(offset, delimiter);
        }
        function formatTimezone(offset, delimiter = "") {
          const sign = offset > 0 ? "-" : "+";
          const absOffset = Math.abs(offset);
          const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
          const minutes = addLeadingZeros(absOffset % 60, 2);
          return sign + hours + delimiter + minutes;
        }
        const dateLongFormatter = (pattern, formatLong) => {
          switch (pattern) {
            case "P":
              return formatLong.date({
                width: "short"
              });
            case "PP":
              return formatLong.date({
                width: "medium"
              });
            case "PPP":
              return formatLong.date({
                width: "long"
              });
            case "PPPP":
            default:
              return formatLong.date({
                width: "full"
              });
          }
        };
        const timeLongFormatter = (pattern, formatLong) => {
          switch (pattern) {
            case "p":
              return formatLong.time({
                width: "short"
              });
            case "pp":
              return formatLong.time({
                width: "medium"
              });
            case "ppp":
              return formatLong.time({
                width: "long"
              });
            case "pppp":
            default:
              return formatLong.time({
                width: "full"
              });
          }
        };
        const dateTimeLongFormatter = (pattern, formatLong) => {
          const matchResult = pattern.match(/(P+)(p+)?/) || [];
          const datePattern = matchResult[1];
          const timePattern = matchResult[2];
          if (!timePattern) {
            return dateLongFormatter(pattern, formatLong);
          }
          let dateTimeFormat;
          switch (datePattern) {
            case "P":
              dateTimeFormat = formatLong.dateTime({
                width: "short"
              });
              break;
            case "PP":
              dateTimeFormat = formatLong.dateTime({
                width: "medium"
              });
              break;
            case "PPP":
              dateTimeFormat = formatLong.dateTime({
                width: "long"
              });
              break;
            case "PPPP":
            default:
              dateTimeFormat = formatLong.dateTime({
                width: "full"
              });
              break;
          }
          return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong)).replace("{{time}}", timeLongFormatter(timePattern, formatLong));
        };
        const longFormatters = {
          p: timeLongFormatter,
          P: dateTimeLongFormatter
        };
        const dayOfYearTokenRE = /^D+$/;
        const weekYearTokenRE = /^Y+$/;
        const throwTokens = ["D", "DD", "YY", "YYYY"];
        function isProtectedDayOfYearToken(token) {
          return dayOfYearTokenRE.test(token);
        }
        function isProtectedWeekYearToken(token) {
          return weekYearTokenRE.test(token);
        }
        function warnOrThrowProtectedError(token, format, input) {
          const _message = message(token, format, input);
          console.warn(_message);
          if (throwTokens.includes(token)) throw new RangeError(_message);
        }
        function message(token, format, input) {
          const subject = token[0] === "Y" ? "years" : "days of the month";
          return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
        }

        // This RegExp consists of three parts separated by `|`:
        // - [yYQqMLwIdDecihHKkms]o matches any available ordinal number token
        //   (one of the certain letters followed by `o`)
        // - (\w)\1* matches any sequences of the same letter
        // - '' matches two quote characters in a row
        // - '(''|[^'])+('|$) matches anything surrounded by two quote characters ('),
        //   except a single quote symbol, which ends the sequence.
        //   Two quote characters do not end the sequence.
        //   If there is no matching single quote
        //   then the sequence will continue until the end of the string.
        // - . matches any single character unmatched by previous parts of the RegExps
        const formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;

        // This RegExp catches symbols escaped by quotes, and also
        // sequences of symbols P, p, and the combinations like `PPPPPPPppppp`
        const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
        const escapedStringRegExp = /^'([^]*?)'?$/;
        const doubleQuoteRegExp = /''/g;
        const unescapedLatinCharacterRegExp = /[a-zA-Z]/;

        /**
         * The {@link format} function options.
         */

        /**
         * @name format
         * @alias formatDate
         * @category Common Helpers
         * @summary Format the date.
         *
         * @description
         * Return the formatted date string in the given format. The result may vary by locale.
         *
         * > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
         * > See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
         *
         * The characters wrapped between two single quotes characters (') are escaped.
         * Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
         * (see the last example)
         *
         * Format of the string is based on Unicode Technical Standard #35:
         * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
         * with a few additions (see note 7 below the table).
         *
         * Accepted patterns:
         * | Unit                            | Pattern | Result examples                   | Notes |
         * |---------------------------------|---------|-----------------------------------|-------|
         * | Era                             | G..GGG  | AD, BC                            |       |
         * |                                 | GGGG    | Anno Domini, Before Christ        | 2     |
         * |                                 | GGGGG   | A, B                              |       |
         * | Calendar year                   | y       | 44, 1, 1900, 2017                 | 5     |
         * |                                 | yo      | 44th, 1st, 0th, 17th              | 5,7   |
         * |                                 | yy      | 44, 01, 00, 17                    | 5     |
         * |                                 | yyy     | 044, 001, 1900, 2017              | 5     |
         * |                                 | yyyy    | 0044, 0001, 1900, 2017            | 5     |
         * |                                 | yyyyy   | ...                               | 3,5   |
         * | Local week-numbering year       | Y       | 44, 1, 1900, 2017                 | 5     |
         * |                                 | Yo      | 44th, 1st, 1900th, 2017th         | 5,7   |
         * |                                 | YY      | 44, 01, 00, 17                    | 5,8   |
         * |                                 | YYY     | 044, 001, 1900, 2017              | 5     |
         * |                                 | YYYY    | 0044, 0001, 1900, 2017            | 5,8   |
         * |                                 | YYYYY   | ...                               | 3,5   |
         * | ISO week-numbering year         | R       | -43, 0, 1, 1900, 2017             | 5,7   |
         * |                                 | RR      | -43, 00, 01, 1900, 2017           | 5,7   |
         * |                                 | RRR     | -043, 000, 001, 1900, 2017        | 5,7   |
         * |                                 | RRRR    | -0043, 0000, 0001, 1900, 2017     | 5,7   |
         * |                                 | RRRRR   | ...                               | 3,5,7 |
         * | Extended year                   | u       | -43, 0, 1, 1900, 2017             | 5     |
         * |                                 | uu      | -43, 01, 1900, 2017               | 5     |
         * |                                 | uuu     | -043, 001, 1900, 2017             | 5     |
         * |                                 | uuuu    | -0043, 0001, 1900, 2017           | 5     |
         * |                                 | uuuuu   | ...                               | 3,5   |
         * | Quarter (formatting)            | Q       | 1, 2, 3, 4                        |       |
         * |                                 | Qo      | 1st, 2nd, 3rd, 4th                | 7     |
         * |                                 | QQ      | 01, 02, 03, 04                    |       |
         * |                                 | QQQ     | Q1, Q2, Q3, Q4                    |       |
         * |                                 | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
         * |                                 | QQQQQ   | 1, 2, 3, 4                        | 4     |
         * | Quarter (stand-alone)           | q       | 1, 2, 3, 4                        |       |
         * |                                 | qo      | 1st, 2nd, 3rd, 4th                | 7     |
         * |                                 | qq      | 01, 02, 03, 04                    |       |
         * |                                 | qqq     | Q1, Q2, Q3, Q4                    |       |
         * |                                 | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
         * |                                 | qqqqq   | 1, 2, 3, 4                        | 4     |
         * | Month (formatting)              | M       | 1, 2, ..., 12                     |       |
         * |                                 | Mo      | 1st, 2nd, ..., 12th               | 7     |
         * |                                 | MM      | 01, 02, ..., 12                   |       |
         * |                                 | MMM     | Jan, Feb, ..., Dec                |       |
         * |                                 | MMMM    | January, February, ..., December  | 2     |
         * |                                 | MMMMM   | J, F, ..., D                      |       |
         * | Month (stand-alone)             | L       | 1, 2, ..., 12                     |       |
         * |                                 | Lo      | 1st, 2nd, ..., 12th               | 7     |
         * |                                 | LL      | 01, 02, ..., 12                   |       |
         * |                                 | LLL     | Jan, Feb, ..., Dec                |       |
         * |                                 | LLLL    | January, February, ..., December  | 2     |
         * |                                 | LLLLL   | J, F, ..., D                      |       |
         * | Local week of year              | w       | 1, 2, ..., 53                     |       |
         * |                                 | wo      | 1st, 2nd, ..., 53th               | 7     |
         * |                                 | ww      | 01, 02, ..., 53                   |       |
         * | ISO week of year                | I       | 1, 2, ..., 53                     | 7     |
         * |                                 | Io      | 1st, 2nd, ..., 53th               | 7     |
         * |                                 | II      | 01, 02, ..., 53                   | 7     |
         * | Day of month                    | d       | 1, 2, ..., 31                     |       |
         * |                                 | do      | 1st, 2nd, ..., 31st               | 7     |
         * |                                 | dd      | 01, 02, ..., 31                   |       |
         * | Day of year                     | D       | 1, 2, ..., 365, 366               | 9     |
         * |                                 | Do      | 1st, 2nd, ..., 365th, 366th       | 7     |
         * |                                 | DD      | 01, 02, ..., 365, 366             | 9     |
         * |                                 | DDD     | 001, 002, ..., 365, 366           |       |
         * |                                 | DDDD    | ...                               | 3     |
         * | Day of week (formatting)        | E..EEE  | Mon, Tue, Wed, ..., Sun           |       |
         * |                                 | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
         * |                                 | EEEEE   | M, T, W, T, F, S, S               |       |
         * |                                 | EEEEEE  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
         * | ISO day of week (formatting)    | i       | 1, 2, 3, ..., 7                   | 7     |
         * |                                 | io      | 1st, 2nd, ..., 7th                | 7     |
         * |                                 | ii      | 01, 02, ..., 07                   | 7     |
         * |                                 | iii     | Mon, Tue, Wed, ..., Sun           | 7     |
         * |                                 | iiii    | Monday, Tuesday, ..., Sunday      | 2,7   |
         * |                                 | iiiii   | M, T, W, T, F, S, S               | 7     |
         * |                                 | iiiiii  | Mo, Tu, We, Th, Fr, Sa, Su        | 7     |
         * | Local day of week (formatting)  | e       | 2, 3, 4, ..., 1                   |       |
         * |                                 | eo      | 2nd, 3rd, ..., 1st                | 7     |
         * |                                 | ee      | 02, 03, ..., 01                   |       |
         * |                                 | eee     | Mon, Tue, Wed, ..., Sun           |       |
         * |                                 | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
         * |                                 | eeeee   | M, T, W, T, F, S, S               |       |
         * |                                 | eeeeee  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
         * | Local day of week (stand-alone) | c       | 2, 3, 4, ..., 1                   |       |
         * |                                 | co      | 2nd, 3rd, ..., 1st                | 7     |
         * |                                 | cc      | 02, 03, ..., 01                   |       |
         * |                                 | ccc     | Mon, Tue, Wed, ..., Sun           |       |
         * |                                 | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
         * |                                 | ccccc   | M, T, W, T, F, S, S               |       |
         * |                                 | cccccc  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
         * | AM, PM                          | a..aa   | AM, PM                            |       |
         * |                                 | aaa     | am, pm                            |       |
         * |                                 | aaaa    | a.m., p.m.                        | 2     |
         * |                                 | aaaaa   | a, p                              |       |
         * | AM, PM, noon, midnight          | b..bb   | AM, PM, noon, midnight            |       |
         * |                                 | bbb     | am, pm, noon, midnight            |       |
         * |                                 | bbbb    | a.m., p.m., noon, midnight        | 2     |
         * |                                 | bbbbb   | a, p, n, mi                       |       |
         * | Flexible day period             | B..BBB  | at night, in the morning, ...     |       |
         * |                                 | BBBB    | at night, in the morning, ...     | 2     |
         * |                                 | BBBBB   | at night, in the morning, ...     |       |
         * | Hour [1-12]                     | h       | 1, 2, ..., 11, 12                 |       |
         * |                                 | ho      | 1st, 2nd, ..., 11th, 12th         | 7     |
         * |                                 | hh      | 01, 02, ..., 11, 12               |       |
         * | Hour [0-23]                     | H       | 0, 1, 2, ..., 23                  |       |
         * |                                 | Ho      | 0th, 1st, 2nd, ..., 23rd          | 7     |
         * |                                 | HH      | 00, 01, 02, ..., 23               |       |
         * | Hour [0-11]                     | K       | 1, 2, ..., 11, 0                  |       |
         * |                                 | Ko      | 1st, 2nd, ..., 11th, 0th          | 7     |
         * |                                 | KK      | 01, 02, ..., 11, 00               |       |
         * | Hour [1-24]                     | k       | 24, 1, 2, ..., 23                 |       |
         * |                                 | ko      | 24th, 1st, 2nd, ..., 23rd         | 7     |
         * |                                 | kk      | 24, 01, 02, ..., 23               |       |
         * | Minute                          | m       | 0, 1, ..., 59                     |       |
         * |                                 | mo      | 0th, 1st, ..., 59th               | 7     |
         * |                                 | mm      | 00, 01, ..., 59                   |       |
         * | Second                          | s       | 0, 1, ..., 59                     |       |
         * |                                 | so      | 0th, 1st, ..., 59th               | 7     |
         * |                                 | ss      | 00, 01, ..., 59                   |       |
         * | Fraction of second              | S       | 0, 1, ..., 9                      |       |
         * |                                 | SS      | 00, 01, ..., 99                   |       |
         * |                                 | SSS     | 000, 001, ..., 999                |       |
         * |                                 | SSSS    | ...                               | 3     |
         * | Timezone (ISO-8601 w/ Z)        | X       | -08, +0530, Z                     |       |
         * |                                 | XX      | -0800, +0530, Z                   |       |
         * |                                 | XXX     | -08:00, +05:30, Z                 |       |
         * |                                 | XXXX    | -0800, +0530, Z, +123456          | 2     |
         * |                                 | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
         * | Timezone (ISO-8601 w/o Z)       | x       | -08, +0530, +00                   |       |
         * |                                 | xx      | -0800, +0530, +0000               |       |
         * |                                 | xxx     | -08:00, +05:30, +00:00            | 2     |
         * |                                 | xxxx    | -0800, +0530, +0000, +123456      |       |
         * |                                 | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
         * | Timezone (GMT)                  | O...OOO | GMT-8, GMT+5:30, GMT+0            |       |
         * |                                 | OOOO    | GMT-08:00, GMT+05:30, GMT+00:00   | 2     |
         * | Timezone (specific non-locat.)  | z...zzz | GMT-8, GMT+5:30, GMT+0            | 6     |
         * |                                 | zzzz    | GMT-08:00, GMT+05:30, GMT+00:00   | 2,6   |
         * | Seconds timestamp               | t       | 512969520                         | 7     |
         * |                                 | tt      | ...                               | 3,7   |
         * | Milliseconds timestamp          | T       | 512969520900                      | 7     |
         * |                                 | TT      | ...                               | 3,7   |
         * | Long localized date             | P       | 04/29/1453                        | 7     |
         * |                                 | PP      | Apr 29, 1453                      | 7     |
         * |                                 | PPP     | April 29th, 1453                  | 7     |
         * |                                 | PPPP    | Friday, April 29th, 1453          | 2,7   |
         * | Long localized time             | p       | 12:00 AM                          | 7     |
         * |                                 | pp      | 12:00:00 AM                       | 7     |
         * |                                 | ppp     | 12:00:00 AM GMT+2                 | 7     |
         * |                                 | pppp    | 12:00:00 AM GMT+02:00             | 2,7   |
         * | Combination of date and time    | Pp      | 04/29/1453, 12:00 AM              | 7     |
         * |                                 | PPpp    | Apr 29, 1453, 12:00:00 AM         | 7     |
         * |                                 | PPPppp  | April 29th, 1453 at ...           | 7     |
         * |                                 | PPPPpppp| Friday, April 29th, 1453 at ...   | 2,7   |
         * Notes:
         * 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
         *    are the same as "stand-alone" units, but are different in some languages.
         *    "Formatting" units are declined according to the rules of the language
         *    in the context of a date. "Stand-alone" units are always nominative singular:
         *
         *    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
         *
         *    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
         *
         * 2. Any sequence of the identical letters is a pattern, unless it is escaped by
         *    the single quote characters (see below).
         *    If the sequence is longer than listed in table (e.g. `EEEEEEEEEEE`)
         *    the output will be the same as default pattern for this unit, usually
         *    the longest one (in case of ISO weekdays, `EEEE`). Default patterns for units
         *    are marked with "2" in the last column of the table.
         *
         *    `format(new Date(2017, 10, 6), 'MMM') //=> 'Nov'`
         *
         *    `format(new Date(2017, 10, 6), 'MMMM') //=> 'November'`
         *
         *    `format(new Date(2017, 10, 6), 'MMMMM') //=> 'N'`
         *
         *    `format(new Date(2017, 10, 6), 'MMMMMM') //=> 'November'`
         *
         *    `format(new Date(2017, 10, 6), 'MMMMMMM') //=> 'November'`
         *
         * 3. Some patterns could be unlimited length (such as `yyyyyyyy`).
         *    The output will be padded with zeros to match the length of the pattern.
         *
         *    `format(new Date(2017, 10, 6), 'yyyyyyyy') //=> '00002017'`
         *
         * 4. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
         *    These tokens represent the shortest form of the quarter.
         *
         * 5. The main difference between `y` and `u` patterns are B.C. years:
         *
         *    | Year | `y` | `u` |
         *    |------|-----|-----|
         *    | AC 1 |   1 |   1 |
         *    | BC 1 |   1 |   0 |
         *    | BC 2 |   2 |  -1 |
         *
         *    Also `yy` always returns the last two digits of a year,
         *    while `uu` pads single digit years to 2 characters and returns other years unchanged:
         *
         *    | Year | `yy` | `uu` |
         *    |------|------|------|
         *    | 1    |   01 |   01 |
         *    | 14   |   14 |   14 |
         *    | 376  |   76 |  376 |
         *    | 1453 |   53 | 1453 |
         *
         *    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
         *    except local week-numbering years are dependent on `options.weekStartsOn`
         *    and `options.firstWeekContainsDate` (compare [getISOWeekYear](https://date-fns.org/docs/getISOWeekYear)
         *    and [getWeekYear](https://date-fns.org/docs/getWeekYear)).
         *
         * 6. Specific non-location timezones are currently unavailable in `date-fns`,
         *    so right now these tokens fall back to GMT timezones.
         *
         * 7. These patterns are not in the Unicode Technical Standard #35:
         *    - `i`: ISO day of week
         *    - `I`: ISO week of year
         *    - `R`: ISO week-numbering year
         *    - `t`: seconds timestamp
         *    - `T`: milliseconds timestamp
         *    - `o`: ordinal number modifier
         *    - `P`: long localized date
         *    - `p`: long localized time
         *
         * 8. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
         *    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
         *
         * 9. `D` and `DD` tokens represent days of the year but they are often confused with days of the month.
         *    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The original date
         * @param format - The string of tokens
         * @param options - An object with options
         *
         * @returns The formatted date string
         *
         * @throws `date` must not be Invalid Date
         * @throws `options.locale` must contain `localize` property
         * @throws `options.locale` must contain `formatLong` property
         * @throws use `yyyy` instead of `YYYY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
         * @throws use `yy` instead of `YY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
         * @throws use `d` instead of `D` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
         * @throws use `dd` instead of `DD` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
         * @throws format string contains an unescaped latin alphabet character
         *
         * @example
         * // Represent 11 February 2014 in middle-endian format:
         * const result = format(new Date(2014, 1, 11), 'MM/dd/yyyy')
         * //=> '02/11/2014'
         *
         * @example
         * // Represent 2 July 2014 in Esperanto:
         * import { eoLocale } from 'date-fns/locale/eo'
         * const result = format(new Date(2014, 6, 2), "do 'de' MMMM yyyy", {
         *   locale: eoLocale
         * })
         * //=> '2-a de julio 2014'
         *
         * @example
         * // Escape string by single quote characters:
         * const result = format(new Date(2014, 6, 2, 15), "h 'o''clock'")
         * //=> "3 o'clock"
         */
        function format(date, formatStr, options) {
          const defaultOptions = getDefaultOptions();
          const locale = defaultOptions.locale ?? enUS;
          const firstWeekContainsDate = defaultOptions.firstWeekContainsDate ?? defaultOptions.locale?.options?.firstWeekContainsDate ?? 1;
          const weekStartsOn = defaultOptions.weekStartsOn ?? defaultOptions.locale?.options?.weekStartsOn ?? 0;
          const originalDate = toDate(date);
          if (!isValid(originalDate)) {
            throw new RangeError("Invalid time value");
          }
          let parts = formatStr.match(longFormattingTokensRegExp).map(substring => {
            const firstCharacter = substring[0];
            if (firstCharacter === "p" || firstCharacter === "P") {
              const longFormatter = longFormatters[firstCharacter];
              return longFormatter(substring, locale.formatLong);
            }
            return substring;
          }).join("").match(formattingTokensRegExp).map(substring => {
            // Replace two single quote characters with one single quote character
            if (substring === "''") {
              return {
                isToken: false,
                value: "'"
              };
            }
            const firstCharacter = substring[0];
            if (firstCharacter === "'") {
              return {
                isToken: false,
                value: cleanEscapedString(substring)
              };
            }
            if (formatters[firstCharacter]) {
              return {
                isToken: true,
                value: substring
              };
            }
            if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
              throw new RangeError("Format string contains an unescaped latin alphabet character `" + firstCharacter + "`");
            }
            return {
              isToken: false,
              value: substring
            };
          });

          // invoke localize preprocessor (only for french locales at the moment)
          if (locale.localize.preprocessor) {
            parts = locale.localize.preprocessor(originalDate, parts);
          }
          const formatterOptions = {
            firstWeekContainsDate,
            weekStartsOn,
            locale
          };
          return parts.map(part => {
            if (!part.isToken) return part.value;
            const token = part.value;
            if (isProtectedWeekYearToken(token) || isProtectedDayOfYearToken(token)) {
              warnOrThrowProtectedError(token, formatStr, String(date));
            }
            const formatter = formatters[token[0]];
            return formatter(originalDate, token, locale.localize, formatterOptions);
          }).join("");
        }
        function cleanEscapedString(input) {
          const matched = input.match(escapedStringRegExp);
          if (!matched) {
            return input;
          }
          return matched[1].replace(doubleQuoteRegExp, "'");
        }

        /**
         * The {@link formatDistance} function options.
         */

        /**
         * @name formatDistance
         * @category Common Helpers
         * @summary Return the distance between the given dates in words.
         *
         * @description
         * Return the distance between the given dates in words.
         *
         * | Distance between dates                                            | Result              |
         * |-------------------------------------------------------------------|---------------------|
         * | 0 ... 30 secs                                                     | less than a minute  |
         * | 30 secs ... 1 min 30 secs                                         | 1 minute            |
         * | 1 min 30 secs ... 44 mins 30 secs                                 | [2..44] minutes     |
         * | 44 mins ... 30 secs ... 89 mins 30 secs                           | about 1 hour        |
         * | 89 mins 30 secs ... 23 hrs 59 mins 30 secs                        | about [2..24] hours |
         * | 23 hrs 59 mins 30 secs ... 41 hrs 59 mins 30 secs                 | 1 day               |
         * | 41 hrs 59 mins 30 secs ... 29 days 23 hrs 59 mins 30 secs         | [2..30] days        |
         * | 29 days 23 hrs 59 mins 30 secs ... 44 days 23 hrs 59 mins 30 secs | about 1 month       |
         * | 44 days 23 hrs 59 mins 30 secs ... 59 days 23 hrs 59 mins 30 secs | about 2 months      |
         * | 59 days 23 hrs 59 mins 30 secs ... 1 yr                           | [2..12] months      |
         * | 1 yr ... 1 yr 3 months                                            | about 1 year        |
         * | 1 yr 3 months ... 1 yr 9 month s                                  | over 1 year         |
         * | 1 yr 9 months ... 2 yrs                                           | almost 2 years      |
         * | N yrs ... N yrs 3 months                                          | about N years       |
         * | N yrs 3 months ... N yrs 9 months                                 | over N years        |
         * | N yrs 9 months ... N+1 yrs                                        | almost N+1 years    |
         *
         * With `options.includeSeconds == true`:
         * | Distance between dates | Result               |
         * |------------------------|----------------------|
         * | 0 secs ... 5 secs      | less than 5 seconds  |
         * | 5 secs ... 10 secs     | less than 10 seconds |
         * | 10 secs ... 20 secs    | less than 20 seconds |
         * | 20 secs ... 40 secs    | half a minute        |
         * | 40 secs ... 60 secs    | less than a minute   |
         * | 60 secs ... 90 secs    | 1 minute             |
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The date
         * @param baseDate - The date to compare with
         * @param options - An object with options
         *
         * @returns The distance in words
         *
         * @throws `date` must not be Invalid Date
         * @throws `baseDate` must not be Invalid Date
         * @throws `options.locale` must contain `formatDistance` property
         *
         * @example
         * // What is the distance between 2 July 2014 and 1 January 2015?
         * const result = formatDistance(new Date(2014, 6, 2), new Date(2015, 0, 1))
         * //=> '6 months'
         *
         * @example
         * // What is the distance between 1 January 2015 00:00:15
         * // and 1 January 2015 00:00:00, including seconds?
         * const result = formatDistance(
         *   new Date(2015, 0, 1, 0, 0, 15),
         *   new Date(2015, 0, 1, 0, 0, 0),
         *   { includeSeconds: true }
         * )
         * //=> 'less than 20 seconds'
         *
         * @example
         * // What is the distance from 1 January 2016
         * // to 1 January 2015, with a suffix?
         * const result = formatDistance(new Date(2015, 0, 1), new Date(2016, 0, 1), {
         *   addSuffix: true
         * })
         * //=> 'about 1 year ago'
         *
         * @example
         * // What is the distance between 1 August 2016 and 1 January 2015 in Esperanto?
         * import { eoLocale } from 'date-fns/locale/eo'
         * const result = formatDistance(new Date(2016, 7, 1), new Date(2015, 0, 1), {
         *   locale: eoLocale
         * })
         * //=> 'pli ol 1 jaro'
         */

        function formatDistance(date, baseDate, options) {
          const defaultOptions = getDefaultOptions();
          const locale = options?.locale ?? defaultOptions.locale ?? enUS;
          const minutesInAlmostTwoDays = 2520;
          const comparison = compareAsc(date, baseDate);
          if (isNaN(comparison)) {
            throw new RangeError("Invalid time value");
          }
          const localizeOptions = Object.assign({}, options, {
            addSuffix: options?.addSuffix,
            comparison: comparison
          });
          let dateLeft;
          let dateRight;
          if (comparison > 0) {
            dateLeft = toDate(baseDate);
            dateRight = toDate(date);
          } else {
            dateLeft = toDate(date);
            dateRight = toDate(baseDate);
          }
          const seconds = differenceInSeconds(dateRight, dateLeft);
          const offsetInSeconds = (getTimezoneOffsetInMilliseconds(dateRight) - getTimezoneOffsetInMilliseconds(dateLeft)) / 1000;
          const minutes = Math.round((seconds - offsetInSeconds) / 60);
          let months;

          // 0 up to 2 mins
          if (minutes < 2) {
            if (options?.includeSeconds) {
              if (seconds < 5) {
                return locale.formatDistance("lessThanXSeconds", 5, localizeOptions);
              } else if (seconds < 10) {
                return locale.formatDistance("lessThanXSeconds", 10, localizeOptions);
              } else if (seconds < 20) {
                return locale.formatDistance("lessThanXSeconds", 20, localizeOptions);
              } else if (seconds < 40) {
                return locale.formatDistance("halfAMinute", 0, localizeOptions);
              } else if (seconds < 60) {
                return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
              } else {
                return locale.formatDistance("xMinutes", 1, localizeOptions);
              }
            } else {
              if (minutes === 0) {
                return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);
              } else {
                return locale.formatDistance("xMinutes", minutes, localizeOptions);
              }
            }

            // 2 mins up to 0.75 hrs
          } else if (minutes < 45) {
            return locale.formatDistance("xMinutes", minutes, localizeOptions);

            // 0.75 hrs up to 1.5 hrs
          } else if (minutes < 90) {
            return locale.formatDistance("aboutXHours", 1, localizeOptions);

            // 1.5 hrs up to 24 hrs
          } else if (minutes < minutesInDay) {
            const hours = Math.round(minutes / 60);
            return locale.formatDistance("aboutXHours", hours, localizeOptions);

            // 1 day up to 1.75 days
          } else if (minutes < minutesInAlmostTwoDays) {
            return locale.formatDistance("xDays", 1, localizeOptions);

            // 1.75 days up to 30 days
          } else if (minutes < minutesInMonth) {
            const days = Math.round(minutes / minutesInDay);
            return locale.formatDistance("xDays", days, localizeOptions);

            // 1 month up to 2 months
          } else if (minutes < minutesInMonth * 2) {
            months = Math.round(minutes / minutesInMonth);
            return locale.formatDistance("aboutXMonths", months, localizeOptions);
          }
          months = differenceInMonths(dateRight, dateLeft);

          // 2 months up to 12 months
          if (months < 12) {
            const nearestMonth = Math.round(minutes / minutesInMonth);
            return locale.formatDistance("xMonths", nearestMonth, localizeOptions);

            // 1 year up to max Date
          } else {
            const monthsSinceStartOfYear = months % 12;
            const years = Math.trunc(months / 12);

            // N years up to 1 years 3 months
            if (monthsSinceStartOfYear < 3) {
              return locale.formatDistance("aboutXYears", years, localizeOptions);

              // N years 3 months up to N years 9 months
            } else if (monthsSinceStartOfYear < 9) {
              return locale.formatDistance("overXYears", years, localizeOptions);

              // N years 9 months up to N year 12 months
            } else {
              return locale.formatDistance("almostXYears", years + 1, localizeOptions);
            }
          }
        }

        /**
         * The {@link formatDistanceToNow} function options.
         */

        /**
         * @name formatDistanceToNow
         * @category Common Helpers
         * @summary Return the distance between the given date and now in words.
         * @pure false
         *
         * @description
         * Return the distance between the given date and now in words.
         *
         * | Distance to now                                                   | Result              |
         * |-------------------------------------------------------------------|---------------------|
         * | 0 ... 30 secs                                                     | less than a minute  |
         * | 30 secs ... 1 min 30 secs                                         | 1 minute            |
         * | 1 min 30 secs ... 44 mins 30 secs                                 | [2..44] minutes     |
         * | 44 mins ... 30 secs ... 89 mins 30 secs                           | about 1 hour        |
         * | 89 mins 30 secs ... 23 hrs 59 mins 30 secs                        | about [2..24] hours |
         * | 23 hrs 59 mins 30 secs ... 41 hrs 59 mins 30 secs                 | 1 day               |
         * | 41 hrs 59 mins 30 secs ... 29 days 23 hrs 59 mins 30 secs         | [2..30] days        |
         * | 29 days 23 hrs 59 mins 30 secs ... 44 days 23 hrs 59 mins 30 secs | about 1 month       |
         * | 44 days 23 hrs 59 mins 30 secs ... 59 days 23 hrs 59 mins 30 secs | about 2 months      |
         * | 59 days 23 hrs 59 mins 30 secs ... 1 yr                           | [2..12] months      |
         * | 1 yr ... 1 yr 3 months                                            | about 1 year        |
         * | 1 yr 3 months ... 1 yr 9 month s                                  | over 1 year         |
         * | 1 yr 9 months ... 2 yrs                                           | almost 2 years      |
         * | N yrs ... N yrs 3 months                                          | about N years       |
         * | N yrs 3 months ... N yrs 9 months                                 | over N years        |
         * | N yrs 9 months ... N+1 yrs                                        | almost N+1 years    |
         *
         * With `options.includeSeconds == true`:
         * | Distance to now     | Result               |
         * |---------------------|----------------------|
         * | 0 secs ... 5 secs   | less than 5 seconds  |
         * | 5 secs ... 10 secs  | less than 10 seconds |
         * | 10 secs ... 20 secs | less than 20 seconds |
         * | 20 secs ... 40 secs | half a minute        |
         * | 40 secs ... 60 secs | less than a minute   |
         * | 60 secs ... 90 secs | 1 minute             |
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The given date
         * @param options - The object with options
         *
         * @returns The distance in words
         *
         * @throws `date` must not be Invalid Date
         * @throws `options.locale` must contain `formatDistance` property
         *
         * @example
         * // If today is 1 January 2015, what is the distance to 2 July 2014?
         * const result = formatDistanceToNow(
         *   new Date(2014, 6, 2)
         * )
         * //=> '6 months'
         *
         * @example
         * // If now is 1 January 2015 00:00:00,
         * // what is the distance to 1 January 2015 00:00:15, including seconds?
         * const result = formatDistanceToNow(
         *   new Date(2015, 0, 1, 0, 0, 15),
         *   {includeSeconds: true}
         * )
         * //=> 'less than 20 seconds'
         *
         * @example
         * // If today is 1 January 2015,
         * // what is the distance to 1 January 2016, with a suffix?
         * const result = formatDistanceToNow(
         *   new Date(2016, 0, 1),
         *   {addSuffix: true}
         * )
         * //=> 'in about 1 year'
         *
         * @example
         * // If today is 1 January 2015,
         * // what is the distance to 1 August 2016 in Esperanto?
         * const eoLocale = require('date-fns/locale/eo')
         * const result = formatDistanceToNow(
         *   new Date(2016, 7, 1),
         *   {locale: eoLocale}
         * )
         * //=> 'pli ol 1 jaro'
         */
        function formatDistanceToNow(date, options) {
          return formatDistance(date, constructNow(date), options);
        }

        /**
         * @name subDays
         * @category Day Helpers
         * @summary Subtract the specified number of days from the given date.
         *
         * @description
         * Subtract the specified number of days from the given date.
         *
         * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
         *
         * @param date - The date to be changed
         * @param amount - The amount of days to be subtracted.
         *
         * @returns The new date with the days subtracted
         *
         * @example
         * // Subtract 10 days from 1 September 2014:
         * const result = subDays(new Date(2014, 8, 1), 10)
         * //=> Fri Aug 22 2014 00:00:00
         */
        function subDays(date, amount) {
          return addDays(date, -amount);
        }
      }
    };
  });
})();
