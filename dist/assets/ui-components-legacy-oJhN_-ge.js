;
(function () {
  System.register(['./react-vendor-legacy-BZejsv6W.js', './icons-legacy-C8x4ypXf.js', './charts-legacy-D2SqRQVB.js', './utils-legacy-B2316hnE.js', './supabase-legacy-CQONYrP8.js'], function (exports, module) {
    'use strict';

    var reactExports, React, jsxRuntimeExports, React$1, reactDomExports, ReactDOM, LoaderCircle, ChevronDown, ChevronUp, Check, X, CircleAlert, RefreshCcw, Home, getDefaultExportFromCjs, twMerge, clsx, __assign, __rest, __spreadArray;
    return {
      setters: [module => {
        reactExports = module.r;
        React = module.R;
        jsxRuntimeExports = module.j;
        React$1 = module.b;
        reactDomExports = module.d;
        ReactDOM = module.e;
      }, module => {
        LoaderCircle = module.L;
        ChevronDown = module.C;
        ChevronUp = module.a;
        Check = module.b;
        X = module.X;
        CircleAlert = module.c;
        RefreshCcw = module.R;
        Home = module.H;
      }, module => {
        getDefaultExportFromCjs = module.g;
      }, module => {
        twMerge = module.t;
        clsx = module.c;
      }, module => {
        __assign = module._;
        __rest = module.b;
        __spreadArray = module.c;
      }],
      execute: function () {
        exports({
          B: Badge,
          c: cn,
          u: LoadingSpinner
        });

        /* global Map:readonly, Set:readonly, ArrayBuffer:readonly */

        var reactFastCompare;
        var hasRequiredReactFastCompare;
        function requireReactFastCompare() {
          if (hasRequiredReactFastCompare) return reactFastCompare;
          hasRequiredReactFastCompare = 1;
          var hasElementType = typeof Element !== 'undefined';
          var hasMap = typeof Map === 'function';
          var hasSet = typeof Set === 'function';
          var hasArrayBuffer = typeof ArrayBuffer === 'function' && !!ArrayBuffer.isView;

          // Note: We **don't** need `envHasBigInt64Array` in fde es6/index.js

          function equal(a, b) {
            // START: fast-deep-equal es6/index.js 3.1.3
            if (a === b) return true;
            if (a && b && typeof a == 'object' && typeof b == 'object') {
              if (a.constructor !== b.constructor) return false;
              var length, i, keys;
              if (Array.isArray(a)) {
                length = a.length;
                if (length != b.length) return false;
                for (i = length; i-- !== 0;) if (!equal(a[i], b[i])) return false;
                return true;
              }

              // START: Modifications:
              // 1. Extra `has<Type> &&` helpers in initial condition allow es6 code
              //    to co-exist with es5.
              // 2. Replace `for of` with es5 compliant iteration using `for`.
              //    Basically, take:
              //
              //    ```js
              //    for (i of a.entries())
              //      if (!b.has(i[0])) return false;
              //    ```
              //
              //    ... and convert to:
              //
              //    ```js
              //    it = a.entries();
              //    while (!(i = it.next()).done)
              //      if (!b.has(i.value[0])) return false;
              //    ```
              //
              //    **Note**: `i` access switches to `i.value`.
              var it;
              if (hasMap && a instanceof Map && b instanceof Map) {
                if (a.size !== b.size) return false;
                it = a.entries();
                while (!(i = it.next()).done) if (!b.has(i.value[0])) return false;
                it = a.entries();
                while (!(i = it.next()).done) if (!equal(i.value[1], b.get(i.value[0]))) return false;
                return true;
              }
              if (hasSet && a instanceof Set && b instanceof Set) {
                if (a.size !== b.size) return false;
                it = a.entries();
                while (!(i = it.next()).done) if (!b.has(i.value[0])) return false;
                return true;
              }
              // END: Modifications

              if (hasArrayBuffer && ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
                length = a.length;
                if (length != b.length) return false;
                for (i = length; i-- !== 0;) if (a[i] !== b[i]) return false;
                return true;
              }
              if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
              // START: Modifications:
              // Apply guards for `Object.create(null)` handling. See:
              // - https://github.com/FormidableLabs/react-fast-compare/issues/64
              // - https://github.com/epoberezkin/fast-deep-equal/issues/49
              if (a.valueOf !== Object.prototype.valueOf && typeof a.valueOf === 'function' && typeof b.valueOf === 'function') return a.valueOf() === b.valueOf();
              if (a.toString !== Object.prototype.toString && typeof a.toString === 'function' && typeof b.toString === 'function') return a.toString() === b.toString();
              // END: Modifications

              keys = Object.keys(a);
              length = keys.length;
              if (length !== Object.keys(b).length) return false;
              for (i = length; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
              // END: fast-deep-equal

              // START: react-fast-compare
              // custom handling for DOM elements
              if (hasElementType && a instanceof Element) return false;

              // custom handling for React/Preact
              for (i = length; i-- !== 0;) {
                if ((keys[i] === '_owner' || keys[i] === '__v' || keys[i] === '__o') && a.$$typeof) {
                  // React-specific: avoid traversing React elements' _owner
                  // Preact-specific: avoid traversing Preact elements' __v and __o
                  //    __v = $_original / $_vnode
                  //    __o = $_owner
                  // These properties contain circular references and are not needed when
                  // comparing the actual elements (and not their owners)
                  // .$$typeof and ._store on just reasonable markers of elements

                  continue;
                }

                // all other properties should be traversed as usual
                if (!equal(a[keys[i]], b[keys[i]])) return false;
              }
              // END: react-fast-compare

              // START: fast-deep-equal
              return true;
            }
            return a !== a && b !== b;
          }
          // end fast-deep-equal

          reactFastCompare = function isEqual(a, b) {
            try {
              return equal(a, b);
            } catch (error) {
              if ((error.message || '').match(/stack|recursion/i)) {
                // warn on circular references, don't crash
                // browsers give this different errors name and messages:
                // chrome/safari: "RangeError", "Maximum call stack size exceeded"
                // firefox: "InternalError", too much recursion"
                // edge: "Error", "Out of stack space"
                console.warn('react-fast-compare cannot handle circular refs');
                return false;
              }
              // some other error. we should definitely know about these
              throw error;
            }
          };
          return reactFastCompare;
        }
        var reactFastCompareExports = requireReactFastCompare();
        const fastCompare = /*@__PURE__*/getDefaultExportFromCjs(reactFastCompareExports);
        var browser;
        var hasRequiredBrowser;
        function requireBrowser() {
          if (hasRequiredBrowser) return browser;
          hasRequiredBrowser = 1;
          var invariant = function (condition, format, a, b, c, d, e, f) {
            if (!condition) {
              var error;
              if (format === void 0) {
                error = new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");
              } else {
                var args = [a, b, c, d, e, f];
                var argIndex = 0;
                error = new Error(format.replace(/%s/g, function () {
                  return args[argIndex++];
                }));
                error.name = "Invariant Violation";
              }
              error.framesToPop = 1;
              throw error;
            }
          };
          browser = invariant;
          return browser;
        }
        var browserExports = requireBrowser();
        const invariant = /*@__PURE__*/getDefaultExportFromCjs(browserExports);
        var shallowequal;
        var hasRequiredShallowequal;
        function requireShallowequal() {
          if (hasRequiredShallowequal) return shallowequal;
          hasRequiredShallowequal = 1;
          //

          shallowequal = function shallowEqual(objA, objB, compare, compareContext) {
            var ret = compare ? compare.call(compareContext, objA, objB) : void 0;
            if (ret !== void 0) {
              return !!ret;
            }
            if (objA === objB) {
              return true;
            }
            if (typeof objA !== "object" || !objA || typeof objB !== "object" || !objB) {
              return false;
            }
            var keysA = Object.keys(objA);
            var keysB = Object.keys(objB);
            if (keysA.length !== keysB.length) {
              return false;
            }
            var bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);

            // Test for A's keys different from B.
            for (var idx = 0; idx < keysA.length; idx++) {
              var key = keysA[idx];
              if (!bHasOwnProperty(key)) {
                return false;
              }
              var valueA = objA[key];
              var valueB = objB[key];
              ret = compare ? compare.call(compareContext, valueA, valueB, key) : void 0;
              if (ret === false || ret === void 0 && valueA !== valueB) {
                return false;
              }
            }
            return true;
          };
          return shallowequal;
        }
        var shallowequalExports = requireShallowequal();
        const shallowEqual = /*@__PURE__*/getDefaultExportFromCjs(shallowequalExports);

        // src/index.tsx

        // src/constants.ts
        var TAG_NAMES = /* @__PURE__ */(TAG_NAMES2 => {
          TAG_NAMES2["BASE"] = "base";
          TAG_NAMES2["BODY"] = "body";
          TAG_NAMES2["HEAD"] = "head";
          TAG_NAMES2["HTML"] = "html";
          TAG_NAMES2["LINK"] = "link";
          TAG_NAMES2["META"] = "meta";
          TAG_NAMES2["NOSCRIPT"] = "noscript";
          TAG_NAMES2["SCRIPT"] = "script";
          TAG_NAMES2["STYLE"] = "style";
          TAG_NAMES2["TITLE"] = "title";
          TAG_NAMES2["FRAGMENT"] = "Symbol(react.fragment)";
          return TAG_NAMES2;
        })(TAG_NAMES || {});
        var SEO_PRIORITY_TAGS = {
          link: {
            rel: ["amphtml", "canonical", "alternate"]
          },
          script: {
            type: ["application/ld+json"]
          },
          meta: {
            charset: "",
            name: ["generator", "robots", "description"],
            property: ["og:type", "og:title", "og:url", "og:image", "og:image:alt", "og:description", "twitter:url", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt", "twitter:card", "twitter:site"]
          }
        };
        var VALID_TAG_NAMES = Object.values(TAG_NAMES);
        var REACT_TAG_MAP = {
          accesskey: "accessKey",
          charset: "charSet",
          class: "className",
          contenteditable: "contentEditable",
          contextmenu: "contextMenu",
          "http-equiv": "httpEquiv",
          itemprop: "itemProp",
          tabindex: "tabIndex"
        };
        var HTML_TAG_MAP = Object.entries(REACT_TAG_MAP).reduce((carry, [key, value]) => {
          carry[value] = key;
          return carry;
        }, {});
        var HELMET_ATTRIBUTE = "data-rh";

        // src/utils.ts
        var HELMET_PROPS = {
          DEFAULT_TITLE: "defaultTitle",
          DEFER: "defer",
          ENCODE_SPECIAL_CHARACTERS: "encodeSpecialCharacters",
          ON_CHANGE_CLIENT_STATE: "onChangeClientState",
          TITLE_TEMPLATE: "titleTemplate",
          PRIORITIZE_SEO_TAGS: "prioritizeSeoTags"
        };
        var getInnermostProperty = (propsList, property) => {
          for (let i = propsList.length - 1; i >= 0; i -= 1) {
            const props = propsList[i];
            if (Object.prototype.hasOwnProperty.call(props, property)) {
              return props[property];
            }
          }
          return null;
        };
        var getTitleFromPropsList = propsList => {
          let innermostTitle = getInnermostProperty(propsList, "title" /* TITLE */);
          const innermostTemplate = getInnermostProperty(propsList, HELMET_PROPS.TITLE_TEMPLATE);
          if (Array.isArray(innermostTitle)) {
            innermostTitle = innermostTitle.join("");
          }
          if (innermostTemplate && innermostTitle) {
            return innermostTemplate.replace(/%s/g, () => innermostTitle);
          }
          const innermostDefaultTitle = getInnermostProperty(propsList, HELMET_PROPS.DEFAULT_TITLE);
          return innermostTitle || innermostDefaultTitle || void 0;
        };
        var getOnChangeClientState = propsList => getInnermostProperty(propsList, HELMET_PROPS.ON_CHANGE_CLIENT_STATE) || (() => {});
        var getAttributesFromPropsList = (tagType, propsList) => propsList.filter(props => typeof props[tagType] !== "undefined").map(props => props[tagType]).reduce((tagAttrs, current) => ({
          ...tagAttrs,
          ...current
        }), {});
        var getBaseTagFromPropsList = (primaryAttributes, propsList) => propsList.filter(props => typeof props["base" /* BASE */] !== "undefined").map(props => props["base" /* BASE */]).reverse().reduce((innermostBaseTag, tag) => {
          if (!innermostBaseTag.length) {
            const keys = Object.keys(tag);
            for (let i = 0; i < keys.length; i += 1) {
              const attributeKey = keys[i];
              const lowerCaseAttributeKey = attributeKey.toLowerCase();
              if (primaryAttributes.indexOf(lowerCaseAttributeKey) !== -1 && tag[lowerCaseAttributeKey]) {
                return innermostBaseTag.concat(tag);
              }
            }
          }
          return innermostBaseTag;
        }, []);
        var warn = msg => console && typeof console.warn === "function" && console.warn(msg);
        var getTagsFromPropsList = (tagName, primaryAttributes, propsList) => {
          const approvedSeenTags = {};
          return propsList.filter(props => {
            if (Array.isArray(props[tagName])) {
              return true;
            }
            if (typeof props[tagName] !== "undefined") {
              warn(`Helmet: ${tagName} should be of type "Array". Instead found type "${typeof props[tagName]}"`);
            }
            return false;
          }).map(props => props[tagName]).reverse().reduce((approvedTags, instanceTags) => {
            const instanceSeenTags = {};
            instanceTags.filter(tag => {
              let primaryAttributeKey;
              const keys2 = Object.keys(tag);
              for (let i = 0; i < keys2.length; i += 1) {
                const attributeKey = keys2[i];
                const lowerCaseAttributeKey = attributeKey.toLowerCase();
                if (primaryAttributes.indexOf(lowerCaseAttributeKey) !== -1 && !(primaryAttributeKey === "rel" /* REL */ && tag[primaryAttributeKey].toLowerCase() === "canonical") && !(lowerCaseAttributeKey === "rel" /* REL */ && tag[lowerCaseAttributeKey].toLowerCase() === "stylesheet")) {
                  primaryAttributeKey = lowerCaseAttributeKey;
                }
                if (primaryAttributes.indexOf(attributeKey) !== -1 && (attributeKey === "innerHTML" /* INNER_HTML */ || attributeKey === "cssText" /* CSS_TEXT */ || attributeKey === "itemprop" /* ITEM_PROP */)) {
                  primaryAttributeKey = attributeKey;
                }
              }
              if (!primaryAttributeKey || !tag[primaryAttributeKey]) {
                return false;
              }
              const value = tag[primaryAttributeKey].toLowerCase();
              if (!approvedSeenTags[primaryAttributeKey]) {
                approvedSeenTags[primaryAttributeKey] = {};
              }
              if (!instanceSeenTags[primaryAttributeKey]) {
                instanceSeenTags[primaryAttributeKey] = {};
              }
              if (!approvedSeenTags[primaryAttributeKey][value]) {
                instanceSeenTags[primaryAttributeKey][value] = true;
                return true;
              }
              return false;
            }).reverse().forEach(tag => approvedTags.push(tag));
            const keys = Object.keys(instanceSeenTags);
            for (let i = 0; i < keys.length; i += 1) {
              const attributeKey = keys[i];
              const tagUnion = {
                ...approvedSeenTags[attributeKey],
                ...instanceSeenTags[attributeKey]
              };
              approvedSeenTags[attributeKey] = tagUnion;
            }
            return approvedTags;
          }, []).reverse();
        };
        var getAnyTrueFromPropsList = (propsList, checkedTag) => {
          if (Array.isArray(propsList) && propsList.length) {
            for (let index = 0; index < propsList.length; index += 1) {
              const prop = propsList[index];
              if (prop[checkedTag]) {
                return true;
              }
            }
          }
          return false;
        };
        var reducePropsToState = propsList => ({
          baseTag: getBaseTagFromPropsList(["href" /* HREF */], propsList),
          bodyAttributes: getAttributesFromPropsList("bodyAttributes" /* BODY */, propsList),
          defer: getInnermostProperty(propsList, HELMET_PROPS.DEFER),
          encode: getInnermostProperty(propsList, HELMET_PROPS.ENCODE_SPECIAL_CHARACTERS),
          htmlAttributes: getAttributesFromPropsList("htmlAttributes" /* HTML */, propsList),
          linkTags: getTagsFromPropsList("link" /* LINK */, ["rel" /* REL */, "href" /* HREF */], propsList),
          metaTags: getTagsFromPropsList("meta" /* META */, ["name" /* NAME */, "charset" /* CHARSET */, "http-equiv" /* HTTPEQUIV */, "property" /* PROPERTY */, "itemprop" /* ITEM_PROP */], propsList),
          noscriptTags: getTagsFromPropsList("noscript" /* NOSCRIPT */, ["innerHTML" /* INNER_HTML */], propsList),
          onChangeClientState: getOnChangeClientState(propsList),
          scriptTags: getTagsFromPropsList("script" /* SCRIPT */, ["src" /* SRC */, "innerHTML" /* INNER_HTML */], propsList),
          styleTags: getTagsFromPropsList("style" /* STYLE */, ["cssText" /* CSS_TEXT */], propsList),
          title: getTitleFromPropsList(propsList),
          titleAttributes: getAttributesFromPropsList("titleAttributes" /* TITLE */, propsList),
          prioritizeSeoTags: getAnyTrueFromPropsList(propsList, HELMET_PROPS.PRIORITIZE_SEO_TAGS)
        });
        var flattenArray = possibleArray => Array.isArray(possibleArray) ? possibleArray.join("") : possibleArray;
        var checkIfPropsMatch = (props, toMatch) => {
          const keys = Object.keys(props);
          for (let i = 0; i < keys.length; i += 1) {
            if (toMatch[keys[i]] && toMatch[keys[i]].includes(props[keys[i]])) {
              return true;
            }
          }
          return false;
        };
        var prioritizer = (elementsList, propsToMatch) => {
          if (Array.isArray(elementsList)) {
            return elementsList.reduce((acc, elementAttrs) => {
              if (checkIfPropsMatch(elementAttrs, propsToMatch)) {
                acc.priority.push(elementAttrs);
              } else {
                acc.default.push(elementAttrs);
              }
              return acc;
            }, {
              priority: [],
              default: []
            });
          }
          return {
            default: elementsList,
            priority: []
          };
        };
        var without = (obj, key) => {
          return {
            ...obj,
            [key]: void 0
          };
        };

        // src/server.ts
        var SELF_CLOSING_TAGS = ["noscript" /* NOSCRIPT */, "script" /* SCRIPT */, "style" /* STYLE */];
        var encodeSpecialCharacters = (str, encode = true) => {
          if (encode === false) {
            return String(str);
          }
          return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
        };
        var generateElementAttributesAsString = attributes => Object.keys(attributes).reduce((str, key) => {
          const attr = typeof attributes[key] !== "undefined" ? `${key}="${attributes[key]}"` : `${key}`;
          return str ? `${str} ${attr}` : attr;
        }, "");
        var generateTitleAsString = (type, title, attributes, encode) => {
          const attributeString = generateElementAttributesAsString(attributes);
          const flattenedTitle = flattenArray(title);
          return attributeString ? `<${type} ${HELMET_ATTRIBUTE}="true" ${attributeString}>${encodeSpecialCharacters(flattenedTitle, encode)}</${type}>` : `<${type} ${HELMET_ATTRIBUTE}="true">${encodeSpecialCharacters(flattenedTitle, encode)}</${type}>`;
        };
        var generateTagsAsString = (type, tags, encode = true) => tags.reduce((str, t) => {
          const tag = t;
          const attributeHtml = Object.keys(tag).filter(attribute => !(attribute === "innerHTML" /* INNER_HTML */ || attribute === "cssText" /* CSS_TEXT */)).reduce((string, attribute) => {
            const attr = typeof tag[attribute] === "undefined" ? attribute : `${attribute}="${encodeSpecialCharacters(tag[attribute], encode)}"`;
            return string ? `${string} ${attr}` : attr;
          }, "");
          const tagContent = tag.innerHTML || tag.cssText || "";
          const isSelfClosing = SELF_CLOSING_TAGS.indexOf(type) === -1;
          return `${str}<${type} ${HELMET_ATTRIBUTE}="true" ${attributeHtml}${isSelfClosing ? `/>` : `>${tagContent}</${type}>`}`;
        }, "");
        var convertElementAttributesToReactProps = (attributes, initProps = {}) => Object.keys(attributes).reduce((obj, key) => {
          const mapped = REACT_TAG_MAP[key];
          obj[mapped || key] = attributes[key];
          return obj;
        }, initProps);
        var generateTitleAsReactComponent = (_type, title, attributes) => {
          const initProps = {
            key: title,
            [HELMET_ATTRIBUTE]: true
          };
          const props = convertElementAttributesToReactProps(attributes, initProps);
          return [React.createElement("title" /* TITLE */, props, title)];
        };
        var generateTagsAsReactComponent = (type, tags) => tags.map((tag, i) => {
          const mappedTag = {
            key: i,
            [HELMET_ATTRIBUTE]: true
          };
          Object.keys(tag).forEach(attribute => {
            const mapped = REACT_TAG_MAP[attribute];
            const mappedAttribute = mapped || attribute;
            if (mappedAttribute === "innerHTML" /* INNER_HTML */ || mappedAttribute === "cssText" /* CSS_TEXT */) {
              const content = tag.innerHTML || tag.cssText;
              mappedTag.dangerouslySetInnerHTML = {
                __html: content
              };
            } else {
              mappedTag[mappedAttribute] = tag[attribute];
            }
          });
          return React.createElement(type, mappedTag);
        });
        var getMethodsForTag = (type, tags, encode = true) => {
          switch (type) {
            case "title" /* TITLE */:
              return {
                toComponent: () => generateTitleAsReactComponent(type, tags.title, tags.titleAttributes),
                toString: () => generateTitleAsString(type, tags.title, tags.titleAttributes, encode)
              };
            case "bodyAttributes" /* BODY */:
            case "htmlAttributes" /* HTML */:
              return {
                toComponent: () => convertElementAttributesToReactProps(tags),
                toString: () => generateElementAttributesAsString(tags)
              };
            default:
              return {
                toComponent: () => generateTagsAsReactComponent(type, tags),
                toString: () => generateTagsAsString(type, tags, encode)
              };
          }
        };
        var getPriorityMethods = ({
          metaTags,
          linkTags,
          scriptTags,
          encode
        }) => {
          const meta = prioritizer(metaTags, SEO_PRIORITY_TAGS.meta);
          const link = prioritizer(linkTags, SEO_PRIORITY_TAGS.link);
          const script = prioritizer(scriptTags, SEO_PRIORITY_TAGS.script);
          const priorityMethods = {
            toComponent: () => [...generateTagsAsReactComponent("meta" /* META */, meta.priority), ...generateTagsAsReactComponent("link" /* LINK */, link.priority), ...generateTagsAsReactComponent("script" /* SCRIPT */, script.priority)],
            toString: () =>
            // generate all the tags as strings and concatenate them
            `${getMethodsForTag("meta" /* META */, meta.priority, encode)} ${getMethodsForTag("link" /* LINK */, link.priority, encode)} ${getMethodsForTag("script" /* SCRIPT */, script.priority, encode)}`
          };
          return {
            priorityMethods,
            metaTags: meta.default,
            linkTags: link.default,
            scriptTags: script.default
          };
        };
        var mapStateOnServer = props => {
          const {
            baseTag,
            bodyAttributes,
            encode = true,
            htmlAttributes,
            noscriptTags,
            styleTags,
            title = "",
            titleAttributes,
            prioritizeSeoTags
          } = props;
          let {
            linkTags,
            metaTags,
            scriptTags
          } = props;
          let priorityMethods = {
            toComponent: () => {},
            toString: () => ""
          };
          if (prioritizeSeoTags) {
            ({
              priorityMethods,
              linkTags,
              metaTags,
              scriptTags
            } = getPriorityMethods(props));
          }
          return {
            priority: priorityMethods,
            base: getMethodsForTag("base" /* BASE */, baseTag, encode),
            bodyAttributes: getMethodsForTag("bodyAttributes" /* BODY */, bodyAttributes, encode),
            htmlAttributes: getMethodsForTag("htmlAttributes" /* HTML */, htmlAttributes, encode),
            link: getMethodsForTag("link" /* LINK */, linkTags, encode),
            meta: getMethodsForTag("meta" /* META */, metaTags, encode),
            noscript: getMethodsForTag("noscript" /* NOSCRIPT */, noscriptTags, encode),
            script: getMethodsForTag("script" /* SCRIPT */, scriptTags, encode),
            style: getMethodsForTag("style" /* STYLE */, styleTags, encode),
            title: getMethodsForTag("title" /* TITLE */, {
              title,
              titleAttributes
            }, encode)
          };
        };
        var server_default = mapStateOnServer;

        // src/HelmetData.ts
        var instances = [];
        var isDocument = !!(typeof window !== "undefined" && window.document && window.document.createElement);
        var HelmetData = class {
          instances = [];
          canUseDOM = isDocument;
          context;
          value = {
            setHelmet: serverState => {
              this.context.helmet = serverState;
            },
            helmetInstances: {
              get: () => this.canUseDOM ? instances : this.instances,
              add: instance => {
                (this.canUseDOM ? instances : this.instances).push(instance);
              },
              remove: instance => {
                const index = (this.canUseDOM ? instances : this.instances).indexOf(instance);
                (this.canUseDOM ? instances : this.instances).splice(index, 1);
              }
            }
          };
          constructor(context, canUseDOM) {
            this.context = context;
            this.canUseDOM = canUseDOM || false;
            if (!canUseDOM) {
              context.helmet = server_default({
                baseTag: [],
                bodyAttributes: {},
                htmlAttributes: {},
                linkTags: [],
                metaTags: [],
                noscriptTags: [],
                scriptTags: [],
                styleTags: [],
                title: "",
                titleAttributes: {}
              });
            }
          }
        };

        // src/Provider.tsx
        var defaultValue = {};
        var Context = React.createContext(defaultValue);
        var HelmetProvider = exports("H", class _HelmetProvider extends reactExports.Component {
          static canUseDOM = isDocument;
          helmetData;
          constructor(props) {
            super(props);
            this.helmetData = new HelmetData(this.props.context || {}, _HelmetProvider.canUseDOM);
          }
          render() {
            return /* @__PURE__ */React.createElement(Context.Provider, {
              value: this.helmetData.value
            }, this.props.children);
          }
        });

        // src/client.ts
        var updateTags = (type, tags) => {
          const headElement = document.head || document.querySelector("head" /* HEAD */);
          const tagNodes = headElement.querySelectorAll(`${type}[${HELMET_ATTRIBUTE}]`);
          const oldTags = [].slice.call(tagNodes);
          const newTags = [];
          let indexToDelete;
          if (tags && tags.length) {
            tags.forEach(tag => {
              const newElement = document.createElement(type);
              for (const attribute in tag) {
                if (Object.prototype.hasOwnProperty.call(tag, attribute)) {
                  if (attribute === "innerHTML" /* INNER_HTML */) {
                    newElement.innerHTML = tag.innerHTML;
                  } else if (attribute === "cssText" /* CSS_TEXT */) {
                    if (newElement.styleSheet) {
                      newElement.styleSheet.cssText = tag.cssText;
                    } else {
                      newElement.appendChild(document.createTextNode(tag.cssText));
                    }
                  } else {
                    const attr = attribute;
                    const value = typeof tag[attr] === "undefined" ? "" : tag[attr];
                    newElement.setAttribute(attribute, value);
                  }
                }
              }
              newElement.setAttribute(HELMET_ATTRIBUTE, "true");
              if (oldTags.some((existingTag, index) => {
                indexToDelete = index;
                return newElement.isEqualNode(existingTag);
              })) {
                oldTags.splice(indexToDelete, 1);
              } else {
                newTags.push(newElement);
              }
            });
          }
          oldTags.forEach(tag => tag.parentNode?.removeChild(tag));
          newTags.forEach(tag => headElement.appendChild(tag));
          return {
            oldTags,
            newTags
          };
        };
        var updateAttributes = (tagName, attributes) => {
          const elementTag = document.getElementsByTagName(tagName)[0];
          if (!elementTag) {
            return;
          }
          const helmetAttributeString = elementTag.getAttribute(HELMET_ATTRIBUTE);
          const helmetAttributes = helmetAttributeString ? helmetAttributeString.split(",") : [];
          const attributesToRemove = [...helmetAttributes];
          const attributeKeys = Object.keys(attributes);
          for (const attribute of attributeKeys) {
            const value = attributes[attribute] || "";
            if (elementTag.getAttribute(attribute) !== value) {
              elementTag.setAttribute(attribute, value);
            }
            if (helmetAttributes.indexOf(attribute) === -1) {
              helmetAttributes.push(attribute);
            }
            const indexToSave = attributesToRemove.indexOf(attribute);
            if (indexToSave !== -1) {
              attributesToRemove.splice(indexToSave, 1);
            }
          }
          for (let i = attributesToRemove.length - 1; i >= 0; i -= 1) {
            elementTag.removeAttribute(attributesToRemove[i]);
          }
          if (helmetAttributes.length === attributesToRemove.length) {
            elementTag.removeAttribute(HELMET_ATTRIBUTE);
          } else if (elementTag.getAttribute(HELMET_ATTRIBUTE) !== attributeKeys.join(",")) {
            elementTag.setAttribute(HELMET_ATTRIBUTE, attributeKeys.join(","));
          }
        };
        var updateTitle = (title, attributes) => {
          if (typeof title !== "undefined" && document.title !== title) {
            document.title = flattenArray(title);
          }
          updateAttributes("title" /* TITLE */, attributes);
        };
        var commitTagChanges = (newState, cb) => {
          const {
            baseTag,
            bodyAttributes,
            htmlAttributes,
            linkTags,
            metaTags,
            noscriptTags,
            onChangeClientState,
            scriptTags,
            styleTags,
            title,
            titleAttributes
          } = newState;
          updateAttributes("body" /* BODY */, bodyAttributes);
          updateAttributes("html" /* HTML */, htmlAttributes);
          updateTitle(title, titleAttributes);
          const tagUpdates = {
            baseTag: updateTags("base" /* BASE */, baseTag),
            linkTags: updateTags("link" /* LINK */, linkTags),
            metaTags: updateTags("meta" /* META */, metaTags),
            noscriptTags: updateTags("noscript" /* NOSCRIPT */, noscriptTags),
            scriptTags: updateTags("script" /* SCRIPT */, scriptTags),
            styleTags: updateTags("style" /* STYLE */, styleTags)
          };
          const addedTags = {};
          const removedTags = {};
          Object.keys(tagUpdates).forEach(tagType => {
            const {
              newTags,
              oldTags
            } = tagUpdates[tagType];
            if (newTags.length) {
              addedTags[tagType] = newTags;
            }
            if (oldTags.length) {
              removedTags[tagType] = tagUpdates[tagType].oldTags;
            }
          });
          if (cb) {
            cb();
          }
          onChangeClientState(newState, addedTags, removedTags);
        };
        var _helmetCallback = null;
        var handleStateChangeOnClient = newState => {
          if (_helmetCallback) {
            cancelAnimationFrame(_helmetCallback);
          }
          if (newState.defer) {
            _helmetCallback = requestAnimationFrame(() => {
              commitTagChanges(newState, () => {
                _helmetCallback = null;
              });
            });
          } else {
            commitTagChanges(newState);
            _helmetCallback = null;
          }
        };
        var client_default = handleStateChangeOnClient;

        // src/Dispatcher.tsx
        var HelmetDispatcher = class extends reactExports.Component {
          rendered = false;
          shouldComponentUpdate(nextProps) {
            return !shallowEqual(nextProps, this.props);
          }
          componentDidUpdate() {
            this.emitChange();
          }
          componentWillUnmount() {
            const {
              helmetInstances
            } = this.props.context;
            helmetInstances.remove(this);
            this.emitChange();
          }
          emitChange() {
            const {
              helmetInstances,
              setHelmet
            } = this.props.context;
            let serverState = null;
            const state = reducePropsToState(helmetInstances.get().map(instance => {
              const props = {
                ...instance.props
              };
              delete props.context;
              return props;
            }));
            if (HelmetProvider.canUseDOM) {
              client_default(state);
            } else if (server_default) {
              serverState = server_default(state);
            }
            setHelmet(serverState);
          }
          // componentWillMount will be deprecated
          // for SSR, initialize on first render
          // constructor is also unsafe in StrictMode
          init() {
            if (this.rendered) {
              return;
            }
            this.rendered = true;
            const {
              helmetInstances
            } = this.props.context;
            helmetInstances.add(this);
            this.emitChange();
          }
          render() {
            this.init();
            return null;
          }
        };

        // src/index.tsx
        var Helmet = exports("x", class extends reactExports.Component {
          static defaultProps = {
            defer: true,
            encodeSpecialCharacters: true,
            prioritizeSeoTags: false
          };
          shouldComponentUpdate(nextProps) {
            return !fastCompare(without(this.props, "helmetData"), without(nextProps, "helmetData"));
          }
          mapNestedChildrenToProps(child, nestedChildren) {
            if (!nestedChildren) {
              return null;
            }
            switch (child.type) {
              case "script" /* SCRIPT */:
              case "noscript" /* NOSCRIPT */:
                return {
                  innerHTML: nestedChildren
                };
              case "style" /* STYLE */:
                return {
                  cssText: nestedChildren
                };
              default:
                throw new Error(`<${child.type} /> elements are self-closing and can not contain children. Refer to our API for more information.`);
            }
          }
          flattenArrayTypeChildren(child, arrayTypeChildren, newChildProps, nestedChildren) {
            return {
              ...arrayTypeChildren,
              [child.type]: [...(arrayTypeChildren[child.type] || []), {
                ...newChildProps,
                ...this.mapNestedChildrenToProps(child, nestedChildren)
              }]
            };
          }
          mapObjectTypeChildren(child, newProps, newChildProps, nestedChildren) {
            switch (child.type) {
              case "title" /* TITLE */:
                return {
                  ...newProps,
                  [child.type]: nestedChildren,
                  titleAttributes: {
                    ...newChildProps
                  }
                };
              case "body" /* BODY */:
                return {
                  ...newProps,
                  bodyAttributes: {
                    ...newChildProps
                  }
                };
              case "html" /* HTML */:
                return {
                  ...newProps,
                  htmlAttributes: {
                    ...newChildProps
                  }
                };
              default:
                return {
                  ...newProps,
                  [child.type]: {
                    ...newChildProps
                  }
                };
            }
          }
          mapArrayTypeChildrenToProps(arrayTypeChildren, newProps) {
            let newFlattenedProps = {
              ...newProps
            };
            Object.keys(arrayTypeChildren).forEach(arrayChildName => {
              newFlattenedProps = {
                ...newFlattenedProps,
                [arrayChildName]: arrayTypeChildren[arrayChildName]
              };
            });
            return newFlattenedProps;
          }
          warnOnInvalidChildren(child, nestedChildren) {
            invariant(VALID_TAG_NAMES.some(name => child.type === name), typeof child.type === "function" ? `You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to our API for more information.` : `Only elements types ${VALID_TAG_NAMES.join(", ")} are allowed. Helmet does not support rendering <${child.type}> elements. Refer to our API for more information.`);
            invariant(!nestedChildren || typeof nestedChildren === "string" || Array.isArray(nestedChildren) && !nestedChildren.some(nestedChild => typeof nestedChild !== "string"), `Helmet expects a string as a child of <${child.type}>. Did you forget to wrap your children in braces? ( <${child.type}>{\`\`}</${child.type}> ) Refer to our API for more information.`);
            return true;
          }
          mapChildrenToProps(children, newProps) {
            let arrayTypeChildren = {};
            React.Children.forEach(children, child => {
              if (!child || !child.props) {
                return;
              }
              const {
                children: nestedChildren,
                ...childProps
              } = child.props;
              const newChildProps = Object.keys(childProps).reduce((obj, key) => {
                obj[HTML_TAG_MAP[key] || key] = childProps[key];
                return obj;
              }, {});
              let {
                type
              } = child;
              if (typeof type === "symbol") {
                type = type.toString();
              } else {
                this.warnOnInvalidChildren(child, nestedChildren);
              }
              switch (type) {
                case "Symbol(react.fragment)" /* FRAGMENT */:
                  newProps = this.mapChildrenToProps(nestedChildren, newProps);
                  break;
                case "link" /* LINK */:
                case "meta" /* META */:
                case "noscript" /* NOSCRIPT */:
                case "script" /* SCRIPT */:
                case "style" /* STYLE */:
                  arrayTypeChildren = this.flattenArrayTypeChildren(child, arrayTypeChildren, newChildProps, nestedChildren);
                  break;
                default:
                  newProps = this.mapObjectTypeChildren(child, newProps, newChildProps, nestedChildren);
                  break;
              }
            });
            return this.mapArrayTypeChildrenToProps(arrayTypeChildren, newProps);
          }
          render() {
            const {
              children,
              ...props
            } = this.props;
            let newProps = {
              ...props
            };
            let {
              helmetData
            } = props;
            if (children) {
              newProps = this.mapChildrenToProps(children, newProps);
            }
            if (helmetData && !(helmetData instanceof HelmetData)) {
              const data = helmetData;
              helmetData = new HelmetData(data.context, true);
              delete newProps.helmetData;
            }
            return helmetData ? /* @__PURE__ */React.createElement(HelmetDispatcher, {
              ...newProps,
              context: helmetData.value
            }) : /* @__PURE__ */React.createElement(Context.Consumer, null, context => /* @__PURE__ */React.createElement(HelmetDispatcher, {
              ...newProps,
              context
            }));
          }
        });
        function cn(...inputs) {
          return twMerge(clsx(inputs));
        }
        const LoadingSpinner$1 = exports("t", ({
          size = "md",
          className = "",
          text
        }) => {
          const sizeClasses = {
            sm: "w-4 h-4",
            md: "w-8 h-8",
            lg: "w-12 h-12"
          };
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: `flex flex-col items-center justify-center gap-2 ${className}`,
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(LoaderCircle, {
              className: `${sizeClasses[size]} animate-spin text-primary`
            }), text && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-sm text-muted-foreground",
              children: text
            })]
          });
        });
        const FullPageLoader = exports("F", ({
          text
        }) => {
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: "min-h-screen flex items-center justify-center bg-background",
            children: /* @__PURE__ */jsxRuntimeExports.jsx(LoadingSpinner$1, {
              size: "lg",
              text: text || "Loading..."
            })
          });
        });
        const SEOHead = exports("k", ({
          title,
          description,
          ogImage,
          canonicalUrl,
          keywords = [],
          schema,
          ogType = "website",
          author,
          publishedTime,
          modifiedTime,
          siteName = "AgentBio",
          locale = "en_US",
          twitterHandle = "@agentbio",
          noindex = false,
          nofollow = false
        }) => {
          const fullTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
          const metaDescription = description.length > 160 ? description.substring(0, 157) + "..." : description;
          const defaultOgImage = `${window.location.origin}/Cover.png`;
          const imageUrl = ogImage || defaultOgImage;
          const robotsContent = [noindex ? "noindex" : "index", nofollow ? "nofollow" : "follow"].join(", ");
          return /* @__PURE__ */jsxRuntimeExports.jsxs(Helmet, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("title", {
              children: fullTitle
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "title",
              content: fullTitle
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "description",
              content: metaDescription
            }), keywords.length > 0 && /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "keywords",
              content: keywords.join(", ")
            }), author && /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "author",
              content: author
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "robots",
              content: robotsContent
            }), canonicalUrl && /* @__PURE__ */jsxRuntimeExports.jsx("link", {
              rel: "canonical",
              href: canonicalUrl
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:type",
              content: ogType
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:site_name",
              content: siteName
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:title",
              content: fullTitle
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:description",
              content: metaDescription
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:image",
              content: imageUrl
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:image:width",
              content: "1200"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:image:height",
              content: "630"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:image:alt",
              content: fullTitle
            }), canonicalUrl && /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:url",
              content: canonicalUrl
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "og:locale",
              content: locale
            }), ogType === "article" && author && /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "article:author",
              content: author
            }), ogType === "article" && publishedTime && /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "article:published_time",
              content: publishedTime
            }), ogType === "article" && modifiedTime && /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              property: "article:modified_time",
              content: modifiedTime
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:card",
              content: "summary_large_image"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:site",
              content: twitterHandle
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:creator",
              content: twitterHandle
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:title",
              content: fullTitle
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:description",
              content: metaDescription
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:image",
              content: imageUrl
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "twitter:image:alt",
              content: fullTitle
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "theme-color",
              content: "#0ea5e9"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "apple-mobile-web-app-capable",
              content: "yes"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "apple-mobile-web-app-status-bar-style",
              content: "default"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "viewport",
              content: "width=device-width, initial-scale=1.0"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("meta", {
              name: "format-detection",
              content: "telephone=no"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("link", {
              rel: "preconnect",
              href: "https://fonts.googleapis.com"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("link", {
              rel: "preconnect",
              href: "https://fonts.gstatic.com",
              crossOrigin: "anonymous"
            }), schema && /* @__PURE__ */jsxRuntimeExports.jsx("script", {
              type: "application/ld+json",
              children: JSON.stringify(schema)
            })]
          });
        });

        // packages/react/compose-refs/src/compose-refs.tsx
        function setRef(ref, value) {
          if (typeof ref === "function") {
            return ref(value);
          } else if (ref !== null && ref !== void 0) {
            ref.current = value;
          }
        }
        function composeRefs(...refs) {
          return node => {
            let hasCleanup = false;
            const cleanups = refs.map(ref => {
              const cleanup = setRef(ref, node);
              if (!hasCleanup && typeof cleanup == "function") {
                hasCleanup = true;
              }
              return cleanup;
            });
            if (hasCleanup) {
              return () => {
                for (let i = 0; i < cleanups.length; i++) {
                  const cleanup = cleanups[i];
                  if (typeof cleanup == "function") {
                    cleanup();
                  } else {
                    setRef(refs[i], null);
                  }
                }
              };
            }
          };
        }
        function useComposedRefs(...refs) {
          return reactExports.useCallback(composeRefs(...refs), refs);
        }

        // src/slot.tsx
        var REACT_LAZY_TYPE = Symbol.for("react.lazy");
        var use = React$1[" use ".trim().toString()];
        function isPromiseLike(value) {
          return typeof value === "object" && value !== null && "then" in value;
        }
        function isLazyComponent(element) {
          return element != null && typeof element === "object" && "$$typeof" in element && element.$$typeof === REACT_LAZY_TYPE && "_payload" in element && isPromiseLike(element._payload);
        }
        // @__NO_SIDE_EFFECTS__
        function createSlot$6(ownerName) {
          const SlotClone = /* @__PURE__ */createSlotClone$6(ownerName);
          const Slot2 = reactExports.forwardRef((props, forwardedRef) => {
            let {
              children,
              ...slotProps
            } = props;
            if (isLazyComponent(children) && typeof use === "function") {
              children = use(children._payload);
            }
            const childrenArray = reactExports.Children.toArray(children);
            const slottable = childrenArray.find(isSlottable$6);
            if (slottable) {
              const newElement = slottable.props.children;
              const newChildren = childrenArray.map(child => {
                if (child === slottable) {
                  if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
                  return reactExports.isValidElement(newElement) ? newElement.props.children : null;
                } else {
                  return child;
                }
              });
              return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
                ...slotProps,
                ref: forwardedRef,
                children: reactExports.isValidElement(newElement) ? reactExports.cloneElement(newElement, void 0, newChildren) : null
              });
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
              ...slotProps,
              ref: forwardedRef,
              children
            });
          });
          Slot2.displayName = `${ownerName}.Slot`;
          return Slot2;
        }
        var Slot$4 = /* @__PURE__ */createSlot$6("Slot");
        // @__NO_SIDE_EFFECTS__
        function createSlotClone$6(ownerName) {
          const SlotClone = reactExports.forwardRef((props, forwardedRef) => {
            let {
              children,
              ...slotProps
            } = props;
            if (isLazyComponent(children) && typeof use === "function") {
              children = use(children._payload);
            }
            if (reactExports.isValidElement(children)) {
              const childrenRef = getElementRef$7(children);
              const props2 = mergeProps$6(slotProps, children.props);
              if (children.type !== reactExports.Fragment) {
                props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
              }
              return reactExports.cloneElement(children, props2);
            }
            return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
          });
          SlotClone.displayName = `${ownerName}.SlotClone`;
          return SlotClone;
        }
        var SLOTTABLE_IDENTIFIER$6 = Symbol("radix.slottable");
        function isSlottable$6(child) {
          return reactExports.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER$6;
        }
        function mergeProps$6(slotProps, childProps) {
          const overrideProps = {
            ...childProps
          };
          for (const propName in childProps) {
            const slotPropValue = slotProps[propName];
            const childPropValue = childProps[propName];
            const isHandler = /^on[A-Z]/.test(propName);
            if (isHandler) {
              if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args) => {
                  const result = childPropValue(...args);
                  slotPropValue(...args);
                  return result;
                };
              } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
              }
            } else if (propName === "style") {
              overrideProps[propName] = {
                ...slotPropValue,
                ...childPropValue
              };
            } else if (propName === "className") {
              overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
            }
          }
          return {
            ...slotProps,
            ...overrideProps
          };
        }
        function getElementRef$7(element) {
          let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
          let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.ref;
          }
          getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
          mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.props.ref;
          }
          return element.props.ref || element.ref;
        }
        const falsyToString = value => typeof value === "boolean" ? `${value}` : value === 0 ? "0" : value;
        const cx = clsx;
        const cva = (base, config) => props => {
          var _config_compoundVariants;
          if ((config === null || config === void 0 ? void 0 : config.variants) == null) return cx(base, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
          const {
            variants,
            defaultVariants
          } = config;
          const getVariantClassNames = Object.keys(variants).map(variant => {
            const variantProp = props === null || props === void 0 ? void 0 : props[variant];
            const defaultVariantProp = defaultVariants === null || defaultVariants === void 0 ? void 0 : defaultVariants[variant];
            if (variantProp === null) return null;
            const variantKey = falsyToString(variantProp) || falsyToString(defaultVariantProp);
            return variants[variant][variantKey];
          });
          const propsWithoutUndefined = props && Object.entries(props).reduce((acc, param) => {
            let [key, value] = param;
            if (value === undefined) {
              return acc;
            }
            acc[key] = value;
            return acc;
          }, {});
          const getCompoundVariantClassNames = config === null || config === void 0 ? void 0 : (_config_compoundVariants = config.compoundVariants) === null || _config_compoundVariants === void 0 ? void 0 : _config_compoundVariants.reduce((acc, param) => {
            let {
              class: cvClass,
              className: cvClassName,
              ...compoundVariantOptions
            } = param;
            return Object.entries(compoundVariantOptions).every(param => {
              let [key, value] = param;
              return Array.isArray(value) ? value.includes({
                ...defaultVariants,
                ...propsWithoutUndefined
              }[key]) : {
                ...defaultVariants,
                ...propsWithoutUndefined
              }[key] === value;
            }) ? [...acc, cvClass, cvClassName] : acc;
          }, []);
          return cx(base, getVariantClassNames, getCompoundVariantClassNames, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
        };
        function isHapticSupported() {
          return "vibrate" in navigator;
        }
        function haptic(pattern = "light") {
          if (!isHapticSupported()) return;
          try {
            switch (pattern) {
              case "light":
                navigator.vibrate(10);
                break;
              case "medium":
                navigator.vibrate(20);
                break;
              case "heavy":
                navigator.vibrate(40);
                break;
              case "success":
                navigator.vibrate([10, 20, 10]);
                break;
              case "warning":
                navigator.vibrate([15, 50, 15]);
                break;
              case "error":
                navigator.vibrate([10, 50, 10, 50, 10]);
                break;
              case "selection":
                navigator.vibrate(5);
                break;
              default:
                navigator.vibrate(10);
            }
          } catch (error) {
            console.warn("Haptic feedback failed:", error);
          }
        }
        function cancelHaptic() {
          if (isHapticSupported()) {
            navigator.vibrate(0);
          }
        }
        const hapticFeedback = exports("r", {
          // Button interactions
          tap: () => haptic("light"),
          press: () => haptic("medium"),
          hold: () => haptic("heavy"),
          // Results
          success: () => haptic("success"),
          warning: () => haptic("warning"),
          error: () => haptic("error"),
          // Navigation
          selection: () => haptic("selection"),
          // Utility
          cancel: cancelHaptic,
          isSupported: isHapticSupported
        });
        const buttonVariants = cva("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-target no-select", {
          variants: {
            variant: {
              default: "bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800",
              destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
              outline: "border border-gray-300 bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 text-gray-900",
              secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300",
              ghost: "hover:bg-gray-100 active:bg-gray-200 text-gray-900",
              link: "text-blue-600 underline-offset-4 hover:underline active:text-blue-800"
            },
            size: {
              default: "h-11 sm:h-10 px-4 py-2 text-sm sm:text-base",
              sm: "h-9 sm:h-8 rounded-md px-3 text-xs",
              lg: "h-12 sm:h-11 rounded-md px-6 sm:px-8 text-base sm:text-lg",
              icon: "h-11 w-11 sm:h-10 sm:w-10"
            }
          },
          defaultVariants: {
            variant: "default",
            size: "default"
          }
        });
        const Button = exports("j", reactExports.forwardRef(({
          className,
          variant,
          size,
          asChild = false,
          onClick,
          ...props
        }, ref) => {
          const Comp = asChild ? Slot$4 : "button";
          const handleClick = e => {
            hapticFeedback.tap();
            onClick?.(e);
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx(Comp, {
            className: cn(buttonVariants({
              variant,
              size,
              className
            })),
            ref,
            onClick: handleClick,
            ...props
          });
        }));
        Button.displayName = "Button";
        const Input = exports("I", reactExports.forwardRef(({
          className,
          type,
          ...props
        }, ref) => {
          return /* @__PURE__ */jsxRuntimeExports.jsx("input", {
            type,
            className: cn("flex h-11 sm:h-10 w-full rounded-md border border-gray-300 bg-white px-3 sm:px-3 py-2.5 sm:py-2 text-base sm:text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-target transition-all", className),
            ref,
            ...props
          });
        }));
        Input.displayName = "Input";
        const Card = exports("C", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
          ref,
          className: cn("rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm", className),
          ...props
        })));
        Card.displayName = "Card";
        const CardHeader = exports("f", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
          ref,
          className: cn("flex flex-col space-y-1.5 p-6", className),
          ...props
        })));
        CardHeader.displayName = "CardHeader";
        const CardTitle = exports("g", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("h3", {
          ref,
          className: cn("text-2xl font-semibold leading-none tracking-tight", className),
          ...props
        })));
        CardTitle.displayName = "CardTitle";
        const CardDescription = exports("h", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("p", {
          ref,
          className: cn("text-sm text-gray-500", className),
          ...props
        })));
        CardDescription.displayName = "CardDescription";
        const CardContent = exports("o", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
          ref,
          className: cn("p-6 pt-0", className),
          ...props
        })));
        CardContent.displayName = "CardContent";
        const CardFooter = exports("i", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
          ref,
          className: cn("flex items-center p-6 pt-0", className),
          ...props
        })));
        CardFooter.displayName = "CardFooter";
        const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
          variants: {
            variant: {
              default: "border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80",
              secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80",
              destructive: "border-transparent bg-red-500 text-gray-50 hover:bg-red-500/80",
              outline: "text-gray-900",
              success: "border-transparent bg-green-500 text-white hover:bg-green-600",
              warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600"
            }
          },
          defaultVariants: {
            variant: "default"
          }
        });
        function Badge({
          className,
          variant,
          ...props
        }) {
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            className: cn(badgeVariants({
              variant
            }), className),
            ...props
          });
        }

        // packages/core/number/src/number.ts
        function clamp$1(value, [min, max]) {
          return Math.min(max, Math.max(min, value));
        }

        // src/primitive.tsx
        function composeEventHandlers(originalEventHandler, ourEventHandler, {
          checkForDefaultPrevented = true
        } = {}) {
          return function handleEvent(event) {
            originalEventHandler?.(event);
            if (checkForDefaultPrevented === false || !event.defaultPrevented) {
              return ourEventHandler?.(event);
            }
          };
        }

        // packages/react/context/src/create-context.tsx
        function createContext2(rootComponentName, defaultContext) {
          const Context = reactExports.createContext(defaultContext);
          const Provider = props => {
            const {
              children,
              ...context
            } = props;
            const value = reactExports.useMemo(() => context, Object.values(context));
            return /* @__PURE__ */jsxRuntimeExports.jsx(Context.Provider, {
              value,
              children
            });
          };
          Provider.displayName = rootComponentName + "Provider";
          function useContext2(consumerName) {
            const context = reactExports.useContext(Context);
            if (context) return context;
            if (defaultContext !== void 0) return defaultContext;
            throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
          }
          return [Provider, useContext2];
        }
        function createContextScope$1(scopeName, createContextScopeDeps = []) {
          let defaultContexts = [];
          function createContext3(rootComponentName, defaultContext) {
            const BaseContext = reactExports.createContext(defaultContext);
            const index = defaultContexts.length;
            defaultContexts = [...defaultContexts, defaultContext];
            const Provider = props => {
              const {
                scope,
                children,
                ...context
              } = props;
              const Context = scope?.[scopeName]?.[index] || BaseContext;
              const value = reactExports.useMemo(() => context, Object.values(context));
              return /* @__PURE__ */jsxRuntimeExports.jsx(Context.Provider, {
                value,
                children
              });
            };
            Provider.displayName = rootComponentName + "Provider";
            function useContext2(consumerName, scope) {
              const Context = scope?.[scopeName]?.[index] || BaseContext;
              const context = reactExports.useContext(Context);
              if (context) return context;
              if (defaultContext !== void 0) return defaultContext;
              throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
            }
            return [Provider, useContext2];
          }
          const createScope = () => {
            const scopeContexts = defaultContexts.map(defaultContext => {
              return reactExports.createContext(defaultContext);
            });
            return function useScope(scope) {
              const contexts = scope?.[scopeName] || scopeContexts;
              return reactExports.useMemo(() => ({
                [`__scope${scopeName}`]: {
                  ...scope,
                  [scopeName]: contexts
                }
              }), [scope, contexts]);
            };
          };
          createScope.scopeName = scopeName;
          return [createContext3, composeContextScopes$1(createScope, ...createContextScopeDeps)];
        }
        function composeContextScopes$1(...scopes) {
          const baseScope = scopes[0];
          if (scopes.length === 1) return baseScope;
          const createScope = () => {
            const scopeHooks = scopes.map(createScope2 => ({
              useScope: createScope2(),
              scopeName: createScope2.scopeName
            }));
            return function useComposedScopes(overrideScopes) {
              const nextScopes = scopeHooks.reduce((nextScopes2, {
                useScope,
                scopeName
              }) => {
                const scopeProps = useScope(overrideScopes);
                const currentScope = scopeProps[`__scope${scopeName}`];
                return {
                  ...nextScopes2,
                  ...currentScope
                };
              }, {});
              return reactExports.useMemo(() => ({
                [`__scope${baseScope.scopeName}`]: nextScopes
              }), [nextScopes]);
            };
          };
          createScope.scopeName = baseScope.scopeName;
          return createScope;
        }

        // src/slot.tsx
        // @__NO_SIDE_EFFECTS__
        function createSlot$5(ownerName) {
          const SlotClone = /* @__PURE__ */createSlotClone$5(ownerName);
          const Slot2 = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            const childrenArray = reactExports.Children.toArray(children);
            const slottable = childrenArray.find(isSlottable$5);
            if (slottable) {
              const newElement = slottable.props.children;
              const newChildren = childrenArray.map(child => {
                if (child === slottable) {
                  if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
                  return reactExports.isValidElement(newElement) ? newElement.props.children : null;
                } else {
                  return child;
                }
              });
              return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
                ...slotProps,
                ref: forwardedRef,
                children: reactExports.isValidElement(newElement) ? reactExports.cloneElement(newElement, void 0, newChildren) : null
              });
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
              ...slotProps,
              ref: forwardedRef,
              children
            });
          });
          Slot2.displayName = `${ownerName}.Slot`;
          return Slot2;
        }
        // @__NO_SIDE_EFFECTS__
        function createSlotClone$5(ownerName) {
          const SlotClone = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            if (reactExports.isValidElement(children)) {
              const childrenRef = getElementRef$6(children);
              const props2 = mergeProps$5(slotProps, children.props);
              if (children.type !== reactExports.Fragment) {
                props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
              }
              return reactExports.cloneElement(children, props2);
            }
            return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
          });
          SlotClone.displayName = `${ownerName}.SlotClone`;
          return SlotClone;
        }
        var SLOTTABLE_IDENTIFIER$5 = Symbol("radix.slottable");
        function isSlottable$5(child) {
          return reactExports.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER$5;
        }
        function mergeProps$5(slotProps, childProps) {
          const overrideProps = {
            ...childProps
          };
          for (const propName in childProps) {
            const slotPropValue = slotProps[propName];
            const childPropValue = childProps[propName];
            const isHandler = /^on[A-Z]/.test(propName);
            if (isHandler) {
              if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args) => {
                  const result = childPropValue(...args);
                  slotPropValue(...args);
                  return result;
                };
              } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
              }
            } else if (propName === "style") {
              overrideProps[propName] = {
                ...slotPropValue,
                ...childPropValue
              };
            } else if (propName === "className") {
              overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
            }
          }
          return {
            ...slotProps,
            ...overrideProps
          };
        }
        function getElementRef$6(element) {
          let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
          let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.ref;
          }
          getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
          mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.props.ref;
          }
          return element.props.ref || element.ref;
        }
        function createCollection(name) {
          const PROVIDER_NAME = name + "CollectionProvider";
          const [createCollectionContext, createCollectionScope] = createContextScope$1(PROVIDER_NAME);
          const [CollectionProviderImpl, useCollectionContext] = createCollectionContext(PROVIDER_NAME, {
            collectionRef: {
              current: null
            },
            itemMap: /* @__PURE__ */new Map()
          });
          const CollectionProvider = props => {
            const {
              scope,
              children
            } = props;
            const ref = React.useRef(null);
            const itemMap = React.useRef(/* @__PURE__ */new Map()).current;
            return /* @__PURE__ */jsxRuntimeExports.jsx(CollectionProviderImpl, {
              scope,
              itemMap,
              collectionRef: ref,
              children
            });
          };
          CollectionProvider.displayName = PROVIDER_NAME;
          const COLLECTION_SLOT_NAME = name + "CollectionSlot";
          const CollectionSlotImpl = createSlot$5(COLLECTION_SLOT_NAME);
          const CollectionSlot = React.forwardRef((props, forwardedRef) => {
            const {
              scope,
              children
            } = props;
            const context = useCollectionContext(COLLECTION_SLOT_NAME, scope);
            const composedRefs = useComposedRefs(forwardedRef, context.collectionRef);
            return /* @__PURE__ */jsxRuntimeExports.jsx(CollectionSlotImpl, {
              ref: composedRefs,
              children
            });
          });
          CollectionSlot.displayName = COLLECTION_SLOT_NAME;
          const ITEM_SLOT_NAME = name + "CollectionItemSlot";
          const ITEM_DATA_ATTR = "data-radix-collection-item";
          const CollectionItemSlotImpl = createSlot$5(ITEM_SLOT_NAME);
          const CollectionItemSlot = React.forwardRef((props, forwardedRef) => {
            const {
              scope,
              children,
              ...itemData
            } = props;
            const ref = React.useRef(null);
            const composedRefs = useComposedRefs(forwardedRef, ref);
            const context = useCollectionContext(ITEM_SLOT_NAME, scope);
            React.useEffect(() => {
              context.itemMap.set(ref, {
                ref,
                ...itemData
              });
              return () => void context.itemMap.delete(ref);
            });
            return /* @__PURE__ */jsxRuntimeExports.jsx(CollectionItemSlotImpl, {
              ...{
                [ITEM_DATA_ATTR]: ""
              },
              ref: composedRefs,
              children
            });
          });
          CollectionItemSlot.displayName = ITEM_SLOT_NAME;
          function useCollection(scope) {
            const context = useCollectionContext(name + "CollectionConsumer", scope);
            const getItems = React.useCallback(() => {
              const collectionNode = context.collectionRef.current;
              if (!collectionNode) return [];
              const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`));
              const items = Array.from(context.itemMap.values());
              const orderedItems = items.sort((a, b) => orderedNodes.indexOf(a.ref.current) - orderedNodes.indexOf(b.ref.current));
              return orderedItems;
            }, [context.collectionRef, context.itemMap]);
            return getItems;
          }
          return [{
            Provider: CollectionProvider,
            Slot: CollectionSlot,
            ItemSlot: CollectionItemSlot
          }, useCollection, createCollectionScope];
        }

        // packages/react/direction/src/direction.tsx
        var DirectionContext = reactExports.createContext(void 0);
        function useDirection(localDir) {
          const globalDir = reactExports.useContext(DirectionContext);
          return localDir || globalDir || "ltr";
        }

        // src/slot.tsx
        // @__NO_SIDE_EFFECTS__
        function createSlot$4(ownerName) {
          const SlotClone = /* @__PURE__ */createSlotClone$4(ownerName);
          const Slot2 = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            const childrenArray = reactExports.Children.toArray(children);
            const slottable = childrenArray.find(isSlottable$4);
            if (slottable) {
              const newElement = slottable.props.children;
              const newChildren = childrenArray.map(child => {
                if (child === slottable) {
                  if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
                  return reactExports.isValidElement(newElement) ? newElement.props.children : null;
                } else {
                  return child;
                }
              });
              return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
                ...slotProps,
                ref: forwardedRef,
                children: reactExports.isValidElement(newElement) ? reactExports.cloneElement(newElement, void 0, newChildren) : null
              });
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
              ...slotProps,
              ref: forwardedRef,
              children
            });
          });
          Slot2.displayName = `${ownerName}.Slot`;
          return Slot2;
        }
        // @__NO_SIDE_EFFECTS__
        function createSlotClone$4(ownerName) {
          const SlotClone = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            if (reactExports.isValidElement(children)) {
              const childrenRef = getElementRef$5(children);
              const props2 = mergeProps$4(slotProps, children.props);
              if (children.type !== reactExports.Fragment) {
                props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
              }
              return reactExports.cloneElement(children, props2);
            }
            return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
          });
          SlotClone.displayName = `${ownerName}.SlotClone`;
          return SlotClone;
        }
        var SLOTTABLE_IDENTIFIER$4 = Symbol("radix.slottable");
        function isSlottable$4(child) {
          return reactExports.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER$4;
        }
        function mergeProps$4(slotProps, childProps) {
          const overrideProps = {
            ...childProps
          };
          for (const propName in childProps) {
            const slotPropValue = slotProps[propName];
            const childPropValue = childProps[propName];
            const isHandler = /^on[A-Z]/.test(propName);
            if (isHandler) {
              if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args) => {
                  const result = childPropValue(...args);
                  slotPropValue(...args);
                  return result;
                };
              } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
              }
            } else if (propName === "style") {
              overrideProps[propName] = {
                ...slotPropValue,
                ...childPropValue
              };
            } else if (propName === "className") {
              overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
            }
          }
          return {
            ...slotProps,
            ...overrideProps
          };
        }
        function getElementRef$5(element) {
          let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
          let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.ref;
          }
          getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
          mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.props.ref;
          }
          return element.props.ref || element.ref;
        }

        // src/primitive.tsx
        var NODES$3 = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"];
        var Primitive$3 = NODES$3.reduce((primitive, node) => {
          const Slot = createSlot$4(`Primitive.${node}`);
          const Node = reactExports.forwardRef((props, forwardedRef) => {
            const {
              asChild,
              ...primitiveProps
            } = props;
            const Comp = asChild ? Slot : node;
            if (typeof window !== "undefined") {
              window[Symbol.for("radix-ui")] = true;
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(Comp, {
              ...primitiveProps,
              ref: forwardedRef
            });
          });
          Node.displayName = `Primitive.${node}`;
          return {
            ...primitive,
            [node]: Node
          };
        }, {});
        function dispatchDiscreteCustomEvent(target, event) {
          if (target) reactDomExports.flushSync(() => target.dispatchEvent(event));
        }

        // packages/react/use-callback-ref/src/use-callback-ref.tsx
        function useCallbackRef$1(callback) {
          const callbackRef = reactExports.useRef(callback);
          reactExports.useEffect(() => {
            callbackRef.current = callback;
          });
          return reactExports.useMemo(() => (...args) => callbackRef.current?.(...args), []);
        }

        // packages/react/use-escape-keydown/src/use-escape-keydown.tsx
        function useEscapeKeydown(onEscapeKeyDownProp, ownerDocument = globalThis?.document) {
          const onEscapeKeyDown = useCallbackRef$1(onEscapeKeyDownProp);
          reactExports.useEffect(() => {
            const handleKeyDown = event => {
              if (event.key === "Escape") {
                onEscapeKeyDown(event);
              }
            };
            ownerDocument.addEventListener("keydown", handleKeyDown, {
              capture: true
            });
            return () => ownerDocument.removeEventListener("keydown", handleKeyDown, {
              capture: true
            });
          }, [onEscapeKeyDown, ownerDocument]);
        }
        var DISMISSABLE_LAYER_NAME = "DismissableLayer";
        var CONTEXT_UPDATE = "dismissableLayer.update";
        var POINTER_DOWN_OUTSIDE = "dismissableLayer.pointerDownOutside";
        var FOCUS_OUTSIDE = "dismissableLayer.focusOutside";
        var originalBodyPointerEvents;
        var DismissableLayerContext = reactExports.createContext({
          layers: /* @__PURE__ */new Set(),
          layersWithOutsidePointerEventsDisabled: /* @__PURE__ */new Set(),
          branches: /* @__PURE__ */new Set()
        });
        var DismissableLayer = reactExports.forwardRef((props, forwardedRef) => {
          const {
            disableOutsidePointerEvents = false,
            onEscapeKeyDown,
            onPointerDownOutside,
            onFocusOutside,
            onInteractOutside,
            onDismiss,
            ...layerProps
          } = props;
          const context = reactExports.useContext(DismissableLayerContext);
          const [node, setNode] = reactExports.useState(null);
          const ownerDocument = node?.ownerDocument ?? globalThis?.document;
          const [, force] = reactExports.useState({});
          const composedRefs = useComposedRefs(forwardedRef, node2 => setNode(node2));
          const layers = Array.from(context.layers);
          const [highestLayerWithOutsidePointerEventsDisabled] = [...context.layersWithOutsidePointerEventsDisabled].slice(-1);
          const highestLayerWithOutsidePointerEventsDisabledIndex = layers.indexOf(highestLayerWithOutsidePointerEventsDisabled);
          const index = node ? layers.indexOf(node) : -1;
          const isBodyPointerEventsDisabled = context.layersWithOutsidePointerEventsDisabled.size > 0;
          const isPointerEventsEnabled = index >= highestLayerWithOutsidePointerEventsDisabledIndex;
          const pointerDownOutside = usePointerDownOutside(event => {
            const target = event.target;
            const isPointerDownOnBranch = [...context.branches].some(branch => branch.contains(target));
            if (!isPointerEventsEnabled || isPointerDownOnBranch) return;
            onPointerDownOutside?.(event);
            onInteractOutside?.(event);
            if (!event.defaultPrevented) onDismiss?.();
          }, ownerDocument);
          const focusOutside = useFocusOutside(event => {
            const target = event.target;
            const isFocusInBranch = [...context.branches].some(branch => branch.contains(target));
            if (isFocusInBranch) return;
            onFocusOutside?.(event);
            onInteractOutside?.(event);
            if (!event.defaultPrevented) onDismiss?.();
          }, ownerDocument);
          useEscapeKeydown(event => {
            const isHighestLayer = index === context.layers.size - 1;
            if (!isHighestLayer) return;
            onEscapeKeyDown?.(event);
            if (!event.defaultPrevented && onDismiss) {
              event.preventDefault();
              onDismiss();
            }
          }, ownerDocument);
          reactExports.useEffect(() => {
            if (!node) return;
            if (disableOutsidePointerEvents) {
              if (context.layersWithOutsidePointerEventsDisabled.size === 0) {
                originalBodyPointerEvents = ownerDocument.body.style.pointerEvents;
                ownerDocument.body.style.pointerEvents = "none";
              }
              context.layersWithOutsidePointerEventsDisabled.add(node);
            }
            context.layers.add(node);
            dispatchUpdate();
            return () => {
              if (disableOutsidePointerEvents && context.layersWithOutsidePointerEventsDisabled.size === 1) {
                ownerDocument.body.style.pointerEvents = originalBodyPointerEvents;
              }
            };
          }, [node, ownerDocument, disableOutsidePointerEvents, context]);
          reactExports.useEffect(() => {
            return () => {
              if (!node) return;
              context.layers.delete(node);
              context.layersWithOutsidePointerEventsDisabled.delete(node);
              dispatchUpdate();
            };
          }, [node, context]);
          reactExports.useEffect(() => {
            const handleUpdate = () => force({});
            document.addEventListener(CONTEXT_UPDATE, handleUpdate);
            return () => document.removeEventListener(CONTEXT_UPDATE, handleUpdate);
          }, []);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            ...layerProps,
            ref: composedRefs,
            style: {
              pointerEvents: isBodyPointerEventsDisabled ? isPointerEventsEnabled ? "auto" : "none" : void 0,
              ...props.style
            },
            onFocusCapture: composeEventHandlers(props.onFocusCapture, focusOutside.onFocusCapture),
            onBlurCapture: composeEventHandlers(props.onBlurCapture, focusOutside.onBlurCapture),
            onPointerDownCapture: composeEventHandlers(props.onPointerDownCapture, pointerDownOutside.onPointerDownCapture)
          });
        });
        DismissableLayer.displayName = DISMISSABLE_LAYER_NAME;
        var BRANCH_NAME = "DismissableLayerBranch";
        var DismissableLayerBranch = reactExports.forwardRef((props, forwardedRef) => {
          const context = reactExports.useContext(DismissableLayerContext);
          const ref = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, ref);
          reactExports.useEffect(() => {
            const node = ref.current;
            if (node) {
              context.branches.add(node);
              return () => {
                context.branches.delete(node);
              };
            }
          }, [context.branches]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            ...props,
            ref: composedRefs
          });
        });
        DismissableLayerBranch.displayName = BRANCH_NAME;
        function usePointerDownOutside(onPointerDownOutside, ownerDocument = globalThis?.document) {
          const handlePointerDownOutside = useCallbackRef$1(onPointerDownOutside);
          const isPointerInsideReactTreeRef = reactExports.useRef(false);
          const handleClickRef = reactExports.useRef(() => {});
          reactExports.useEffect(() => {
            const handlePointerDown = event => {
              if (event.target && !isPointerInsideReactTreeRef.current) {
                let handleAndDispatchPointerDownOutsideEvent2 = function () {
                  handleAndDispatchCustomEvent(POINTER_DOWN_OUTSIDE, handlePointerDownOutside, eventDetail, {
                    discrete: true
                  });
                };
                const eventDetail = {
                  originalEvent: event
                };
                if (event.pointerType === "touch") {
                  ownerDocument.removeEventListener("click", handleClickRef.current);
                  handleClickRef.current = handleAndDispatchPointerDownOutsideEvent2;
                  ownerDocument.addEventListener("click", handleClickRef.current, {
                    once: true
                  });
                } else {
                  handleAndDispatchPointerDownOutsideEvent2();
                }
              } else {
                ownerDocument.removeEventListener("click", handleClickRef.current);
              }
              isPointerInsideReactTreeRef.current = false;
            };
            const timerId = window.setTimeout(() => {
              ownerDocument.addEventListener("pointerdown", handlePointerDown);
            }, 0);
            return () => {
              window.clearTimeout(timerId);
              ownerDocument.removeEventListener("pointerdown", handlePointerDown);
              ownerDocument.removeEventListener("click", handleClickRef.current);
            };
          }, [ownerDocument, handlePointerDownOutside]);
          return {
            // ensures we check React component tree (not just DOM tree)
            onPointerDownCapture: () => isPointerInsideReactTreeRef.current = true
          };
        }
        function useFocusOutside(onFocusOutside, ownerDocument = globalThis?.document) {
          const handleFocusOutside = useCallbackRef$1(onFocusOutside);
          const isFocusInsideReactTreeRef = reactExports.useRef(false);
          reactExports.useEffect(() => {
            const handleFocus = event => {
              if (event.target && !isFocusInsideReactTreeRef.current) {
                const eventDetail = {
                  originalEvent: event
                };
                handleAndDispatchCustomEvent(FOCUS_OUTSIDE, handleFocusOutside, eventDetail, {
                  discrete: false
                });
              }
            };
            ownerDocument.addEventListener("focusin", handleFocus);
            return () => ownerDocument.removeEventListener("focusin", handleFocus);
          }, [ownerDocument, handleFocusOutside]);
          return {
            onFocusCapture: () => isFocusInsideReactTreeRef.current = true,
            onBlurCapture: () => isFocusInsideReactTreeRef.current = false
          };
        }
        function dispatchUpdate() {
          const event = new CustomEvent(CONTEXT_UPDATE);
          document.dispatchEvent(event);
        }
        function handleAndDispatchCustomEvent(name, handler, detail, {
          discrete
        }) {
          const target = detail.originalEvent.target;
          const event = new CustomEvent(name, {
            bubbles: false,
            cancelable: true,
            detail
          });
          if (handler) target.addEventListener(name, handler, {
            once: true
          });
          if (discrete) {
            dispatchDiscreteCustomEvent(target, event);
          } else {
            target.dispatchEvent(event);
          }
        }
        var count$1 = 0;
        function useFocusGuards() {
          reactExports.useEffect(() => {
            const edgeGuards = document.querySelectorAll("[data-radix-focus-guard]");
            document.body.insertAdjacentElement("afterbegin", edgeGuards[0] ?? createFocusGuard());
            document.body.insertAdjacentElement("beforeend", edgeGuards[1] ?? createFocusGuard());
            count$1++;
            return () => {
              if (count$1 === 1) {
                document.querySelectorAll("[data-radix-focus-guard]").forEach(node => node.remove());
              }
              count$1--;
            };
          }, []);
        }
        function createFocusGuard() {
          const element = document.createElement("span");
          element.setAttribute("data-radix-focus-guard", "");
          element.tabIndex = 0;
          element.style.outline = "none";
          element.style.opacity = "0";
          element.style.position = "fixed";
          element.style.pointerEvents = "none";
          return element;
        }
        var AUTOFOCUS_ON_MOUNT = "focusScope.autoFocusOnMount";
        var AUTOFOCUS_ON_UNMOUNT = "focusScope.autoFocusOnUnmount";
        var EVENT_OPTIONS$1 = {
          bubbles: false,
          cancelable: true
        };
        var FOCUS_SCOPE_NAME = "FocusScope";
        var FocusScope = reactExports.forwardRef((props, forwardedRef) => {
          const {
            loop = false,
            trapped = false,
            onMountAutoFocus: onMountAutoFocusProp,
            onUnmountAutoFocus: onUnmountAutoFocusProp,
            ...scopeProps
          } = props;
          const [container, setContainer] = reactExports.useState(null);
          const onMountAutoFocus = useCallbackRef$1(onMountAutoFocusProp);
          const onUnmountAutoFocus = useCallbackRef$1(onUnmountAutoFocusProp);
          const lastFocusedElementRef = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, node => setContainer(node));
          const focusScope = reactExports.useRef({
            paused: false,
            pause() {
              this.paused = true;
            },
            resume() {
              this.paused = false;
            }
          }).current;
          reactExports.useEffect(() => {
            if (trapped) {
              let handleFocusIn2 = function (event) {
                  if (focusScope.paused || !container) return;
                  const target = event.target;
                  if (container.contains(target)) {
                    lastFocusedElementRef.current = target;
                  } else {
                    focus(lastFocusedElementRef.current, {
                      select: true
                    });
                  }
                },
                handleFocusOut2 = function (event) {
                  if (focusScope.paused || !container) return;
                  const relatedTarget = event.relatedTarget;
                  if (relatedTarget === null) return;
                  if (!container.contains(relatedTarget)) {
                    focus(lastFocusedElementRef.current, {
                      select: true
                    });
                  }
                },
                handleMutations2 = function (mutations) {
                  const focusedElement = document.activeElement;
                  if (focusedElement !== document.body) return;
                  for (const mutation of mutations) {
                    if (mutation.removedNodes.length > 0) focus(container);
                  }
                };
              document.addEventListener("focusin", handleFocusIn2);
              document.addEventListener("focusout", handleFocusOut2);
              const mutationObserver = new MutationObserver(handleMutations2);
              if (container) mutationObserver.observe(container, {
                childList: true,
                subtree: true
              });
              return () => {
                document.removeEventListener("focusin", handleFocusIn2);
                document.removeEventListener("focusout", handleFocusOut2);
                mutationObserver.disconnect();
              };
            }
          }, [trapped, container, focusScope.paused]);
          reactExports.useEffect(() => {
            if (container) {
              focusScopesStack.add(focusScope);
              const previouslyFocusedElement = document.activeElement;
              const hasFocusedCandidate = container.contains(previouslyFocusedElement);
              if (!hasFocusedCandidate) {
                const mountEvent = new CustomEvent(AUTOFOCUS_ON_MOUNT, EVENT_OPTIONS$1);
                container.addEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
                container.dispatchEvent(mountEvent);
                if (!mountEvent.defaultPrevented) {
                  focusFirst$2(removeLinks(getTabbableCandidates(container)), {
                    select: true
                  });
                  if (document.activeElement === previouslyFocusedElement) {
                    focus(container);
                  }
                }
              }
              return () => {
                container.removeEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
                setTimeout(() => {
                  const unmountEvent = new CustomEvent(AUTOFOCUS_ON_UNMOUNT, EVENT_OPTIONS$1);
                  container.addEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
                  container.dispatchEvent(unmountEvent);
                  if (!unmountEvent.defaultPrevented) {
                    focus(previouslyFocusedElement ?? document.body, {
                      select: true
                    });
                  }
                  container.removeEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
                  focusScopesStack.remove(focusScope);
                }, 0);
              };
            }
          }, [container, onMountAutoFocus, onUnmountAutoFocus, focusScope]);
          const handleKeyDown = reactExports.useCallback(event => {
            if (!loop && !trapped) return;
            if (focusScope.paused) return;
            const isTabKey = event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey;
            const focusedElement = document.activeElement;
            if (isTabKey && focusedElement) {
              const container2 = event.currentTarget;
              const [first, last] = getTabbableEdges(container2);
              const hasTabbableElementsInside = first && last;
              if (!hasTabbableElementsInside) {
                if (focusedElement === container2) event.preventDefault();
              } else {
                if (!event.shiftKey && focusedElement === last) {
                  event.preventDefault();
                  if (loop) focus(first, {
                    select: true
                  });
                } else if (event.shiftKey && focusedElement === first) {
                  event.preventDefault();
                  if (loop) focus(last, {
                    select: true
                  });
                }
              }
            }
          }, [loop, trapped, focusScope.paused]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            tabIndex: -1,
            ...scopeProps,
            ref: composedRefs,
            onKeyDown: handleKeyDown
          });
        });
        FocusScope.displayName = FOCUS_SCOPE_NAME;
        function focusFirst$2(candidates, {
          select = false
        } = {}) {
          const previouslyFocusedElement = document.activeElement;
          for (const candidate of candidates) {
            focus(candidate, {
              select
            });
            if (document.activeElement !== previouslyFocusedElement) return;
          }
        }
        function getTabbableEdges(container) {
          const candidates = getTabbableCandidates(container);
          const first = findVisible(candidates, container);
          const last = findVisible(candidates.reverse(), container);
          return [first, last];
        }
        function getTabbableCandidates(container) {
          const nodes = [];
          const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
            acceptNode: node => {
              const isHiddenInput = node.tagName === "INPUT" && node.type === "hidden";
              if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP;
              return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
          });
          while (walker.nextNode()) nodes.push(walker.currentNode);
          return nodes;
        }
        function findVisible(elements, container) {
          for (const element of elements) {
            if (!isHidden(element, {
              upTo: container
            })) return element;
          }
        }
        function isHidden(node, {
          upTo
        }) {
          if (getComputedStyle(node).visibility === "hidden") return true;
          while (node) {
            if (upTo !== void 0 && node === upTo) return false;
            if (getComputedStyle(node).display === "none") return true;
            node = node.parentElement;
          }
          return false;
        }
        function isSelectableInput(element) {
          return element instanceof HTMLInputElement && "select" in element;
        }
        function focus(element, {
          select = false
        } = {}) {
          if (element && element.focus) {
            const previouslyFocusedElement = document.activeElement;
            element.focus({
              preventScroll: true
            });
            if (element !== previouslyFocusedElement && isSelectableInput(element) && select) element.select();
          }
        }
        var focusScopesStack = createFocusScopesStack();
        function createFocusScopesStack() {
          let stack = [];
          return {
            add(focusScope) {
              const activeFocusScope = stack[0];
              if (focusScope !== activeFocusScope) {
                activeFocusScope?.pause();
              }
              stack = arrayRemove(stack, focusScope);
              stack.unshift(focusScope);
            },
            remove(focusScope) {
              stack = arrayRemove(stack, focusScope);
              stack[0]?.resume();
            }
          };
        }
        function arrayRemove(array, item) {
          const updatedArray = [...array];
          const index = updatedArray.indexOf(item);
          if (index !== -1) {
            updatedArray.splice(index, 1);
          }
          return updatedArray;
        }
        function removeLinks(items) {
          return items.filter(item => item.tagName !== "A");
        }

        // packages/react/use-layout-effect/src/use-layout-effect.tsx
        var useLayoutEffect2 = globalThis?.document ? reactExports.useLayoutEffect : () => {};

        // packages/react/id/src/id.tsx
        var useReactId = React$1[" useId ".trim().toString()] || (() => void 0);
        var count = 0;
        function useId(deterministicId) {
          const [id, setId] = reactExports.useState(useReactId());
          useLayoutEffect2(() => {
            setId(reactId => reactId ?? String(count++));
          }, [deterministicId]);
          return id ? `radix-${id}` : "";
        }

        /**
         * Custom positioning reference element.
         * @see https://floating-ui.com/docs/virtual-elements
         */

        const sides = ['top', 'right', 'bottom', 'left'];
        const min = Math.min;
        const max = Math.max;
        const round = Math.round;
        const floor = Math.floor;
        const createCoords = v => ({
          x: v,
          y: v
        });
        const oppositeSideMap = {
          left: 'right',
          right: 'left',
          bottom: 'top',
          top: 'bottom'
        };
        const oppositeAlignmentMap = {
          start: 'end',
          end: 'start'
        };
        function clamp(start, value, end) {
          return max(start, min(value, end));
        }
        function evaluate(value, param) {
          return typeof value === 'function' ? value(param) : value;
        }
        function getSide(placement) {
          return placement.split('-')[0];
        }
        function getAlignment(placement) {
          return placement.split('-')[1];
        }
        function getOppositeAxis(axis) {
          return axis === 'x' ? 'y' : 'x';
        }
        function getAxisLength(axis) {
          return axis === 'y' ? 'height' : 'width';
        }
        const yAxisSides = /*#__PURE__*/new Set(['top', 'bottom']);
        function getSideAxis(placement) {
          return yAxisSides.has(getSide(placement)) ? 'y' : 'x';
        }
        function getAlignmentAxis(placement) {
          return getOppositeAxis(getSideAxis(placement));
        }
        function getAlignmentSides(placement, rects, rtl) {
          if (rtl === void 0) {
            rtl = false;
          }
          const alignment = getAlignment(placement);
          const alignmentAxis = getAlignmentAxis(placement);
          const length = getAxisLength(alignmentAxis);
          let mainAlignmentSide = alignmentAxis === 'x' ? alignment === (rtl ? 'end' : 'start') ? 'right' : 'left' : alignment === 'start' ? 'bottom' : 'top';
          if (rects.reference[length] > rects.floating[length]) {
            mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
          }
          return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
        }
        function getExpandedPlacements(placement) {
          const oppositePlacement = getOppositePlacement(placement);
          return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
        }
        function getOppositeAlignmentPlacement(placement) {
          return placement.replace(/start|end/g, alignment => oppositeAlignmentMap[alignment]);
        }
        const lrPlacement = ['left', 'right'];
        const rlPlacement = ['right', 'left'];
        const tbPlacement = ['top', 'bottom'];
        const btPlacement = ['bottom', 'top'];
        function getSideList(side, isStart, rtl) {
          switch (side) {
            case 'top':
            case 'bottom':
              if (rtl) return isStart ? rlPlacement : lrPlacement;
              return isStart ? lrPlacement : rlPlacement;
            case 'left':
            case 'right':
              return isStart ? tbPlacement : btPlacement;
            default:
              return [];
          }
        }
        function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
          const alignment = getAlignment(placement);
          let list = getSideList(getSide(placement), direction === 'start', rtl);
          if (alignment) {
            list = list.map(side => side + "-" + alignment);
            if (flipAlignment) {
              list = list.concat(list.map(getOppositeAlignmentPlacement));
            }
          }
          return list;
        }
        function getOppositePlacement(placement) {
          return placement.replace(/left|right|bottom|top/g, side => oppositeSideMap[side]);
        }
        function expandPaddingObject(padding) {
          return {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            ...padding
          };
        }
        function getPaddingObject(padding) {
          return typeof padding !== 'number' ? expandPaddingObject(padding) : {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding
          };
        }
        function rectToClientRect(rect) {
          const {
            x,
            y,
            width,
            height
          } = rect;
          return {
            width,
            height,
            top: y,
            left: x,
            right: x + width,
            bottom: y + height,
            x,
            y
          };
        }
        function computeCoordsFromPlacement(_ref, placement, rtl) {
          let {
            reference,
            floating
          } = _ref;
          const sideAxis = getSideAxis(placement);
          const alignmentAxis = getAlignmentAxis(placement);
          const alignLength = getAxisLength(alignmentAxis);
          const side = getSide(placement);
          const isVertical = sideAxis === 'y';
          const commonX = reference.x + reference.width / 2 - floating.width / 2;
          const commonY = reference.y + reference.height / 2 - floating.height / 2;
          const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
          let coords;
          switch (side) {
            case 'top':
              coords = {
                x: commonX,
                y: reference.y - floating.height
              };
              break;
            case 'bottom':
              coords = {
                x: commonX,
                y: reference.y + reference.height
              };
              break;
            case 'right':
              coords = {
                x: reference.x + reference.width,
                y: commonY
              };
              break;
            case 'left':
              coords = {
                x: reference.x - floating.width,
                y: commonY
              };
              break;
            default:
              coords = {
                x: reference.x,
                y: reference.y
              };
          }
          switch (getAlignment(placement)) {
            case 'start':
              coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
              break;
            case 'end':
              coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
              break;
          }
          return coords;
        }

        /**
         * Computes the `x` and `y` coordinates that will place the floating element
         * next to a given reference element.
         *
         * This export does not have any `platform` interface logic. You will need to
         * write one for the platform you are using Floating UI with.
         */
        const computePosition$1 = async (reference, floating, config) => {
          const {
            placement = 'bottom',
            strategy = 'absolute',
            middleware = [],
            platform
          } = config;
          const validMiddleware = middleware.filter(Boolean);
          const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
          let rects = await platform.getElementRects({
            reference,
            floating,
            strategy
          });
          let {
            x,
            y
          } = computeCoordsFromPlacement(rects, placement, rtl);
          let statefulPlacement = placement;
          let middlewareData = {};
          let resetCount = 0;
          for (let i = 0; i < validMiddleware.length; i++) {
            const {
              name,
              fn
            } = validMiddleware[i];
            const {
              x: nextX,
              y: nextY,
              data,
              reset
            } = await fn({
              x,
              y,
              initialPlacement: placement,
              placement: statefulPlacement,
              strategy,
              middlewareData,
              rects,
              platform,
              elements: {
                reference,
                floating
              }
            });
            x = nextX != null ? nextX : x;
            y = nextY != null ? nextY : y;
            middlewareData = {
              ...middlewareData,
              [name]: {
                ...middlewareData[name],
                ...data
              }
            };
            if (reset && resetCount <= 50) {
              resetCount++;
              if (typeof reset === 'object') {
                if (reset.placement) {
                  statefulPlacement = reset.placement;
                }
                if (reset.rects) {
                  rects = reset.rects === true ? await platform.getElementRects({
                    reference,
                    floating,
                    strategy
                  }) : reset.rects;
                }
                ({
                  x,
                  y
                } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
              }
              i = -1;
            }
          }
          return {
            x,
            y,
            placement: statefulPlacement,
            strategy,
            middlewareData
          };
        };

        /**
         * Resolves with an object of overflow side offsets that determine how much the
         * element is overflowing a given clipping boundary on each side.
         * - positive = overflowing the boundary by that number of pixels
         * - negative = how many pixels left before it will overflow
         * - 0 = lies flush with the boundary
         * @see https://floating-ui.com/docs/detectOverflow
         */
        async function detectOverflow(state, options) {
          var _await$platform$isEle;
          if (options === void 0) {
            options = {};
          }
          const {
            x,
            y,
            platform,
            rects,
            elements,
            strategy
          } = state;
          const {
            boundary = 'clippingAncestors',
            rootBoundary = 'viewport',
            elementContext = 'floating',
            altBoundary = false,
            padding = 0
          } = evaluate(options, state);
          const paddingObject = getPaddingObject(padding);
          const altContext = elementContext === 'floating' ? 'reference' : 'floating';
          const element = elements[altBoundary ? altContext : elementContext];
          const clippingClientRect = rectToClientRect(await platform.getClippingRect({
            element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || (await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating))),
            boundary,
            rootBoundary,
            strategy
          }));
          const rect = elementContext === 'floating' ? {
            x,
            y,
            width: rects.floating.width,
            height: rects.floating.height
          } : rects.reference;
          const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
          const offsetScale = (await (platform.isElement == null ? void 0 : platform.isElement(offsetParent))) ? (await (platform.getScale == null ? void 0 : platform.getScale(offsetParent))) || {
            x: 1,
            y: 1
          } : {
            x: 1,
            y: 1
          };
          const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
            elements,
            rect,
            offsetParent,
            strategy
          }) : rect);
          return {
            top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
            bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
            left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
            right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
          };
        }

        /**
         * Provides data to position an inner element of the floating element so that it
         * appears centered to the reference element.
         * @see https://floating-ui.com/docs/arrow
         */
        const arrow$3 = options => ({
          name: 'arrow',
          options,
          async fn(state) {
            const {
              x,
              y,
              placement,
              rects,
              platform,
              elements,
              middlewareData
            } = state;
            // Since `element` is required, we don't Partial<> the type.
            const {
              element,
              padding = 0
            } = evaluate(options, state) || {};
            if (element == null) {
              return {};
            }
            const paddingObject = getPaddingObject(padding);
            const coords = {
              x,
              y
            };
            const axis = getAlignmentAxis(placement);
            const length = getAxisLength(axis);
            const arrowDimensions = await platform.getDimensions(element);
            const isYAxis = axis === 'y';
            const minProp = isYAxis ? 'top' : 'left';
            const maxProp = isYAxis ? 'bottom' : 'right';
            const clientProp = isYAxis ? 'clientHeight' : 'clientWidth';
            const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
            const startDiff = coords[axis] - rects.reference[axis];
            const arrowOffsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(element));
            let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;

            // DOM platform can return `window` as the `offsetParent`.
            if (!clientSize || !(await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent)))) {
              clientSize = elements.floating[clientProp] || rects.floating[length];
            }
            const centerToReference = endDiff / 2 - startDiff / 2;

            // If the padding is large enough that it causes the arrow to no longer be
            // centered, modify the padding so that it is centered.
            const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
            const minPadding = min(paddingObject[minProp], largestPossiblePadding);
            const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);

            // Make sure the arrow doesn't overflow the floating element if the center
            // point is outside the floating element's bounds.
            const min$1 = minPadding;
            const max = clientSize - arrowDimensions[length] - maxPadding;
            const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
            const offset = clamp(min$1, center, max);

            // If the reference is small enough that the arrow's padding causes it to
            // to point to nothing for an aligned placement, adjust the offset of the
            // floating element itself. To ensure `shift()` continues to take action,
            // a single reset is performed when this is true.
            const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
            const alignmentOffset = shouldAddOffset ? center < min$1 ? center - min$1 : center - max : 0;
            return {
              [axis]: coords[axis] + alignmentOffset,
              data: {
                [axis]: offset,
                centerOffset: center - offset - alignmentOffset,
                ...(shouldAddOffset && {
                  alignmentOffset
                })
              },
              reset: shouldAddOffset
            };
          }
        });

        /**
         * Optimizes the visibility of the floating element by flipping the `placement`
         * in order to keep it in view when the preferred placement(s) will overflow the
         * clipping boundary. Alternative to `autoPlacement`.
         * @see https://floating-ui.com/docs/flip
         */
        const flip$2 = function (options) {
          if (options === void 0) {
            options = {};
          }
          return {
            name: 'flip',
            options,
            async fn(state) {
              var _middlewareData$arrow, _middlewareData$flip;
              const {
                placement,
                middlewareData,
                rects,
                initialPlacement,
                platform,
                elements
              } = state;
              const {
                mainAxis: checkMainAxis = true,
                crossAxis: checkCrossAxis = true,
                fallbackPlacements: specifiedFallbackPlacements,
                fallbackStrategy = 'bestFit',
                fallbackAxisSideDirection = 'none',
                flipAlignment = true,
                ...detectOverflowOptions
              } = evaluate(options, state);

              // If a reset by the arrow was caused due to an alignment offset being
              // added, we should skip any logic now since `flip()` has already done its
              // work.
              // https://github.com/floating-ui/floating-ui/issues/2549#issuecomment-1719601643
              if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
                return {};
              }
              const side = getSide(placement);
              const initialSideAxis = getSideAxis(initialPlacement);
              const isBasePlacement = getSide(initialPlacement) === initialPlacement;
              const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
              const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
              const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== 'none';
              if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
                fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
              }
              const placements = [initialPlacement, ...fallbackPlacements];
              const overflow = await detectOverflow(state, detectOverflowOptions);
              const overflows = [];
              let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
              if (checkMainAxis) {
                overflows.push(overflow[side]);
              }
              if (checkCrossAxis) {
                const sides = getAlignmentSides(placement, rects, rtl);
                overflows.push(overflow[sides[0]], overflow[sides[1]]);
              }
              overflowsData = [...overflowsData, {
                placement,
                overflows
              }];

              // One or more sides is overflowing.
              if (!overflows.every(side => side <= 0)) {
                var _middlewareData$flip2, _overflowsData$filter;
                const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
                const nextPlacement = placements[nextIndex];
                if (nextPlacement) {
                  const ignoreCrossAxisOverflow = checkCrossAxis === 'alignment' ? initialSideAxis !== getSideAxis(nextPlacement) : false;
                  if (!ignoreCrossAxisOverflow ||
                  // We leave the current main axis only if every placement on that axis
                  // overflows the main axis.
                  overflowsData.every(d => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) {
                    // Try next placement and re-run the lifecycle.
                    return {
                      data: {
                        index: nextIndex,
                        overflows: overflowsData
                      },
                      reset: {
                        placement: nextPlacement
                      }
                    };
                  }
                }

                // First, find the candidates that fit on the mainAxis side of overflow,
                // then find the placement that fits the best on the main crossAxis side.
                let resetPlacement = (_overflowsData$filter = overflowsData.filter(d => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;

                // Otherwise fallback.
                if (!resetPlacement) {
                  switch (fallbackStrategy) {
                    case 'bestFit':
                      {
                        var _overflowsData$filter2;
                        const placement = (_overflowsData$filter2 = overflowsData.filter(d => {
                          if (hasFallbackAxisSideDirection) {
                            const currentSideAxis = getSideAxis(d.placement);
                            return currentSideAxis === initialSideAxis ||
                            // Create a bias to the `y` side axis due to horizontal
                            // reading directions favoring greater width.
                            currentSideAxis === 'y';
                          }
                          return true;
                        }).map(d => [d.placement, d.overflows.filter(overflow => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
                        if (placement) {
                          resetPlacement = placement;
                        }
                        break;
                      }
                    case 'initialPlacement':
                      resetPlacement = initialPlacement;
                      break;
                  }
                }
                if (placement !== resetPlacement) {
                  return {
                    reset: {
                      placement: resetPlacement
                    }
                  };
                }
              }
              return {};
            }
          };
        };
        function getSideOffsets(overflow, rect) {
          return {
            top: overflow.top - rect.height,
            right: overflow.right - rect.width,
            bottom: overflow.bottom - rect.height,
            left: overflow.left - rect.width
          };
        }
        function isAnySideFullyClipped(overflow) {
          return sides.some(side => overflow[side] >= 0);
        }
        /**
         * Provides data to hide the floating element in applicable situations, such as
         * when it is not in the same clipping context as the reference element.
         * @see https://floating-ui.com/docs/hide
         */
        const hide$2 = function (options) {
          if (options === void 0) {
            options = {};
          }
          return {
            name: 'hide',
            options,
            async fn(state) {
              const {
                rects
              } = state;
              const {
                strategy = 'referenceHidden',
                ...detectOverflowOptions
              } = evaluate(options, state);
              switch (strategy) {
                case 'referenceHidden':
                  {
                    const overflow = await detectOverflow(state, {
                      ...detectOverflowOptions,
                      elementContext: 'reference'
                    });
                    const offsets = getSideOffsets(overflow, rects.reference);
                    return {
                      data: {
                        referenceHiddenOffsets: offsets,
                        referenceHidden: isAnySideFullyClipped(offsets)
                      }
                    };
                  }
                case 'escaped':
                  {
                    const overflow = await detectOverflow(state, {
                      ...detectOverflowOptions,
                      altBoundary: true
                    });
                    const offsets = getSideOffsets(overflow, rects.floating);
                    return {
                      data: {
                        escapedOffsets: offsets,
                        escaped: isAnySideFullyClipped(offsets)
                      }
                    };
                  }
                default:
                  {
                    return {};
                  }
              }
            }
          };
        };
        const originSides = /*#__PURE__*/new Set(['left', 'top']);

        // For type backwards-compatibility, the `OffsetOptions` type was also
        // Derivable.

        async function convertValueToCoords(state, options) {
          const {
            placement,
            platform,
            elements
          } = state;
          const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
          const side = getSide(placement);
          const alignment = getAlignment(placement);
          const isVertical = getSideAxis(placement) === 'y';
          const mainAxisMulti = originSides.has(side) ? -1 : 1;
          const crossAxisMulti = rtl && isVertical ? -1 : 1;
          const rawValue = evaluate(options, state);

          // eslint-disable-next-line prefer-const
          let {
            mainAxis,
            crossAxis,
            alignmentAxis
          } = typeof rawValue === 'number' ? {
            mainAxis: rawValue,
            crossAxis: 0,
            alignmentAxis: null
          } : {
            mainAxis: rawValue.mainAxis || 0,
            crossAxis: rawValue.crossAxis || 0,
            alignmentAxis: rawValue.alignmentAxis
          };
          if (alignment && typeof alignmentAxis === 'number') {
            crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis;
          }
          return isVertical ? {
            x: crossAxis * crossAxisMulti,
            y: mainAxis * mainAxisMulti
          } : {
            x: mainAxis * mainAxisMulti,
            y: crossAxis * crossAxisMulti
          };
        }

        /**
         * Modifies the placement by translating the floating element along the
         * specified axes.
         * A number (shorthand for `mainAxis` or distance), or an axes configuration
         * object may be passed.
         * @see https://floating-ui.com/docs/offset
         */
        const offset$2 = function (options) {
          if (options === void 0) {
            options = 0;
          }
          return {
            name: 'offset',
            options,
            async fn(state) {
              var _middlewareData$offse, _middlewareData$arrow;
              const {
                x,
                y,
                placement,
                middlewareData
              } = state;
              const diffCoords = await convertValueToCoords(state, options);

              // If the placement is the same and the arrow caused an alignment offset
              // then we don't need to change the positioning coordinates.
              if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
                return {};
              }
              return {
                x: x + diffCoords.x,
                y: y + diffCoords.y,
                data: {
                  ...diffCoords,
                  placement
                }
              };
            }
          };
        };

        /**
         * Optimizes the visibility of the floating element by shifting it in order to
         * keep it in view when it will overflow the clipping boundary.
         * @see https://floating-ui.com/docs/shift
         */
        const shift$2 = function (options) {
          if (options === void 0) {
            options = {};
          }
          return {
            name: 'shift',
            options,
            async fn(state) {
              const {
                x,
                y,
                placement
              } = state;
              const {
                mainAxis: checkMainAxis = true,
                crossAxis: checkCrossAxis = false,
                limiter = {
                  fn: _ref => {
                    let {
                      x,
                      y
                    } = _ref;
                    return {
                      x,
                      y
                    };
                  }
                },
                ...detectOverflowOptions
              } = evaluate(options, state);
              const coords = {
                x,
                y
              };
              const overflow = await detectOverflow(state, detectOverflowOptions);
              const crossAxis = getSideAxis(getSide(placement));
              const mainAxis = getOppositeAxis(crossAxis);
              let mainAxisCoord = coords[mainAxis];
              let crossAxisCoord = coords[crossAxis];
              if (checkMainAxis) {
                const minSide = mainAxis === 'y' ? 'top' : 'left';
                const maxSide = mainAxis === 'y' ? 'bottom' : 'right';
                const min = mainAxisCoord + overflow[minSide];
                const max = mainAxisCoord - overflow[maxSide];
                mainAxisCoord = clamp(min, mainAxisCoord, max);
              }
              if (checkCrossAxis) {
                const minSide = crossAxis === 'y' ? 'top' : 'left';
                const maxSide = crossAxis === 'y' ? 'bottom' : 'right';
                const min = crossAxisCoord + overflow[minSide];
                const max = crossAxisCoord - overflow[maxSide];
                crossAxisCoord = clamp(min, crossAxisCoord, max);
              }
              const limitedCoords = limiter.fn({
                ...state,
                [mainAxis]: mainAxisCoord,
                [crossAxis]: crossAxisCoord
              });
              return {
                ...limitedCoords,
                data: {
                  x: limitedCoords.x - x,
                  y: limitedCoords.y - y,
                  enabled: {
                    [mainAxis]: checkMainAxis,
                    [crossAxis]: checkCrossAxis
                  }
                }
              };
            }
          };
        };
        /**
         * Built-in `limiter` that will stop `shift()` at a certain point.
         */
        const limitShift$2 = function (options) {
          if (options === void 0) {
            options = {};
          }
          return {
            options,
            fn(state) {
              const {
                x,
                y,
                placement,
                rects,
                middlewareData
              } = state;
              const {
                offset = 0,
                mainAxis: checkMainAxis = true,
                crossAxis: checkCrossAxis = true
              } = evaluate(options, state);
              const coords = {
                x,
                y
              };
              const crossAxis = getSideAxis(placement);
              const mainAxis = getOppositeAxis(crossAxis);
              let mainAxisCoord = coords[mainAxis];
              let crossAxisCoord = coords[crossAxis];
              const rawOffset = evaluate(offset, state);
              const computedOffset = typeof rawOffset === 'number' ? {
                mainAxis: rawOffset,
                crossAxis: 0
              } : {
                mainAxis: 0,
                crossAxis: 0,
                ...rawOffset
              };
              if (checkMainAxis) {
                const len = mainAxis === 'y' ? 'height' : 'width';
                const limitMin = rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis;
                const limitMax = rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
                if (mainAxisCoord < limitMin) {
                  mainAxisCoord = limitMin;
                } else if (mainAxisCoord > limitMax) {
                  mainAxisCoord = limitMax;
                }
              }
              if (checkCrossAxis) {
                var _middlewareData$offse, _middlewareData$offse2;
                const len = mainAxis === 'y' ? 'width' : 'height';
                const isOriginSide = originSides.has(getSide(placement));
                const limitMin = rects.reference[crossAxis] - rects.floating[len] + (isOriginSide ? ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse[crossAxis]) || 0 : 0) + (isOriginSide ? 0 : computedOffset.crossAxis);
                const limitMax = rects.reference[crossAxis] + rects.reference[len] + (isOriginSide ? 0 : ((_middlewareData$offse2 = middlewareData.offset) == null ? void 0 : _middlewareData$offse2[crossAxis]) || 0) - (isOriginSide ? computedOffset.crossAxis : 0);
                if (crossAxisCoord < limitMin) {
                  crossAxisCoord = limitMin;
                } else if (crossAxisCoord > limitMax) {
                  crossAxisCoord = limitMax;
                }
              }
              return {
                [mainAxis]: mainAxisCoord,
                [crossAxis]: crossAxisCoord
              };
            }
          };
        };

        /**
         * Provides data that allows you to change the size of the floating element —
         * for instance, prevent it from overflowing the clipping boundary or match the
         * width of the reference element.
         * @see https://floating-ui.com/docs/size
         */
        const size$2 = function (options) {
          if (options === void 0) {
            options = {};
          }
          return {
            name: 'size',
            options,
            async fn(state) {
              var _state$middlewareData, _state$middlewareData2;
              const {
                placement,
                rects,
                platform,
                elements
              } = state;
              const {
                apply = () => {},
                ...detectOverflowOptions
              } = evaluate(options, state);
              const overflow = await detectOverflow(state, detectOverflowOptions);
              const side = getSide(placement);
              const alignment = getAlignment(placement);
              const isYAxis = getSideAxis(placement) === 'y';
              const {
                width,
                height
              } = rects.floating;
              let heightSide;
              let widthSide;
              if (side === 'top' || side === 'bottom') {
                heightSide = side;
                widthSide = alignment === ((await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating))) ? 'start' : 'end') ? 'left' : 'right';
              } else {
                widthSide = side;
                heightSide = alignment === 'end' ? 'top' : 'bottom';
              }
              const maximumClippingHeight = height - overflow.top - overflow.bottom;
              const maximumClippingWidth = width - overflow.left - overflow.right;
              const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
              const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
              const noShift = !state.middlewareData.shift;
              let availableHeight = overflowAvailableHeight;
              let availableWidth = overflowAvailableWidth;
              if ((_state$middlewareData = state.middlewareData.shift) != null && _state$middlewareData.enabled.x) {
                availableWidth = maximumClippingWidth;
              }
              if ((_state$middlewareData2 = state.middlewareData.shift) != null && _state$middlewareData2.enabled.y) {
                availableHeight = maximumClippingHeight;
              }
              if (noShift && !alignment) {
                const xMin = max(overflow.left, 0);
                const xMax = max(overflow.right, 0);
                const yMin = max(overflow.top, 0);
                const yMax = max(overflow.bottom, 0);
                if (isYAxis) {
                  availableWidth = width - 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right));
                } else {
                  availableHeight = height - 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom));
                }
              }
              await apply({
                ...state,
                availableWidth,
                availableHeight
              });
              const nextDimensions = await platform.getDimensions(elements.floating);
              if (width !== nextDimensions.width || height !== nextDimensions.height) {
                return {
                  reset: {
                    rects: true
                  }
                };
              }
              return {};
            }
          };
        };
        function hasWindow() {
          return typeof window !== 'undefined';
        }
        function getNodeName(node) {
          if (isNode(node)) {
            return (node.nodeName || '').toLowerCase();
          }
          // Mocked nodes in testing environments may not be instances of Node. By
          // returning `#document` an infinite loop won't occur.
          // https://github.com/floating-ui/floating-ui/issues/2317
          return '#document';
        }
        function getWindow(node) {
          var _node$ownerDocument;
          return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
        }
        function getDocumentElement(node) {
          var _ref;
          return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
        }
        function isNode(value) {
          if (!hasWindow()) {
            return false;
          }
          return value instanceof Node || value instanceof getWindow(value).Node;
        }
        function isElement(value) {
          if (!hasWindow()) {
            return false;
          }
          return value instanceof Element || value instanceof getWindow(value).Element;
        }
        function isHTMLElement(value) {
          if (!hasWindow()) {
            return false;
          }
          return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
        }
        function isShadowRoot(value) {
          if (!hasWindow() || typeof ShadowRoot === 'undefined') {
            return false;
          }
          return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
        }
        const invalidOverflowDisplayValues = /*#__PURE__*/new Set(['inline', 'contents']);
        function isOverflowElement(element) {
          const {
            overflow,
            overflowX,
            overflowY,
            display
          } = getComputedStyle$1(element);
          return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !invalidOverflowDisplayValues.has(display);
        }
        const tableElements = /*#__PURE__*/new Set(['table', 'td', 'th']);
        function isTableElement(element) {
          return tableElements.has(getNodeName(element));
        }
        const topLayerSelectors = [':popover-open', ':modal'];
        function isTopLayer(element) {
          return topLayerSelectors.some(selector => {
            try {
              return element.matches(selector);
            } catch (_e) {
              return false;
            }
          });
        }
        const transformProperties = ['transform', 'translate', 'scale', 'rotate', 'perspective'];
        const willChangeValues = ['transform', 'translate', 'scale', 'rotate', 'perspective', 'filter'];
        const containValues = ['paint', 'layout', 'strict', 'content'];
        function isContainingBlock(elementOrCss) {
          const webkit = isWebKit();
          const css = isElement(elementOrCss) ? getComputedStyle$1(elementOrCss) : elementOrCss;

          // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
          // https://drafts.csswg.org/css-transforms-2/#individual-transforms
          return transformProperties.some(value => css[value] ? css[value] !== 'none' : false) || (css.containerType ? css.containerType !== 'normal' : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== 'none' : false) || !webkit && (css.filter ? css.filter !== 'none' : false) || willChangeValues.some(value => (css.willChange || '').includes(value)) || containValues.some(value => (css.contain || '').includes(value));
        }
        function getContainingBlock(element) {
          let currentNode = getParentNode(element);
          while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
            if (isContainingBlock(currentNode)) {
              return currentNode;
            } else if (isTopLayer(currentNode)) {
              return null;
            }
            currentNode = getParentNode(currentNode);
          }
          return null;
        }
        function isWebKit() {
          if (typeof CSS === 'undefined' || !CSS.supports) return false;
          return CSS.supports('-webkit-backdrop-filter', 'none');
        }
        const lastTraversableNodeNames = /*#__PURE__*/new Set(['html', 'body', '#document']);
        function isLastTraversableNode(node) {
          return lastTraversableNodeNames.has(getNodeName(node));
        }
        function getComputedStyle$1(element) {
          return getWindow(element).getComputedStyle(element);
        }
        function getNodeScroll(element) {
          if (isElement(element)) {
            return {
              scrollLeft: element.scrollLeft,
              scrollTop: element.scrollTop
            };
          }
          return {
            scrollLeft: element.scrollX,
            scrollTop: element.scrollY
          };
        }
        function getParentNode(node) {
          if (getNodeName(node) === 'html') {
            return node;
          }
          const result =
          // Step into the shadow DOM of the parent of a slotted node.
          node.assignedSlot ||
          // DOM Element detected.
          node.parentNode ||
          // ShadowRoot detected.
          isShadowRoot(node) && node.host ||
          // Fallback.
          getDocumentElement(node);
          return isShadowRoot(result) ? result.host : result;
        }
        function getNearestOverflowAncestor(node) {
          const parentNode = getParentNode(node);
          if (isLastTraversableNode(parentNode)) {
            return node.ownerDocument ? node.ownerDocument.body : node.body;
          }
          if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
            return parentNode;
          }
          return getNearestOverflowAncestor(parentNode);
        }
        function getOverflowAncestors(node, list, traverseIframes) {
          var _node$ownerDocument2;
          if (list === void 0) {
            list = [];
          }
          if (traverseIframes === void 0) {
            traverseIframes = true;
          }
          const scrollableAncestor = getNearestOverflowAncestor(node);
          const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
          const win = getWindow(scrollableAncestor);
          if (isBody) {
            const frameElement = getFrameElement(win);
            return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
          }
          return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
        }
        function getFrameElement(win) {
          return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
        }
        function getCssDimensions(element) {
          const css = getComputedStyle$1(element);
          // In testing environments, the `width` and `height` properties are empty
          // strings for SVG elements, returning NaN. Fallback to `0` in this case.
          let width = parseFloat(css.width) || 0;
          let height = parseFloat(css.height) || 0;
          const hasOffset = isHTMLElement(element);
          const offsetWidth = hasOffset ? element.offsetWidth : width;
          const offsetHeight = hasOffset ? element.offsetHeight : height;
          const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
          if (shouldFallback) {
            width = offsetWidth;
            height = offsetHeight;
          }
          return {
            width,
            height,
            $: shouldFallback
          };
        }
        function unwrapElement(element) {
          return !isElement(element) ? element.contextElement : element;
        }
        function getScale(element) {
          const domElement = unwrapElement(element);
          if (!isHTMLElement(domElement)) {
            return createCoords(1);
          }
          const rect = domElement.getBoundingClientRect();
          const {
            width,
            height,
            $
          } = getCssDimensions(domElement);
          let x = ($ ? round(rect.width) : rect.width) / width;
          let y = ($ ? round(rect.height) : rect.height) / height;

          // 0, NaN, or Infinity should always fallback to 1.

          if (!x || !Number.isFinite(x)) {
            x = 1;
          }
          if (!y || !Number.isFinite(y)) {
            y = 1;
          }
          return {
            x,
            y
          };
        }
        const noOffsets = /*#__PURE__*/createCoords(0);
        function getVisualOffsets(element) {
          const win = getWindow(element);
          if (!isWebKit() || !win.visualViewport) {
            return noOffsets;
          }
          return {
            x: win.visualViewport.offsetLeft,
            y: win.visualViewport.offsetTop
          };
        }
        function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
          if (isFixed === void 0) {
            isFixed = false;
          }
          if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
            return false;
          }
          return isFixed;
        }
        function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
          if (includeScale === void 0) {
            includeScale = false;
          }
          if (isFixedStrategy === void 0) {
            isFixedStrategy = false;
          }
          const clientRect = element.getBoundingClientRect();
          const domElement = unwrapElement(element);
          let scale = createCoords(1);
          if (includeScale) {
            if (offsetParent) {
              if (isElement(offsetParent)) {
                scale = getScale(offsetParent);
              }
            } else {
              scale = getScale(element);
            }
          }
          const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
          let x = (clientRect.left + visualOffsets.x) / scale.x;
          let y = (clientRect.top + visualOffsets.y) / scale.y;
          let width = clientRect.width / scale.x;
          let height = clientRect.height / scale.y;
          if (domElement) {
            const win = getWindow(domElement);
            const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
            let currentWin = win;
            let currentIFrame = getFrameElement(currentWin);
            while (currentIFrame && offsetParent && offsetWin !== currentWin) {
              const iframeScale = getScale(currentIFrame);
              const iframeRect = currentIFrame.getBoundingClientRect();
              const css = getComputedStyle$1(currentIFrame);
              const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
              const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
              x *= iframeScale.x;
              y *= iframeScale.y;
              width *= iframeScale.x;
              height *= iframeScale.y;
              x += left;
              y += top;
              currentWin = getWindow(currentIFrame);
              currentIFrame = getFrameElement(currentWin);
            }
          }
          return rectToClientRect({
            width,
            height,
            x,
            y
          });
        }

        // If <html> has a CSS width greater than the viewport, then this will be
        // incorrect for RTL.
        function getWindowScrollBarX(element, rect) {
          const leftScroll = getNodeScroll(element).scrollLeft;
          if (!rect) {
            return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
          }
          return rect.left + leftScroll;
        }
        function getHTMLOffset(documentElement, scroll) {
          const htmlRect = documentElement.getBoundingClientRect();
          const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
          const y = htmlRect.top + scroll.scrollTop;
          return {
            x,
            y
          };
        }
        function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
          let {
            elements,
            rect,
            offsetParent,
            strategy
          } = _ref;
          const isFixed = strategy === 'fixed';
          const documentElement = getDocumentElement(offsetParent);
          const topLayer = elements ? isTopLayer(elements.floating) : false;
          if (offsetParent === documentElement || topLayer && isFixed) {
            return rect;
          }
          let scroll = {
            scrollLeft: 0,
            scrollTop: 0
          };
          let scale = createCoords(1);
          const offsets = createCoords(0);
          const isOffsetParentAnElement = isHTMLElement(offsetParent);
          if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
            if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
              scroll = getNodeScroll(offsetParent);
            }
            if (isHTMLElement(offsetParent)) {
              const offsetRect = getBoundingClientRect(offsetParent);
              scale = getScale(offsetParent);
              offsets.x = offsetRect.x + offsetParent.clientLeft;
              offsets.y = offsetRect.y + offsetParent.clientTop;
            }
          }
          const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
          return {
            width: rect.width * scale.x,
            height: rect.height * scale.y,
            x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
            y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
          };
        }
        function getClientRects(element) {
          return Array.from(element.getClientRects());
        }

        // Gets the entire size of the scrollable document area, even extending outside
        // of the `<html>` and `<body>` rect bounds if horizontally scrollable.
        function getDocumentRect(element) {
          const html = getDocumentElement(element);
          const scroll = getNodeScroll(element);
          const body = element.ownerDocument.body;
          const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
          const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
          let x = -scroll.scrollLeft + getWindowScrollBarX(element);
          const y = -scroll.scrollTop;
          if (getComputedStyle$1(body).direction === 'rtl') {
            x += max(html.clientWidth, body.clientWidth) - width;
          }
          return {
            width,
            height,
            x,
            y
          };
        }

        // Safety check: ensure the scrollbar space is reasonable in case this
        // calculation is affected by unusual styles.
        // Most scrollbars leave 15-18px of space.
        const SCROLLBAR_MAX = 25;
        function getViewportRect(element, strategy) {
          const win = getWindow(element);
          const html = getDocumentElement(element);
          const visualViewport = win.visualViewport;
          let width = html.clientWidth;
          let height = html.clientHeight;
          let x = 0;
          let y = 0;
          if (visualViewport) {
            width = visualViewport.width;
            height = visualViewport.height;
            const visualViewportBased = isWebKit();
            if (!visualViewportBased || visualViewportBased && strategy === 'fixed') {
              x = visualViewport.offsetLeft;
              y = visualViewport.offsetTop;
            }
          }
          const windowScrollbarX = getWindowScrollBarX(html);
          // <html> `overflow: hidden` + `scrollbar-gutter: stable` reduces the
          // visual width of the <html> but this is not considered in the size
          // of `html.clientWidth`.
          if (windowScrollbarX <= 0) {
            const doc = html.ownerDocument;
            const body = doc.body;
            const bodyStyles = getComputedStyle(body);
            const bodyMarginInline = doc.compatMode === 'CSS1Compat' ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
            const clippingStableScrollbarWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
            if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) {
              width -= clippingStableScrollbarWidth;
            }
          } else if (windowScrollbarX <= SCROLLBAR_MAX) {
            // If the <body> scrollbar is on the left, the width needs to be extended
            // by the scrollbar amount so there isn't extra space on the right.
            width += windowScrollbarX;
          }
          return {
            width,
            height,
            x,
            y
          };
        }
        const absoluteOrFixed = /*#__PURE__*/new Set(['absolute', 'fixed']);
        // Returns the inner client rect, subtracting scrollbars if present.
        function getInnerBoundingClientRect(element, strategy) {
          const clientRect = getBoundingClientRect(element, true, strategy === 'fixed');
          const top = clientRect.top + element.clientTop;
          const left = clientRect.left + element.clientLeft;
          const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
          const width = element.clientWidth * scale.x;
          const height = element.clientHeight * scale.y;
          const x = left * scale.x;
          const y = top * scale.y;
          return {
            width,
            height,
            x,
            y
          };
        }
        function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
          let rect;
          if (clippingAncestor === 'viewport') {
            rect = getViewportRect(element, strategy);
          } else if (clippingAncestor === 'document') {
            rect = getDocumentRect(getDocumentElement(element));
          } else if (isElement(clippingAncestor)) {
            rect = getInnerBoundingClientRect(clippingAncestor, strategy);
          } else {
            const visualOffsets = getVisualOffsets(element);
            rect = {
              x: clippingAncestor.x - visualOffsets.x,
              y: clippingAncestor.y - visualOffsets.y,
              width: clippingAncestor.width,
              height: clippingAncestor.height
            };
          }
          return rectToClientRect(rect);
        }
        function hasFixedPositionAncestor(element, stopNode) {
          const parentNode = getParentNode(element);
          if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
            return false;
          }
          return getComputedStyle$1(parentNode).position === 'fixed' || hasFixedPositionAncestor(parentNode, stopNode);
        }

        // A "clipping ancestor" is an `overflow` element with the characteristic of
        // clipping (or hiding) child elements. This returns all clipping ancestors
        // of the given element up the tree.
        function getClippingElementAncestors(element, cache) {
          const cachedResult = cache.get(element);
          if (cachedResult) {
            return cachedResult;
          }
          let result = getOverflowAncestors(element, [], false).filter(el => isElement(el) && getNodeName(el) !== 'body');
          let currentContainingBlockComputedStyle = null;
          const elementIsFixed = getComputedStyle$1(element).position === 'fixed';
          let currentNode = elementIsFixed ? getParentNode(element) : element;

          // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
          while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
            const computedStyle = getComputedStyle$1(currentNode);
            const currentNodeIsContaining = isContainingBlock(currentNode);
            if (!currentNodeIsContaining && computedStyle.position === 'fixed') {
              currentContainingBlockComputedStyle = null;
            }
            const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === 'static' && !!currentContainingBlockComputedStyle && absoluteOrFixed.has(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
            if (shouldDropCurrentNode) {
              // Drop non-containing blocks.
              result = result.filter(ancestor => ancestor !== currentNode);
            } else {
              // Record last containing block for next iteration.
              currentContainingBlockComputedStyle = computedStyle;
            }
            currentNode = getParentNode(currentNode);
          }
          cache.set(element, result);
          return result;
        }

        // Gets the maximum area that the element is visible in due to any number of
        // clipping ancestors.
        function getClippingRect(_ref) {
          let {
            element,
            boundary,
            rootBoundary,
            strategy
          } = _ref;
          const elementClippingAncestors = boundary === 'clippingAncestors' ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
          const clippingAncestors = [...elementClippingAncestors, rootBoundary];
          const firstClippingAncestor = clippingAncestors[0];
          const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
            const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
            accRect.top = max(rect.top, accRect.top);
            accRect.right = min(rect.right, accRect.right);
            accRect.bottom = min(rect.bottom, accRect.bottom);
            accRect.left = max(rect.left, accRect.left);
            return accRect;
          }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
          return {
            width: clippingRect.right - clippingRect.left,
            height: clippingRect.bottom - clippingRect.top,
            x: clippingRect.left,
            y: clippingRect.top
          };
        }
        function getDimensions(element) {
          const {
            width,
            height
          } = getCssDimensions(element);
          return {
            width,
            height
          };
        }
        function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
          const isOffsetParentAnElement = isHTMLElement(offsetParent);
          const documentElement = getDocumentElement(offsetParent);
          const isFixed = strategy === 'fixed';
          const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
          let scroll = {
            scrollLeft: 0,
            scrollTop: 0
          };
          const offsets = createCoords(0);

          // If the <body> scrollbar appears on the left (e.g. RTL systems). Use
          // Firefox with layout.scrollbar.side = 3 in about:config to test this.
          function setLeftRTLScrollbarOffset() {
            offsets.x = getWindowScrollBarX(documentElement);
          }
          if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
            if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
              scroll = getNodeScroll(offsetParent);
            }
            if (isOffsetParentAnElement) {
              const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
              offsets.x = offsetRect.x + offsetParent.clientLeft;
              offsets.y = offsetRect.y + offsetParent.clientTop;
            } else if (documentElement) {
              setLeftRTLScrollbarOffset();
            }
          }
          if (isFixed && !isOffsetParentAnElement && documentElement) {
            setLeftRTLScrollbarOffset();
          }
          const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
          const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
          const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
          return {
            x,
            y,
            width: rect.width,
            height: rect.height
          };
        }
        function isStaticPositioned(element) {
          return getComputedStyle$1(element).position === 'static';
        }
        function getTrueOffsetParent(element, polyfill) {
          if (!isHTMLElement(element) || getComputedStyle$1(element).position === 'fixed') {
            return null;
          }
          if (polyfill) {
            return polyfill(element);
          }
          let rawOffsetParent = element.offsetParent;

          // Firefox returns the <html> element as the offsetParent if it's non-static,
          // while Chrome and Safari return the <body> element. The <body> element must
          // be used to perform the correct calculations even if the <html> element is
          // non-static.
          if (getDocumentElement(element) === rawOffsetParent) {
            rawOffsetParent = rawOffsetParent.ownerDocument.body;
          }
          return rawOffsetParent;
        }

        // Gets the closest ancestor positioned element. Handles some edge cases,
        // such as table ancestors and cross browser bugs.
        function getOffsetParent(element, polyfill) {
          const win = getWindow(element);
          if (isTopLayer(element)) {
            return win;
          }
          if (!isHTMLElement(element)) {
            let svgOffsetParent = getParentNode(element);
            while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
              if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
                return svgOffsetParent;
              }
              svgOffsetParent = getParentNode(svgOffsetParent);
            }
            return win;
          }
          let offsetParent = getTrueOffsetParent(element, polyfill);
          while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
            offsetParent = getTrueOffsetParent(offsetParent, polyfill);
          }
          if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
            return win;
          }
          return offsetParent || getContainingBlock(element) || win;
        }
        const getElementRects = async function (data) {
          const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
          const getDimensionsFn = this.getDimensions;
          const floatingDimensions = await getDimensionsFn(data.floating);
          return {
            reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
            floating: {
              x: 0,
              y: 0,
              width: floatingDimensions.width,
              height: floatingDimensions.height
            }
          };
        };
        function isRTL(element) {
          return getComputedStyle$1(element).direction === 'rtl';
        }
        const platform = {
          convertOffsetParentRelativeRectToViewportRelativeRect,
          getDocumentElement,
          getClippingRect,
          getOffsetParent,
          getElementRects,
          getClientRects,
          getDimensions,
          getScale,
          isElement,
          isRTL
        };
        function rectsAreEqual(a, b) {
          return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
        }

        // https://samthor.au/2021/observing-dom/
        function observeMove(element, onMove) {
          let io = null;
          let timeoutId;
          const root = getDocumentElement(element);
          function cleanup() {
            var _io;
            clearTimeout(timeoutId);
            (_io = io) == null || _io.disconnect();
            io = null;
          }
          function refresh(skip, threshold) {
            if (skip === void 0) {
              skip = false;
            }
            if (threshold === void 0) {
              threshold = 1;
            }
            cleanup();
            const elementRectForRootMargin = element.getBoundingClientRect();
            const {
              left,
              top,
              width,
              height
            } = elementRectForRootMargin;
            if (!skip) {
              onMove();
            }
            if (!width || !height) {
              return;
            }
            const insetTop = floor(top);
            const insetRight = floor(root.clientWidth - (left + width));
            const insetBottom = floor(root.clientHeight - (top + height));
            const insetLeft = floor(left);
            const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
            const options = {
              rootMargin,
              threshold: max(0, min(1, threshold)) || 1
            };
            let isFirstUpdate = true;
            function handleObserve(entries) {
              const ratio = entries[0].intersectionRatio;
              if (ratio !== threshold) {
                if (!isFirstUpdate) {
                  return refresh();
                }
                if (!ratio) {
                  // If the reference is clipped, the ratio is 0. Throttle the refresh
                  // to prevent an infinite loop of updates.
                  timeoutId = setTimeout(() => {
                    refresh(false, 1e-7);
                  }, 1000);
                } else {
                  refresh(false, ratio);
                }
              }
              if (ratio === 1 && !rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) {
                // It's possible that even though the ratio is reported as 1, the
                // element is not actually fully within the IntersectionObserver's root
                // area anymore. This can happen under performance constraints. This may
                // be a bug in the browser's IntersectionObserver implementation. To
                // work around this, we compare the element's bounding rect now with
                // what it was at the time we created the IntersectionObserver. If they
                // are not equal then the element moved, so we refresh.
                refresh();
              }
              isFirstUpdate = false;
            }

            // Older browsers don't support a `document` as the root and will throw an
            // error.
            try {
              io = new IntersectionObserver(handleObserve, {
                ...options,
                // Handle <iframe>s
                root: root.ownerDocument
              });
            } catch (_e) {
              io = new IntersectionObserver(handleObserve, options);
            }
            io.observe(element);
          }
          refresh(true);
          return cleanup;
        }

        /**
         * Automatically updates the position of the floating element when necessary.
         * Should only be called when the floating element is mounted on the DOM or
         * visible on the screen.
         * @returns cleanup function that should be invoked when the floating element is
         * removed from the DOM or hidden from the screen.
         * @see https://floating-ui.com/docs/autoUpdate
         */
        function autoUpdate(reference, floating, update, options) {
          if (options === void 0) {
            options = {};
          }
          const {
            ancestorScroll = true,
            ancestorResize = true,
            elementResize = typeof ResizeObserver === 'function',
            layoutShift = typeof IntersectionObserver === 'function',
            animationFrame = false
          } = options;
          const referenceEl = unwrapElement(reference);
          const ancestors = ancestorScroll || ancestorResize ? [...(referenceEl ? getOverflowAncestors(referenceEl) : []), ...getOverflowAncestors(floating)] : [];
          ancestors.forEach(ancestor => {
            ancestorScroll && ancestor.addEventListener('scroll', update, {
              passive: true
            });
            ancestorResize && ancestor.addEventListener('resize', update);
          });
          const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
          let reobserveFrame = -1;
          let resizeObserver = null;
          if (elementResize) {
            resizeObserver = new ResizeObserver(_ref => {
              let [firstEntry] = _ref;
              if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
                // Prevent update loops when using the `size` middleware.
                // https://github.com/floating-ui/floating-ui/issues/1740
                resizeObserver.unobserve(floating);
                cancelAnimationFrame(reobserveFrame);
                reobserveFrame = requestAnimationFrame(() => {
                  var _resizeObserver;
                  (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
                });
              }
              update();
            });
            if (referenceEl && !animationFrame) {
              resizeObserver.observe(referenceEl);
            }
            resizeObserver.observe(floating);
          }
          let frameId;
          let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
          if (animationFrame) {
            frameLoop();
          }
          function frameLoop() {
            const nextRefRect = getBoundingClientRect(reference);
            if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) {
              update();
            }
            prevRefRect = nextRefRect;
            frameId = requestAnimationFrame(frameLoop);
          }
          update();
          return () => {
            var _resizeObserver2;
            ancestors.forEach(ancestor => {
              ancestorScroll && ancestor.removeEventListener('scroll', update);
              ancestorResize && ancestor.removeEventListener('resize', update);
            });
            cleanupIo == null || cleanupIo();
            (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
            resizeObserver = null;
            if (animationFrame) {
              cancelAnimationFrame(frameId);
            }
          };
        }

        /**
         * Modifies the placement by translating the floating element along the
         * specified axes.
         * A number (shorthand for `mainAxis` or distance), or an axes configuration
         * object may be passed.
         * @see https://floating-ui.com/docs/offset
         */
        const offset$1 = offset$2;

        /**
         * Optimizes the visibility of the floating element by shifting it in order to
         * keep it in view when it will overflow the clipping boundary.
         * @see https://floating-ui.com/docs/shift
         */
        const shift$1 = shift$2;

        /**
         * Optimizes the visibility of the floating element by flipping the `placement`
         * in order to keep it in view when the preferred placement(s) will overflow the
         * clipping boundary. Alternative to `autoPlacement`.
         * @see https://floating-ui.com/docs/flip
         */
        const flip$1 = flip$2;

        /**
         * Provides data that allows you to change the size of the floating element —
         * for instance, prevent it from overflowing the clipping boundary or match the
         * width of the reference element.
         * @see https://floating-ui.com/docs/size
         */
        const size$1 = size$2;

        /**
         * Provides data to hide the floating element in applicable situations, such as
         * when it is not in the same clipping context as the reference element.
         * @see https://floating-ui.com/docs/hide
         */
        const hide$1 = hide$2;

        /**
         * Provides data to position an inner element of the floating element so that it
         * appears centered to the reference element.
         * @see https://floating-ui.com/docs/arrow
         */
        const arrow$2 = arrow$3;

        /**
         * Built-in `limiter` that will stop `shift()` at a certain point.
         */
        const limitShift$1 = limitShift$2;

        /**
         * Computes the `x` and `y` coordinates that will place the floating element
         * next to a given reference element.
         */
        const computePosition = (reference, floating, options) => {
          // This caches the expensive `getClippingElementAncestors` function so that
          // multiple lifecycle resets re-use the same result. It only lives for a
          // single call. If other functions become expensive, we can add them as well.
          const cache = new Map();
          const mergedOptions = {
            platform,
            ...options
          };
          const platformWithCache = {
            ...mergedOptions.platform,
            _c: cache
          };
          return computePosition$1(reference, floating, {
            ...mergedOptions,
            platform: platformWithCache
          });
        };
        var isClient = typeof document !== 'undefined';
        var noop = function noop() {};
        var index = isClient ? reactExports.useLayoutEffect : noop;

        // Fork of `fast-deep-equal` that only does the comparisons we need and compares
        // functions
        function deepEqual(a, b) {
          if (a === b) {
            return true;
          }
          if (typeof a !== typeof b) {
            return false;
          }
          if (typeof a === 'function' && a.toString() === b.toString()) {
            return true;
          }
          let length;
          let i;
          let keys;
          if (a && b && typeof a === 'object') {
            if (Array.isArray(a)) {
              length = a.length;
              if (length !== b.length) return false;
              for (i = length; i-- !== 0;) {
                if (!deepEqual(a[i], b[i])) {
                  return false;
                }
              }
              return true;
            }
            keys = Object.keys(a);
            length = keys.length;
            if (length !== Object.keys(b).length) {
              return false;
            }
            for (i = length; i-- !== 0;) {
              if (!{}.hasOwnProperty.call(b, keys[i])) {
                return false;
              }
            }
            for (i = length; i-- !== 0;) {
              const key = keys[i];
              if (key === '_owner' && a.$$typeof) {
                continue;
              }
              if (!deepEqual(a[key], b[key])) {
                return false;
              }
            }
            return true;
          }
          return a !== a && b !== b;
        }
        function getDPR(element) {
          if (typeof window === 'undefined') {
            return 1;
          }
          const win = element.ownerDocument.defaultView || window;
          return win.devicePixelRatio || 1;
        }
        function roundByDPR(element, value) {
          const dpr = getDPR(element);
          return Math.round(value * dpr) / dpr;
        }
        function useLatestRef(value) {
          const ref = reactExports.useRef(value);
          index(() => {
            ref.current = value;
          });
          return ref;
        }

        /**
         * Provides data to position a floating element.
         * @see https://floating-ui.com/docs/useFloating
         */
        function useFloating(options) {
          if (options === void 0) {
            options = {};
          }
          const {
            placement = 'bottom',
            strategy = 'absolute',
            middleware = [],
            platform,
            elements: {
              reference: externalReference,
              floating: externalFloating
            } = {},
            transform = true,
            whileElementsMounted,
            open
          } = options;
          const [data, setData] = reactExports.useState({
            x: 0,
            y: 0,
            strategy,
            placement,
            middlewareData: {},
            isPositioned: false
          });
          const [latestMiddleware, setLatestMiddleware] = reactExports.useState(middleware);
          if (!deepEqual(latestMiddleware, middleware)) {
            setLatestMiddleware(middleware);
          }
          const [_reference, _setReference] = reactExports.useState(null);
          const [_floating, _setFloating] = reactExports.useState(null);
          const setReference = reactExports.useCallback(node => {
            if (node !== referenceRef.current) {
              referenceRef.current = node;
              _setReference(node);
            }
          }, []);
          const setFloating = reactExports.useCallback(node => {
            if (node !== floatingRef.current) {
              floatingRef.current = node;
              _setFloating(node);
            }
          }, []);
          const referenceEl = externalReference || _reference;
          const floatingEl = externalFloating || _floating;
          const referenceRef = reactExports.useRef(null);
          const floatingRef = reactExports.useRef(null);
          const dataRef = reactExports.useRef(data);
          const hasWhileElementsMounted = whileElementsMounted != null;
          const whileElementsMountedRef = useLatestRef(whileElementsMounted);
          const platformRef = useLatestRef(platform);
          const openRef = useLatestRef(open);
          const update = reactExports.useCallback(() => {
            if (!referenceRef.current || !floatingRef.current) {
              return;
            }
            const config = {
              placement,
              strategy,
              middleware: latestMiddleware
            };
            if (platformRef.current) {
              config.platform = platformRef.current;
            }
            computePosition(referenceRef.current, floatingRef.current, config).then(data => {
              const fullData = {
                ...data,
                // The floating element's position may be recomputed while it's closed
                // but still mounted (such as when transitioning out). To ensure
                // `isPositioned` will be `false` initially on the next open, avoid
                // setting it to `true` when `open === false` (must be specified).
                isPositioned: openRef.current !== false
              };
              if (isMountedRef.current && !deepEqual(dataRef.current, fullData)) {
                dataRef.current = fullData;
                reactDomExports.flushSync(() => {
                  setData(fullData);
                });
              }
            });
          }, [latestMiddleware, placement, strategy, platformRef, openRef]);
          index(() => {
            if (open === false && dataRef.current.isPositioned) {
              dataRef.current.isPositioned = false;
              setData(data => ({
                ...data,
                isPositioned: false
              }));
            }
          }, [open]);
          const isMountedRef = reactExports.useRef(false);
          index(() => {
            isMountedRef.current = true;
            return () => {
              isMountedRef.current = false;
            };
          }, []);
          index(() => {
            if (referenceEl) referenceRef.current = referenceEl;
            if (floatingEl) floatingRef.current = floatingEl;
            if (referenceEl && floatingEl) {
              if (whileElementsMountedRef.current) {
                return whileElementsMountedRef.current(referenceEl, floatingEl, update);
              }
              update();
            }
          }, [referenceEl, floatingEl, update, whileElementsMountedRef, hasWhileElementsMounted]);
          const refs = reactExports.useMemo(() => ({
            reference: referenceRef,
            floating: floatingRef,
            setReference,
            setFloating
          }), [setReference, setFloating]);
          const elements = reactExports.useMemo(() => ({
            reference: referenceEl,
            floating: floatingEl
          }), [referenceEl, floatingEl]);
          const floatingStyles = reactExports.useMemo(() => {
            const initialStyles = {
              position: strategy,
              left: 0,
              top: 0
            };
            if (!elements.floating) {
              return initialStyles;
            }
            const x = roundByDPR(elements.floating, data.x);
            const y = roundByDPR(elements.floating, data.y);
            if (transform) {
              return {
                ...initialStyles,
                transform: "translate(" + x + "px, " + y + "px)",
                ...(getDPR(elements.floating) >= 1.5 && {
                  willChange: 'transform'
                })
              };
            }
            return {
              position: strategy,
              left: x,
              top: y
            };
          }, [strategy, transform, elements.floating, data.x, data.y]);
          return reactExports.useMemo(() => ({
            ...data,
            update,
            refs,
            elements,
            floatingStyles
          }), [data, update, refs, elements, floatingStyles]);
        }

        /**
         * Provides data to position an inner element of the floating element so that it
         * appears centered to the reference element.
         * This wraps the core `arrow` middleware to allow React refs as the element.
         * @see https://floating-ui.com/docs/arrow
         */
        const arrow$1 = options => {
          function isRef(value) {
            return {}.hasOwnProperty.call(value, 'current');
          }
          return {
            name: 'arrow',
            options,
            fn(state) {
              const {
                element,
                padding
              } = typeof options === 'function' ? options(state) : options;
              if (element && isRef(element)) {
                if (element.current != null) {
                  return arrow$2({
                    element: element.current,
                    padding
                  }).fn(state);
                }
                return {};
              }
              if (element) {
                return arrow$2({
                  element,
                  padding
                }).fn(state);
              }
              return {};
            }
          };
        };

        /**
         * Modifies the placement by translating the floating element along the
         * specified axes.
         * A number (shorthand for `mainAxis` or distance), or an axes configuration
         * object may be passed.
         * @see https://floating-ui.com/docs/offset
         */
        const offset = (options, deps) => ({
          ...offset$1(options),
          options: [options, deps]
        });

        /**
         * Optimizes the visibility of the floating element by shifting it in order to
         * keep it in view when it will overflow the clipping boundary.
         * @see https://floating-ui.com/docs/shift
         */
        const shift = (options, deps) => ({
          ...shift$1(options),
          options: [options, deps]
        });

        /**
         * Built-in `limiter` that will stop `shift()` at a certain point.
         */
        const limitShift = (options, deps) => ({
          ...limitShift$1(options),
          options: [options, deps]
        });

        /**
         * Optimizes the visibility of the floating element by flipping the `placement`
         * in order to keep it in view when the preferred placement(s) will overflow the
         * clipping boundary. Alternative to `autoPlacement`.
         * @see https://floating-ui.com/docs/flip
         */
        const flip = (options, deps) => ({
          ...flip$1(options),
          options: [options, deps]
        });

        /**
         * Provides data that allows you to change the size of the floating element —
         * for instance, prevent it from overflowing the clipping boundary or match the
         * width of the reference element.
         * @see https://floating-ui.com/docs/size
         */
        const size = (options, deps) => ({
          ...size$1(options),
          options: [options, deps]
        });

        /**
         * Provides data to hide the floating element in applicable situations, such as
         * when it is not in the same clipping context as the reference element.
         * @see https://floating-ui.com/docs/hide
         */
        const hide = (options, deps) => ({
          ...hide$1(options),
          options: [options, deps]
        });

        /**
         * Provides data to position an inner element of the floating element so that it
         * appears centered to the reference element.
         * This wraps the core `arrow` middleware to allow React refs as the element.
         * @see https://floating-ui.com/docs/arrow
         */
        const arrow = (options, deps) => ({
          ...arrow$1(options),
          options: [options, deps]
        });

        // src/arrow.tsx
        var NAME$3 = "Arrow";
        var Arrow$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            children,
            width = 10,
            height = 5,
            ...arrowProps
          } = props;
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.svg, {
            ...arrowProps,
            ref: forwardedRef,
            width,
            height,
            viewBox: "0 0 30 10",
            preserveAspectRatio: "none",
            children: props.asChild ? children : /* @__PURE__ */jsxRuntimeExports.jsx("polygon", {
              points: "0,0 30,0 15,10"
            })
          });
        });
        Arrow$1.displayName = NAME$3;
        var Root$6 = Arrow$1;

        // packages/react/use-size/src/use-size.tsx
        function useSize(element) {
          const [size, setSize] = reactExports.useState(void 0);
          useLayoutEffect2(() => {
            if (element) {
              setSize({
                width: element.offsetWidth,
                height: element.offsetHeight
              });
              const resizeObserver = new ResizeObserver(entries => {
                if (!Array.isArray(entries)) {
                  return;
                }
                if (!entries.length) {
                  return;
                }
                const entry = entries[0];
                let width;
                let height;
                if ("borderBoxSize" in entry) {
                  const borderSizeEntry = entry["borderBoxSize"];
                  const borderSize = Array.isArray(borderSizeEntry) ? borderSizeEntry[0] : borderSizeEntry;
                  width = borderSize["inlineSize"];
                  height = borderSize["blockSize"];
                } else {
                  width = element.offsetWidth;
                  height = element.offsetHeight;
                }
                setSize({
                  width,
                  height
                });
              });
              resizeObserver.observe(element, {
                box: "border-box"
              });
              return () => resizeObserver.unobserve(element);
            } else {
              setSize(void 0);
            }
          }, [element]);
          return size;
        }
        var POPPER_NAME = "Popper";
        var [createPopperContext, createPopperScope] = createContextScope$1(POPPER_NAME);
        var [PopperProvider, usePopperContext] = createPopperContext(POPPER_NAME);
        var Popper = props => {
          const {
            __scopePopper,
            children
          } = props;
          const [anchor, setAnchor] = reactExports.useState(null);
          return /* @__PURE__ */jsxRuntimeExports.jsx(PopperProvider, {
            scope: __scopePopper,
            anchor,
            onAnchorChange: setAnchor,
            children
          });
        };
        Popper.displayName = POPPER_NAME;
        var ANCHOR_NAME$2 = "PopperAnchor";
        var PopperAnchor = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopePopper,
            virtualRef,
            ...anchorProps
          } = props;
          const context = usePopperContext(ANCHOR_NAME$2, __scopePopper);
          const ref = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, ref);
          const anchorRef = reactExports.useRef(null);
          reactExports.useEffect(() => {
            const previousAnchor = anchorRef.current;
            anchorRef.current = virtualRef?.current || ref.current;
            if (previousAnchor !== anchorRef.current) {
              context.onAnchorChange(anchorRef.current);
            }
          });
          return virtualRef ? null : /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            ...anchorProps,
            ref: composedRefs
          });
        });
        PopperAnchor.displayName = ANCHOR_NAME$2;
        var CONTENT_NAME$6 = "PopperContent";
        var [PopperContentProvider, useContentContext] = createPopperContext(CONTENT_NAME$6);
        var PopperContent = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopePopper,
            side = "bottom",
            sideOffset = 0,
            align = "center",
            alignOffset = 0,
            arrowPadding = 0,
            avoidCollisions = true,
            collisionBoundary = [],
            collisionPadding: collisionPaddingProp = 0,
            sticky = "partial",
            hideWhenDetached = false,
            updatePositionStrategy = "optimized",
            onPlaced,
            ...contentProps
          } = props;
          const context = usePopperContext(CONTENT_NAME$6, __scopePopper);
          const [content, setContent] = reactExports.useState(null);
          const composedRefs = useComposedRefs(forwardedRef, node => setContent(node));
          const [arrow$1, setArrow] = reactExports.useState(null);
          const arrowSize = useSize(arrow$1);
          const arrowWidth = arrowSize?.width ?? 0;
          const arrowHeight = arrowSize?.height ?? 0;
          const desiredPlacement = side + (align !== "center" ? "-" + align : "");
          const collisionPadding = typeof collisionPaddingProp === "number" ? collisionPaddingProp : {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            ...collisionPaddingProp
          };
          const boundary = Array.isArray(collisionBoundary) ? collisionBoundary : [collisionBoundary];
          const hasExplicitBoundaries = boundary.length > 0;
          const detectOverflowOptions = {
            padding: collisionPadding,
            boundary: boundary.filter(isNotNull),
            // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
            altBoundary: hasExplicitBoundaries
          };
          const {
            refs,
            floatingStyles,
            placement,
            isPositioned,
            middlewareData
          } = useFloating({
            // default to `fixed` strategy so users don't have to pick and we also avoid focus scroll issues
            strategy: "fixed",
            placement: desiredPlacement,
            whileElementsMounted: (...args) => {
              const cleanup = autoUpdate(...args, {
                animationFrame: updatePositionStrategy === "always"
              });
              return cleanup;
            },
            elements: {
              reference: context.anchor
            },
            middleware: [offset({
              mainAxis: sideOffset + arrowHeight,
              alignmentAxis: alignOffset
            }), avoidCollisions && shift({
              mainAxis: true,
              crossAxis: false,
              limiter: sticky === "partial" ? limitShift() : void 0,
              ...detectOverflowOptions
            }), avoidCollisions && flip({
              ...detectOverflowOptions
            }), size({
              ...detectOverflowOptions,
              apply: ({
                elements,
                rects,
                availableWidth,
                availableHeight
              }) => {
                const {
                  width: anchorWidth,
                  height: anchorHeight
                } = rects.reference;
                const contentStyle = elements.floating.style;
                contentStyle.setProperty("--radix-popper-available-width", `${availableWidth}px`);
                contentStyle.setProperty("--radix-popper-available-height", `${availableHeight}px`);
                contentStyle.setProperty("--radix-popper-anchor-width", `${anchorWidth}px`);
                contentStyle.setProperty("--radix-popper-anchor-height", `${anchorHeight}px`);
              }
            }), arrow$1 && arrow({
              element: arrow$1,
              padding: arrowPadding
            }), transformOrigin({
              arrowWidth,
              arrowHeight
            }), hideWhenDetached && hide({
              strategy: "referenceHidden",
              ...detectOverflowOptions
            })]
          });
          const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement);
          const handlePlaced = useCallbackRef$1(onPlaced);
          useLayoutEffect2(() => {
            if (isPositioned) {
              handlePlaced?.();
            }
          }, [isPositioned, handlePlaced]);
          const arrowX = middlewareData.arrow?.x;
          const arrowY = middlewareData.arrow?.y;
          const cannotCenterArrow = middlewareData.arrow?.centerOffset !== 0;
          const [contentZIndex, setContentZIndex] = reactExports.useState();
          useLayoutEffect2(() => {
            if (content) setContentZIndex(window.getComputedStyle(content).zIndex);
          }, [content]);
          return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
            ref: refs.setFloating,
            "data-radix-popper-content-wrapper": "",
            style: {
              ...floatingStyles,
              transform: isPositioned ? floatingStyles.transform : "translate(0, -200%)",
              // keep off the page when measuring
              minWidth: "max-content",
              zIndex: contentZIndex,
              ["--radix-popper-transform-origin"]: [middlewareData.transformOrigin?.x, middlewareData.transformOrigin?.y].join(" "),
              // hide the content if using the hide middleware and should be hidden
              // set visibility to hidden and disable pointer events so the UI behaves
              // as if the PopperContent isn't there at all
              ...(middlewareData.hide?.referenceHidden && {
                visibility: "hidden",
                pointerEvents: "none"
              })
            },
            dir: props.dir,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(PopperContentProvider, {
              scope: __scopePopper,
              placedSide,
              onArrowChange: setArrow,
              arrowX,
              arrowY,
              shouldHideArrow: cannotCenterArrow,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
                "data-side": placedSide,
                "data-align": placedAlign,
                ...contentProps,
                ref: composedRefs,
                style: {
                  ...contentProps.style,
                  // if the PopperContent hasn't been placed yet (not all measurements done)
                  // we prevent animations so that users's animation don't kick in too early referring wrong sides
                  animation: !isPositioned ? "none" : void 0
                }
              })
            })
          });
        });
        PopperContent.displayName = CONTENT_NAME$6;
        var ARROW_NAME$4 = "PopperArrow";
        var OPPOSITE_SIDE = {
          top: "bottom",
          right: "left",
          bottom: "top",
          left: "right"
        };
        var PopperArrow = reactExports.forwardRef(function PopperArrow2(props, forwardedRef) {
          const {
            __scopePopper,
            ...arrowProps
          } = props;
          const contentContext = useContentContext(ARROW_NAME$4, __scopePopper);
          const baseSide = OPPOSITE_SIDE[contentContext.placedSide];
          return (
            // we have to use an extra wrapper because `ResizeObserver` (used by `useSize`)
            // doesn't report size as we'd expect on SVG elements.
            // it reports their bounding box which is effectively the largest path inside the SVG.
            /* @__PURE__ */
            jsxRuntimeExports.jsx("span", {
              ref: contentContext.onArrowChange,
              style: {
                position: "absolute",
                left: contentContext.arrowX,
                top: contentContext.arrowY,
                [baseSide]: 0,
                transformOrigin: {
                  top: "",
                  right: "0 0",
                  bottom: "center 0",
                  left: "100% 0"
                }[contentContext.placedSide],
                transform: {
                  top: "translateY(100%)",
                  right: "translateY(50%) rotate(90deg) translateX(-50%)",
                  bottom: `rotate(180deg)`,
                  left: "translateY(50%) rotate(-90deg) translateX(50%)"
                }[contentContext.placedSide],
                visibility: contentContext.shouldHideArrow ? "hidden" : void 0
              },
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Root$6, {
                ...arrowProps,
                ref: forwardedRef,
                style: {
                  ...arrowProps.style,
                  // ensures the element can be measured correctly (mostly for if SVG)
                  display: "block"
                }
              })
            })
          );
        });
        PopperArrow.displayName = ARROW_NAME$4;
        function isNotNull(value) {
          return value !== null;
        }
        var transformOrigin = options => ({
          name: "transformOrigin",
          options,
          fn(data) {
            const {
              placement,
              rects,
              middlewareData
            } = data;
            const cannotCenterArrow = middlewareData.arrow?.centerOffset !== 0;
            const isArrowHidden = cannotCenterArrow;
            const arrowWidth = isArrowHidden ? 0 : options.arrowWidth;
            const arrowHeight = isArrowHidden ? 0 : options.arrowHeight;
            const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement);
            const noArrowAlign = {
              start: "0%",
              center: "50%",
              end: "100%"
            }[placedAlign];
            const arrowXCenter = (middlewareData.arrow?.x ?? 0) + arrowWidth / 2;
            const arrowYCenter = (middlewareData.arrow?.y ?? 0) + arrowHeight / 2;
            let x = "";
            let y = "";
            if (placedSide === "bottom") {
              x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
              y = `${-arrowHeight}px`;
            } else if (placedSide === "top") {
              x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
              y = `${rects.floating.height + arrowHeight}px`;
            } else if (placedSide === "right") {
              x = `${-arrowHeight}px`;
              y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
            } else if (placedSide === "left") {
              x = `${rects.floating.width + arrowHeight}px`;
              y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
            }
            return {
              data: {
                x,
                y
              }
            };
          }
        });
        function getSideAndAlignFromPlacement(placement) {
          const [side, align = "center"] = placement.split("-");
          return [side, align];
        }
        var Root2$4 = Popper;
        var Anchor = PopperAnchor;
        var Content$2 = PopperContent;
        var Arrow = PopperArrow;
        var PORTAL_NAME$5 = "Portal";
        var Portal$4 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            container: containerProp,
            ...portalProps
          } = props;
          const [mounted, setMounted] = reactExports.useState(false);
          useLayoutEffect2(() => setMounted(true), []);
          const container = containerProp || mounted && globalThis?.document?.body;
          return container ? ReactDOM.createPortal(/* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            ...portalProps,
            ref: forwardedRef
          }), container) : null;
        });
        Portal$4.displayName = PORTAL_NAME$5;

        // src/slot.tsx
        // @__NO_SIDE_EFFECTS__
        function createSlot$3(ownerName) {
          const SlotClone = /* @__PURE__ */createSlotClone$3(ownerName);
          const Slot2 = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            const childrenArray = reactExports.Children.toArray(children);
            const slottable = childrenArray.find(isSlottable$3);
            if (slottable) {
              const newElement = slottable.props.children;
              const newChildren = childrenArray.map(child => {
                if (child === slottable) {
                  if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
                  return reactExports.isValidElement(newElement) ? newElement.props.children : null;
                } else {
                  return child;
                }
              });
              return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
                ...slotProps,
                ref: forwardedRef,
                children: reactExports.isValidElement(newElement) ? reactExports.cloneElement(newElement, void 0, newChildren) : null
              });
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
              ...slotProps,
              ref: forwardedRef,
              children
            });
          });
          Slot2.displayName = `${ownerName}.Slot`;
          return Slot2;
        }
        // @__NO_SIDE_EFFECTS__
        function createSlotClone$3(ownerName) {
          const SlotClone = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            if (reactExports.isValidElement(children)) {
              const childrenRef = getElementRef$4(children);
              const props2 = mergeProps$3(slotProps, children.props);
              if (children.type !== reactExports.Fragment) {
                props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
              }
              return reactExports.cloneElement(children, props2);
            }
            return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
          });
          SlotClone.displayName = `${ownerName}.SlotClone`;
          return SlotClone;
        }
        var SLOTTABLE_IDENTIFIER$3 = Symbol("radix.slottable");
        function isSlottable$3(child) {
          return reactExports.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER$3;
        }
        function mergeProps$3(slotProps, childProps) {
          const overrideProps = {
            ...childProps
          };
          for (const propName in childProps) {
            const slotPropValue = slotProps[propName];
            const childPropValue = childProps[propName];
            const isHandler = /^on[A-Z]/.test(propName);
            if (isHandler) {
              if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args) => {
                  const result = childPropValue(...args);
                  slotPropValue(...args);
                  return result;
                };
              } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
              }
            } else if (propName === "style") {
              overrideProps[propName] = {
                ...slotPropValue,
                ...childPropValue
              };
            } else if (propName === "className") {
              overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
            }
          }
          return {
            ...slotProps,
            ...overrideProps
          };
        }
        function getElementRef$4(element) {
          let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
          let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.ref;
          }
          getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
          mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.props.ref;
          }
          return element.props.ref || element.ref;
        }

        // src/use-controllable-state.tsx
        var useInsertionEffect = React$1[" useInsertionEffect ".trim().toString()] || useLayoutEffect2;
        function useControllableState({
          prop,
          defaultProp,
          onChange = () => {},
          caller
        }) {
          const [uncontrolledProp, setUncontrolledProp, onChangeRef] = useUncontrolledState({
            defaultProp,
            onChange
          });
          const isControlled = prop !== void 0;
          const value = isControlled ? prop : uncontrolledProp;
          {
            const isControlledRef = reactExports.useRef(prop !== void 0);
            reactExports.useEffect(() => {
              const wasControlled = isControlledRef.current;
              if (wasControlled !== isControlled) {
                const from = wasControlled ? "controlled" : "uncontrolled";
                const to = isControlled ? "controlled" : "uncontrolled";
                console.warn(`${caller} is changing from ${from} to ${to}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`);
              }
              isControlledRef.current = isControlled;
            }, [isControlled, caller]);
          }
          const setValue = reactExports.useCallback(nextValue => {
            if (isControlled) {
              const value2 = isFunction$1(nextValue) ? nextValue(prop) : nextValue;
              if (value2 !== prop) {
                onChangeRef.current?.(value2);
              }
            } else {
              setUncontrolledProp(nextValue);
            }
          }, [isControlled, prop, setUncontrolledProp, onChangeRef]);
          return [value, setValue];
        }
        function useUncontrolledState({
          defaultProp,
          onChange
        }) {
          const [value, setValue] = reactExports.useState(defaultProp);
          const prevValueRef = reactExports.useRef(value);
          const onChangeRef = reactExports.useRef(onChange);
          useInsertionEffect(() => {
            onChangeRef.current = onChange;
          }, [onChange]);
          reactExports.useEffect(() => {
            if (prevValueRef.current !== value) {
              onChangeRef.current?.(value);
              prevValueRef.current = value;
            }
          }, [value, prevValueRef]);
          return [value, setValue, onChangeRef];
        }
        function isFunction$1(value) {
          return typeof value === "function";
        }

        // packages/react/use-previous/src/use-previous.tsx
        function usePrevious(value) {
          const ref = reactExports.useRef({
            value,
            previous: value
          });
          return reactExports.useMemo(() => {
            if (ref.current.value !== value) {
              ref.current.previous = ref.current.value;
              ref.current.value = value;
            }
            return ref.current.previous;
          }, [value]);
        }

        // src/visually-hidden.tsx
        var VISUALLY_HIDDEN_STYLES = Object.freeze({
          // See: https://github.com/twbs/bootstrap/blob/main/scss/mixins/_visually-hidden.scss
          position: "absolute",
          border: 0,
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          wordWrap: "normal"
        });
        var NAME$2 = "VisuallyHidden";
        var VisuallyHidden = reactExports.forwardRef((props, forwardedRef) => {
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.span, {
            ...props,
            ref: forwardedRef,
            style: {
              ...VISUALLY_HIDDEN_STYLES,
              ...props.style
            }
          });
        });
        VisuallyHidden.displayName = NAME$2;
        var getDefaultParent = function (originalTarget) {
          if (typeof document === 'undefined') {
            return null;
          }
          var sampleTarget = Array.isArray(originalTarget) ? originalTarget[0] : originalTarget;
          return sampleTarget.ownerDocument.body;
        };
        var counterMap = new WeakMap();
        var uncontrolledNodes = new WeakMap();
        var markerMap = {};
        var lockCount = 0;
        var unwrapHost = function (node) {
          return node && (node.host || unwrapHost(node.parentNode));
        };
        var correctTargets = function (parent, targets) {
          return targets.map(function (target) {
            if (parent.contains(target)) {
              return target;
            }
            var correctedTarget = unwrapHost(target);
            if (correctedTarget && parent.contains(correctedTarget)) {
              return correctedTarget;
            }
            console.error('aria-hidden', target, 'in not contained inside', parent, '. Doing nothing');
            return null;
          }).filter(function (x) {
            return Boolean(x);
          });
        };
        /**
         * Marks everything except given node(or nodes) as aria-hidden
         * @param {Element | Element[]} originalTarget - elements to keep on the page
         * @param [parentNode] - top element, defaults to document.body
         * @param {String} [markerName] - a special attribute to mark every node
         * @param {String} [controlAttribute] - html Attribute to control
         * @return {Undo} undo command
         */
        var applyAttributeToOthers = function (originalTarget, parentNode, markerName, controlAttribute) {
          var targets = correctTargets(parentNode, Array.isArray(originalTarget) ? originalTarget : [originalTarget]);
          if (!markerMap[markerName]) {
            markerMap[markerName] = new WeakMap();
          }
          var markerCounter = markerMap[markerName];
          var hiddenNodes = [];
          var elementsToKeep = new Set();
          var elementsToStop = new Set(targets);
          var keep = function (el) {
            if (!el || elementsToKeep.has(el)) {
              return;
            }
            elementsToKeep.add(el);
            keep(el.parentNode);
          };
          targets.forEach(keep);
          var deep = function (parent) {
            if (!parent || elementsToStop.has(parent)) {
              return;
            }
            Array.prototype.forEach.call(parent.children, function (node) {
              if (elementsToKeep.has(node)) {
                deep(node);
              } else {
                try {
                  var attr = node.getAttribute(controlAttribute);
                  var alreadyHidden = attr !== null && attr !== 'false';
                  var counterValue = (counterMap.get(node) || 0) + 1;
                  var markerValue = (markerCounter.get(node) || 0) + 1;
                  counterMap.set(node, counterValue);
                  markerCounter.set(node, markerValue);
                  hiddenNodes.push(node);
                  if (counterValue === 1 && alreadyHidden) {
                    uncontrolledNodes.set(node, true);
                  }
                  if (markerValue === 1) {
                    node.setAttribute(markerName, 'true');
                  }
                  if (!alreadyHidden) {
                    node.setAttribute(controlAttribute, 'true');
                  }
                } catch (e) {
                  console.error('aria-hidden: cannot operate on ', node, e);
                }
              }
            });
          };
          deep(parentNode);
          elementsToKeep.clear();
          lockCount++;
          return function () {
            hiddenNodes.forEach(function (node) {
              var counterValue = counterMap.get(node) - 1;
              var markerValue = markerCounter.get(node) - 1;
              counterMap.set(node, counterValue);
              markerCounter.set(node, markerValue);
              if (!counterValue) {
                if (!uncontrolledNodes.has(node)) {
                  node.removeAttribute(controlAttribute);
                }
                uncontrolledNodes.delete(node);
              }
              if (!markerValue) {
                node.removeAttribute(markerName);
              }
            });
            lockCount--;
            if (!lockCount) {
              // clear
              counterMap = new WeakMap();
              counterMap = new WeakMap();
              uncontrolledNodes = new WeakMap();
              markerMap = {};
            }
          };
        };
        /**
         * Marks everything except given node(or nodes) as aria-hidden
         * @param {Element | Element[]} originalTarget - elements to keep on the page
         * @param [parentNode] - top element, defaults to document.body
         * @param {String} [markerName] - a special attribute to mark every node
         * @return {Undo} undo command
         */
        var hideOthers = function (originalTarget, parentNode, markerName) {
          if (markerName === void 0) {
            markerName = 'data-aria-hidden';
          }
          var targets = Array.from(Array.isArray(originalTarget) ? originalTarget : [originalTarget]);
          var activeParentNode = getDefaultParent(originalTarget);
          if (!activeParentNode) {
            return function () {
              return null;
            };
          }
          // we should not hide aria-live elements - https://github.com/theKashey/aria-hidden/issues/10
          // and script elements, as they have no impact on accessibility.
          targets.push.apply(targets, Array.from(activeParentNode.querySelectorAll('[aria-live], script')));
          return applyAttributeToOthers(targets, activeParentNode, markerName, 'aria-hidden');
        };
        var zeroRightClassName = 'right-scroll-bar-position';
        var fullWidthClassName = 'width-before-scroll-bar';
        var noScrollbarsClassName = 'with-scroll-bars-hidden';
        /**
         * Name of a CSS variable containing the amount of "hidden" scrollbar
         * ! might be undefined ! use will fallback!
         */
        var removedBarSizeVariable = '--removed-body-scroll-bar-size';

        /**
         * Assigns a value for a given ref, no matter of the ref format
         * @param {RefObject} ref - a callback function or ref object
         * @param value - a new value
         *
         * @see https://github.com/theKashey/use-callback-ref#assignref
         * @example
         * const refObject = useRef();
         * const refFn = (ref) => {....}
         *
         * assignRef(refObject, "refValue");
         * assignRef(refFn, "refValue");
         */
        function assignRef(ref, value) {
          if (typeof ref === 'function') {
            ref(value);
          } else if (ref) {
            ref.current = value;
          }
          return ref;
        }

        /**
         * creates a MutableRef with ref change callback
         * @param initialValue - initial ref value
         * @param {Function} callback - a callback to run when value changes
         *
         * @example
         * const ref = useCallbackRef(0, (newValue, oldValue) => console.log(oldValue, '->', newValue);
         * ref.current = 1;
         * // prints 0 -> 1
         *
         * @see https://reactjs.org/docs/hooks-reference.html#useref
         * @see https://github.com/theKashey/use-callback-ref#usecallbackref---to-replace-reactuseref
         * @returns {MutableRefObject}
         */
        function useCallbackRef(initialValue, callback) {
          var ref = reactExports.useState(function () {
            return {
              // value
              value: initialValue,
              // last callback
              callback: callback,
              // "memoized" public interface
              facade: {
                get current() {
                  return ref.value;
                },
                set current(value) {
                  var last = ref.value;
                  if (last !== value) {
                    ref.value = value;
                    ref.callback(value, last);
                  }
                }
              }
            };
          })[0];
          // update callback
          ref.callback = callback;
          return ref.facade;
        }
        var useIsomorphicLayoutEffect = typeof window !== 'undefined' ? reactExports.useLayoutEffect : reactExports.useEffect;
        var currentValues = new WeakMap();
        /**
         * Merges two or more refs together providing a single interface to set their value
         * @param {RefObject|Ref} refs
         * @returns {MutableRefObject} - a new ref, which translates all changes to {refs}
         *
         * @see {@link mergeRefs} a version without buit-in memoization
         * @see https://github.com/theKashey/use-callback-ref#usemergerefs
         * @example
         * const Component = React.forwardRef((props, ref) => {
         *   const ownRef = useRef();
         *   const domRef = useMergeRefs([ref, ownRef]); // 👈 merge together
         *   return <div ref={domRef}>...</div>
         * }
         */
        function useMergeRefs(refs, defaultValue) {
          var callbackRef = useCallbackRef(null, function (newValue) {
            return refs.forEach(function (ref) {
              return assignRef(ref, newValue);
            });
          });
          // handle refs changes - added or removed
          useIsomorphicLayoutEffect(function () {
            var oldValue = currentValues.get(callbackRef);
            if (oldValue) {
              var prevRefs_1 = new Set(oldValue);
              var nextRefs_1 = new Set(refs);
              var current_1 = callbackRef.current;
              prevRefs_1.forEach(function (ref) {
                if (!nextRefs_1.has(ref)) {
                  assignRef(ref, null);
                }
              });
              nextRefs_1.forEach(function (ref) {
                if (!prevRefs_1.has(ref)) {
                  assignRef(ref, current_1);
                }
              });
            }
            currentValues.set(callbackRef, refs);
          }, [refs]);
          return callbackRef;
        }
        function ItoI(a) {
          return a;
        }
        function innerCreateMedium(defaults, middleware) {
          if (middleware === void 0) {
            middleware = ItoI;
          }
          var buffer = [];
          var assigned = false;
          var medium = {
            read: function () {
              if (assigned) {
                throw new Error('Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.');
              }
              if (buffer.length) {
                return buffer[buffer.length - 1];
              }
              return defaults;
            },
            useMedium: function (data) {
              var item = middleware(data, assigned);
              buffer.push(item);
              return function () {
                buffer = buffer.filter(function (x) {
                  return x !== item;
                });
              };
            },
            assignSyncMedium: function (cb) {
              assigned = true;
              while (buffer.length) {
                var cbs = buffer;
                buffer = [];
                cbs.forEach(cb);
              }
              buffer = {
                push: function (x) {
                  return cb(x);
                },
                filter: function () {
                  return buffer;
                }
              };
            },
            assignMedium: function (cb) {
              assigned = true;
              var pendingQueue = [];
              if (buffer.length) {
                var cbs = buffer;
                buffer = [];
                cbs.forEach(cb);
                pendingQueue = buffer;
              }
              var executeQueue = function () {
                var cbs = pendingQueue;
                pendingQueue = [];
                cbs.forEach(cb);
              };
              var cycle = function () {
                return Promise.resolve().then(executeQueue);
              };
              cycle();
              buffer = {
                push: function (x) {
                  pendingQueue.push(x);
                  cycle();
                },
                filter: function (filter) {
                  pendingQueue = pendingQueue.filter(filter);
                  return buffer;
                }
              };
            }
          };
          return medium;
        }
        // eslint-disable-next-line @typescript-eslint/ban-types
        function createSidecarMedium(options) {
          if (options === void 0) {
            options = {};
          }
          var medium = innerCreateMedium(null);
          medium.options = __assign({
            async: true,
            ssr: false
          }, options);
          return medium;
        }
        var SideCar$1 = function (_a) {
          var sideCar = _a.sideCar,
            rest = __rest(_a, ["sideCar"]);
          if (!sideCar) {
            throw new Error('Sidecar: please provide `sideCar` property to import the right car');
          }
          var Target = sideCar.read();
          if (!Target) {
            throw new Error('Sidecar medium not found');
          }
          return reactExports.createElement(Target, __assign({}, rest));
        };
        SideCar$1.isSideCarExport = true;
        function exportSidecar(medium, exported) {
          medium.useMedium(exported);
          return SideCar$1;
        }
        var effectCar = createSidecarMedium();
        var nothing = function () {
          return;
        };
        /**
         * Removes scrollbar from the page and contain the scroll within the Lock
         */
        var RemoveScroll = reactExports.forwardRef(function (props, parentRef) {
          var ref = reactExports.useRef(null);
          var _a = reactExports.useState({
              onScrollCapture: nothing,
              onWheelCapture: nothing,
              onTouchMoveCapture: nothing
            }),
            callbacks = _a[0],
            setCallbacks = _a[1];
          var forwardProps = props.forwardProps,
            children = props.children,
            className = props.className,
            removeScrollBar = props.removeScrollBar,
            enabled = props.enabled,
            shards = props.shards,
            sideCar = props.sideCar,
            noRelative = props.noRelative,
            noIsolation = props.noIsolation,
            inert = props.inert,
            allowPinchZoom = props.allowPinchZoom,
            _b = props.as,
            Container = _b === void 0 ? 'div' : _b,
            gapMode = props.gapMode,
            rest = __rest(props, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]);
          var SideCar = sideCar;
          var containerRef = useMergeRefs([ref, parentRef]);
          var containerProps = __assign(__assign({}, rest), callbacks);
          return reactExports.createElement(reactExports.Fragment, null, enabled && reactExports.createElement(SideCar, {
            sideCar: effectCar,
            removeScrollBar: removeScrollBar,
            shards: shards,
            noRelative: noRelative,
            noIsolation: noIsolation,
            inert: inert,
            setCallbacks: setCallbacks,
            allowPinchZoom: !!allowPinchZoom,
            lockRef: ref,
            gapMode: gapMode
          }), forwardProps ? reactExports.cloneElement(reactExports.Children.only(children), __assign(__assign({}, containerProps), {
            ref: containerRef
          })) : reactExports.createElement(Container, __assign({}, containerProps, {
            className: className,
            ref: containerRef
          }), children));
        });
        RemoveScroll.defaultProps = {
          enabled: true,
          removeScrollBar: true,
          inert: false
        };
        RemoveScroll.classNames = {
          fullWidth: fullWidthClassName,
          zeroRight: zeroRightClassName
        };
        var getNonce = function () {
          if (typeof __webpack_nonce__ !== 'undefined') {
            return __webpack_nonce__;
          }
          return undefined;
        };
        function makeStyleTag() {
          if (!document) return null;
          var tag = document.createElement('style');
          tag.type = 'text/css';
          var nonce = getNonce();
          if (nonce) {
            tag.setAttribute('nonce', nonce);
          }
          return tag;
        }
        function injectStyles(tag, css) {
          // @ts-ignore
          if (tag.styleSheet) {
            // @ts-ignore
            tag.styleSheet.cssText = css;
          } else {
            tag.appendChild(document.createTextNode(css));
          }
        }
        function insertStyleTag(tag) {
          var head = document.head || document.getElementsByTagName('head')[0];
          head.appendChild(tag);
        }
        var stylesheetSingleton = function () {
          var counter = 0;
          var stylesheet = null;
          return {
            add: function (style) {
              if (counter == 0) {
                if (stylesheet = makeStyleTag()) {
                  injectStyles(stylesheet, style);
                  insertStyleTag(stylesheet);
                }
              }
              counter++;
            },
            remove: function () {
              counter--;
              if (!counter && stylesheet) {
                stylesheet.parentNode && stylesheet.parentNode.removeChild(stylesheet);
                stylesheet = null;
              }
            }
          };
        };

        /**
         * creates a hook to control style singleton
         * @see {@link styleSingleton} for a safer component version
         * @example
         * ```tsx
         * const useStyle = styleHookSingleton();
         * ///
         * useStyle('body { overflow: hidden}');
         */
        var styleHookSingleton = function () {
          var sheet = stylesheetSingleton();
          return function (styles, isDynamic) {
            reactExports.useEffect(function () {
              sheet.add(styles);
              return function () {
                sheet.remove();
              };
            }, [styles && isDynamic]);
          };
        };

        /**
         * create a Component to add styles on demand
         * - styles are added when first instance is mounted
         * - styles are removed when the last instance is unmounted
         * - changing styles in runtime does nothing unless dynamic is set. But with multiple components that can lead to the undefined behavior
         */
        var styleSingleton = function () {
          var useStyle = styleHookSingleton();
          var Sheet = function (_a) {
            var styles = _a.styles,
              dynamic = _a.dynamic;
            useStyle(styles, dynamic);
            return null;
          };
          return Sheet;
        };
        var zeroGap = {
          left: 0,
          top: 0,
          right: 0,
          gap: 0
        };
        var parse = function (x) {
          return parseInt(x || '', 10) || 0;
        };
        var getOffset = function (gapMode) {
          var cs = window.getComputedStyle(document.body);
          var left = cs[gapMode === 'padding' ? 'paddingLeft' : 'marginLeft'];
          var top = cs[gapMode === 'padding' ? 'paddingTop' : 'marginTop'];
          var right = cs[gapMode === 'padding' ? 'paddingRight' : 'marginRight'];
          return [parse(left), parse(top), parse(right)];
        };
        var getGapWidth = function (gapMode) {
          if (gapMode === void 0) {
            gapMode = 'margin';
          }
          if (typeof window === 'undefined') {
            return zeroGap;
          }
          var offsets = getOffset(gapMode);
          var documentWidth = document.documentElement.clientWidth;
          var windowWidth = window.innerWidth;
          return {
            left: offsets[0],
            top: offsets[1],
            right: offsets[2],
            gap: Math.max(0, windowWidth - documentWidth + offsets[2] - offsets[0])
          };
        };
        var Style = styleSingleton();
        var lockAttribute = 'data-scroll-locked';
        // important tip - once we measure scrollBar width and remove them
        // we could not repeat this operation
        // thus we are using style-singleton - only the first "yet correct" style will be applied.
        var getStyles = function (_a, allowRelative, gapMode, important) {
          var left = _a.left,
            top = _a.top,
            right = _a.right,
            gap = _a.gap;
          if (gapMode === void 0) {
            gapMode = 'margin';
          }
          return "\n  .".concat(noScrollbarsClassName, " {\n   overflow: hidden ").concat(important, ";\n   padding-right: ").concat(gap, "px ").concat(important, ";\n  }\n  body[").concat(lockAttribute, "] {\n    overflow: hidden ").concat(important, ";\n    overscroll-behavior: contain;\n    ").concat([allowRelative && "position: relative ".concat(important, ";"), gapMode === 'margin' && "\n    padding-left: ".concat(left, "px;\n    padding-top: ").concat(top, "px;\n    padding-right: ").concat(right, "px;\n    margin-left:0;\n    margin-top:0;\n    margin-right: ").concat(gap, "px ").concat(important, ";\n    "), gapMode === 'padding' && "padding-right: ".concat(gap, "px ").concat(important, ";")].filter(Boolean).join(''), "\n  }\n  \n  .").concat(zeroRightClassName, " {\n    right: ").concat(gap, "px ").concat(important, ";\n  }\n  \n  .").concat(fullWidthClassName, " {\n    margin-right: ").concat(gap, "px ").concat(important, ";\n  }\n  \n  .").concat(zeroRightClassName, " .").concat(zeroRightClassName, " {\n    right: 0 ").concat(important, ";\n  }\n  \n  .").concat(fullWidthClassName, " .").concat(fullWidthClassName, " {\n    margin-right: 0 ").concat(important, ";\n  }\n  \n  body[").concat(lockAttribute, "] {\n    ").concat(removedBarSizeVariable, ": ").concat(gap, "px;\n  }\n");
        };
        var getCurrentUseCounter = function () {
          var counter = parseInt(document.body.getAttribute(lockAttribute) || '0', 10);
          return isFinite(counter) ? counter : 0;
        };
        var useLockAttribute = function () {
          reactExports.useEffect(function () {
            document.body.setAttribute(lockAttribute, (getCurrentUseCounter() + 1).toString());
            return function () {
              var newCounter = getCurrentUseCounter() - 1;
              if (newCounter <= 0) {
                document.body.removeAttribute(lockAttribute);
              } else {
                document.body.setAttribute(lockAttribute, newCounter.toString());
              }
            };
          }, []);
        };
        /**
         * Removes page scrollbar and blocks page scroll when mounted
         */
        var RemoveScrollBar = function (_a) {
          var noRelative = _a.noRelative,
            noImportant = _a.noImportant,
            _b = _a.gapMode,
            gapMode = _b === void 0 ? 'margin' : _b;
          useLockAttribute();
          /*
           gap will be measured on every component mount
           however it will be used only by the "first" invocation
           due to singleton nature of <Style
           */
          var gap = reactExports.useMemo(function () {
            return getGapWidth(gapMode);
          }, [gapMode]);
          return reactExports.createElement(Style, {
            styles: getStyles(gap, !noRelative, gapMode, !noImportant ? '!important' : '')
          });
        };
        var passiveSupported = false;
        if (typeof window !== 'undefined') {
          try {
            var options = Object.defineProperty({}, 'passive', {
              get: function () {
                passiveSupported = true;
                return true;
              }
            });
            // @ts-ignore
            window.addEventListener('test', options, options);
            // @ts-ignore
            window.removeEventListener('test', options, options);
          } catch (err) {
            passiveSupported = false;
          }
        }
        var nonPassive = passiveSupported ? {
          passive: false
        } : false;
        var alwaysContainsScroll = function (node) {
          // textarea will always _contain_ scroll inside self. It only can be hidden
          return node.tagName === 'TEXTAREA';
        };
        var elementCanBeScrolled = function (node, overflow) {
          if (!(node instanceof Element)) {
            return false;
          }
          var styles = window.getComputedStyle(node);
          return (
            // not-not-scrollable
            styles[overflow] !== 'hidden' &&
            // contains scroll inside self
            !(styles.overflowY === styles.overflowX && !alwaysContainsScroll(node) && styles[overflow] === 'visible')
          );
        };
        var elementCouldBeVScrolled = function (node) {
          return elementCanBeScrolled(node, 'overflowY');
        };
        var elementCouldBeHScrolled = function (node) {
          return elementCanBeScrolled(node, 'overflowX');
        };
        var locationCouldBeScrolled = function (axis, node) {
          var ownerDocument = node.ownerDocument;
          var current = node;
          do {
            // Skip over shadow root
            if (typeof ShadowRoot !== 'undefined' && current instanceof ShadowRoot) {
              current = current.host;
            }
            var isScrollable = elementCouldBeScrolled(axis, current);
            if (isScrollable) {
              var _a = getScrollVariables(axis, current),
                scrollHeight = _a[1],
                clientHeight = _a[2];
              if (scrollHeight > clientHeight) {
                return true;
              }
            }
            current = current.parentNode;
          } while (current && current !== ownerDocument.body);
          return false;
        };
        var getVScrollVariables = function (_a) {
          var scrollTop = _a.scrollTop,
            scrollHeight = _a.scrollHeight,
            clientHeight = _a.clientHeight;
          return [scrollTop, scrollHeight, clientHeight];
        };
        var getHScrollVariables = function (_a) {
          var scrollLeft = _a.scrollLeft,
            scrollWidth = _a.scrollWidth,
            clientWidth = _a.clientWidth;
          return [scrollLeft, scrollWidth, clientWidth];
        };
        var elementCouldBeScrolled = function (axis, node) {
          return axis === 'v' ? elementCouldBeVScrolled(node) : elementCouldBeHScrolled(node);
        };
        var getScrollVariables = function (axis, node) {
          return axis === 'v' ? getVScrollVariables(node) : getHScrollVariables(node);
        };
        var getDirectionFactor = function (axis, direction) {
          /**
           * If the element's direction is rtl (right-to-left), then scrollLeft is 0 when the scrollbar is at its rightmost position,
           * and then increasingly negative as you scroll towards the end of the content.
           * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft
           */
          return axis === 'h' && direction === 'rtl' ? -1 : 1;
        };
        var handleScroll = function (axis, endTarget, event, sourceDelta, noOverscroll) {
          var directionFactor = getDirectionFactor(axis, window.getComputedStyle(endTarget).direction);
          var delta = directionFactor * sourceDelta;
          // find scrollable target
          var target = event.target;
          var targetInLock = endTarget.contains(target);
          var shouldCancelScroll = false;
          var isDeltaPositive = delta > 0;
          var availableScroll = 0;
          var availableScrollTop = 0;
          do {
            if (!target) {
              break;
            }
            var _a = getScrollVariables(axis, target),
              position = _a[0],
              scroll_1 = _a[1],
              capacity = _a[2];
            var elementScroll = scroll_1 - capacity - directionFactor * position;
            if (position || elementScroll) {
              if (elementCouldBeScrolled(axis, target)) {
                availableScroll += elementScroll;
                availableScrollTop += position;
              }
            }
            var parent_1 = target.parentNode;
            // we will "bubble" from ShadowDom in case we are, or just to the parent in normal case
            // this is the same logic used in focus-lock
            target = parent_1 && parent_1.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? parent_1.host : parent_1;
          } while (
          // portaled content
          !targetInLock && target !== document.body ||
          // self content
          targetInLock && (endTarget.contains(target) || endTarget === target));
          // handle epsilon around 0 (non standard zoom levels)
          if (isDeltaPositive && (Math.abs(availableScroll) < 1 || false)) {
            shouldCancelScroll = true;
          } else if (!isDeltaPositive && (Math.abs(availableScrollTop) < 1 || false)) {
            shouldCancelScroll = true;
          }
          return shouldCancelScroll;
        };
        var getTouchXY = function (event) {
          return 'changedTouches' in event ? [event.changedTouches[0].clientX, event.changedTouches[0].clientY] : [0, 0];
        };
        var getDeltaXY = function (event) {
          return [event.deltaX, event.deltaY];
        };
        var extractRef = function (ref) {
          return ref && 'current' in ref ? ref.current : ref;
        };
        var deltaCompare = function (x, y) {
          return x[0] === y[0] && x[1] === y[1];
        };
        var generateStyle = function (id) {
          return "\n  .block-interactivity-".concat(id, " {pointer-events: none;}\n  .allow-interactivity-").concat(id, " {pointer-events: all;}\n");
        };
        var idCounter = 0;
        var lockStack = [];
        function RemoveScrollSideCar(props) {
          var shouldPreventQueue = reactExports.useRef([]);
          var touchStartRef = reactExports.useRef([0, 0]);
          var activeAxis = reactExports.useRef();
          var id = reactExports.useState(idCounter++)[0];
          var Style = reactExports.useState(styleSingleton)[0];
          var lastProps = reactExports.useRef(props);
          reactExports.useEffect(function () {
            lastProps.current = props;
          }, [props]);
          reactExports.useEffect(function () {
            if (props.inert) {
              document.body.classList.add("block-interactivity-".concat(id));
              var allow_1 = __spreadArray([props.lockRef.current], (props.shards || []).map(extractRef), true).filter(Boolean);
              allow_1.forEach(function (el) {
                return el.classList.add("allow-interactivity-".concat(id));
              });
              return function () {
                document.body.classList.remove("block-interactivity-".concat(id));
                allow_1.forEach(function (el) {
                  return el.classList.remove("allow-interactivity-".concat(id));
                });
              };
            }
            return;
          }, [props.inert, props.lockRef.current, props.shards]);
          var shouldCancelEvent = reactExports.useCallback(function (event, parent) {
            if ('touches' in event && event.touches.length === 2 || event.type === 'wheel' && event.ctrlKey) {
              return !lastProps.current.allowPinchZoom;
            }
            var touch = getTouchXY(event);
            var touchStart = touchStartRef.current;
            var deltaX = 'deltaX' in event ? event.deltaX : touchStart[0] - touch[0];
            var deltaY = 'deltaY' in event ? event.deltaY : touchStart[1] - touch[1];
            var currentAxis;
            var target = event.target;
            var moveDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'h' : 'v';
            // allow horizontal touch move on Range inputs. They will not cause any scroll
            if ('touches' in event && moveDirection === 'h' && target.type === 'range') {
              return false;
            }
            var canBeScrolledInMainDirection = locationCouldBeScrolled(moveDirection, target);
            if (!canBeScrolledInMainDirection) {
              return true;
            }
            if (canBeScrolledInMainDirection) {
              currentAxis = moveDirection;
            } else {
              currentAxis = moveDirection === 'v' ? 'h' : 'v';
              canBeScrolledInMainDirection = locationCouldBeScrolled(moveDirection, target);
              // other axis might be not scrollable
            }
            if (!canBeScrolledInMainDirection) {
              return false;
            }
            if (!activeAxis.current && 'changedTouches' in event && (deltaX || deltaY)) {
              activeAxis.current = currentAxis;
            }
            if (!currentAxis) {
              return true;
            }
            var cancelingAxis = activeAxis.current || currentAxis;
            return handleScroll(cancelingAxis, parent, event, cancelingAxis === 'h' ? deltaX : deltaY);
          }, []);
          var shouldPrevent = reactExports.useCallback(function (_event) {
            var event = _event;
            if (!lockStack.length || lockStack[lockStack.length - 1] !== Style) {
              // not the last active
              return;
            }
            var delta = 'deltaY' in event ? getDeltaXY(event) : getTouchXY(event);
            var sourceEvent = shouldPreventQueue.current.filter(function (e) {
              return e.name === event.type && (e.target === event.target || event.target === e.shadowParent) && deltaCompare(e.delta, delta);
            })[0];
            // self event, and should be canceled
            if (sourceEvent && sourceEvent.should) {
              if (event.cancelable) {
                event.preventDefault();
              }
              return;
            }
            // outside or shard event
            if (!sourceEvent) {
              var shardNodes = (lastProps.current.shards || []).map(extractRef).filter(Boolean).filter(function (node) {
                return node.contains(event.target);
              });
              var shouldStop = shardNodes.length > 0 ? shouldCancelEvent(event, shardNodes[0]) : !lastProps.current.noIsolation;
              if (shouldStop) {
                if (event.cancelable) {
                  event.preventDefault();
                }
              }
            }
          }, []);
          var shouldCancel = reactExports.useCallback(function (name, delta, target, should) {
            var event = {
              name: name,
              delta: delta,
              target: target,
              should: should,
              shadowParent: getOutermostShadowParent(target)
            };
            shouldPreventQueue.current.push(event);
            setTimeout(function () {
              shouldPreventQueue.current = shouldPreventQueue.current.filter(function (e) {
                return e !== event;
              });
            }, 1);
          }, []);
          var scrollTouchStart = reactExports.useCallback(function (event) {
            touchStartRef.current = getTouchXY(event);
            activeAxis.current = undefined;
          }, []);
          var scrollWheel = reactExports.useCallback(function (event) {
            shouldCancel(event.type, getDeltaXY(event), event.target, shouldCancelEvent(event, props.lockRef.current));
          }, []);
          var scrollTouchMove = reactExports.useCallback(function (event) {
            shouldCancel(event.type, getTouchXY(event), event.target, shouldCancelEvent(event, props.lockRef.current));
          }, []);
          reactExports.useEffect(function () {
            lockStack.push(Style);
            props.setCallbacks({
              onScrollCapture: scrollWheel,
              onWheelCapture: scrollWheel,
              onTouchMoveCapture: scrollTouchMove
            });
            document.addEventListener('wheel', shouldPrevent, nonPassive);
            document.addEventListener('touchmove', shouldPrevent, nonPassive);
            document.addEventListener('touchstart', scrollTouchStart, nonPassive);
            return function () {
              lockStack = lockStack.filter(function (inst) {
                return inst !== Style;
              });
              document.removeEventListener('wheel', shouldPrevent, nonPassive);
              document.removeEventListener('touchmove', shouldPrevent, nonPassive);
              document.removeEventListener('touchstart', scrollTouchStart, nonPassive);
            };
          }, []);
          var removeScrollBar = props.removeScrollBar,
            inert = props.inert;
          return reactExports.createElement(reactExports.Fragment, null, inert ? reactExports.createElement(Style, {
            styles: generateStyle(id)
          }) : null, removeScrollBar ? reactExports.createElement(RemoveScrollBar, {
            noRelative: props.noRelative,
            gapMode: props.gapMode
          }) : null);
        }
        function getOutermostShadowParent(node) {
          var shadowParent = null;
          while (node !== null) {
            if (node instanceof ShadowRoot) {
              shadowParent = node.host;
              node = node.host;
            }
            node = node.parentNode;
          }
          return shadowParent;
        }
        const SideCar = exportSidecar(effectCar, RemoveScrollSideCar);
        var ReactRemoveScroll = reactExports.forwardRef(function (props, ref) {
          return reactExports.createElement(RemoveScroll, __assign({}, props, {
            ref: ref,
            sideCar: SideCar
          }));
        });
        ReactRemoveScroll.classNames = RemoveScroll.classNames;
        var OPEN_KEYS = [" ", "Enter", "ArrowUp", "ArrowDown"];
        var SELECTION_KEYS$1 = [" ", "Enter"];
        var SELECT_NAME = "Select";
        var [Collection$2, useCollection$2, createCollectionScope$2] = createCollection(SELECT_NAME);
        var [createSelectContext] = createContextScope$1(SELECT_NAME, [createCollectionScope$2, createPopperScope]);
        var usePopperScope$2 = createPopperScope();
        var [SelectProvider, useSelectContext] = createSelectContext(SELECT_NAME);
        var [SelectNativeOptionsProvider, useSelectNativeOptionsContext] = createSelectContext(SELECT_NAME);
        var Select$1 = props => {
          const {
            __scopeSelect,
            children,
            open: openProp,
            defaultOpen,
            onOpenChange,
            value: valueProp,
            defaultValue,
            onValueChange,
            dir,
            name,
            autoComplete,
            disabled,
            required,
            form
          } = props;
          const popperScope = usePopperScope$2(__scopeSelect);
          const [trigger, setTrigger] = reactExports.useState(null);
          const [valueNode, setValueNode] = reactExports.useState(null);
          const [valueNodeHasChildren, setValueNodeHasChildren] = reactExports.useState(false);
          const direction = useDirection(dir);
          const [open, setOpen] = useControllableState({
            prop: openProp,
            defaultProp: defaultOpen ?? false,
            onChange: onOpenChange,
            caller: SELECT_NAME
          });
          const [value, setValue] = useControllableState({
            prop: valueProp,
            defaultProp: defaultValue,
            onChange: onValueChange,
            caller: SELECT_NAME
          });
          const triggerPointerDownPosRef = reactExports.useRef(null);
          const isFormControl = trigger ? form || !!trigger.closest("form") : true;
          const [nativeOptionsSet, setNativeOptionsSet] = reactExports.useState(/* @__PURE__ */new Set());
          const nativeSelectKey = Array.from(nativeOptionsSet).map(option => option.props.value).join(";");
          return /* @__PURE__ */jsxRuntimeExports.jsx(Root2$4, {
            ...popperScope,
            children: /* @__PURE__ */jsxRuntimeExports.jsxs(SelectProvider, {
              required,
              scope: __scopeSelect,
              trigger,
              onTriggerChange: setTrigger,
              valueNode,
              onValueNodeChange: setValueNode,
              valueNodeHasChildren,
              onValueNodeHasChildrenChange: setValueNodeHasChildren,
              contentId: useId(),
              value,
              onValueChange: setValue,
              open,
              onOpenChange: setOpen,
              dir: direction,
              triggerPointerDownPosRef,
              disabled,
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(Collection$2.Provider, {
                scope: __scopeSelect,
                children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectNativeOptionsProvider, {
                  scope: props.__scopeSelect,
                  onNativeOptionAdd: reactExports.useCallback(option => {
                    setNativeOptionsSet(prev => new Set(prev).add(option));
                  }, []),
                  onNativeOptionRemove: reactExports.useCallback(option => {
                    setNativeOptionsSet(prev => {
                      const optionsSet = new Set(prev);
                      optionsSet.delete(option);
                      return optionsSet;
                    });
                  }, []),
                  children
                })
              }), isFormControl ? /* @__PURE__ */jsxRuntimeExports.jsxs(SelectBubbleInput, {
                "aria-hidden": true,
                required,
                tabIndex: -1,
                name,
                autoComplete,
                value,
                onChange: event => setValue(event.target.value),
                disabled,
                form,
                children: [value === void 0 ? /* @__PURE__ */jsxRuntimeExports.jsx("option", {
                  value: ""
                }) : null, Array.from(nativeOptionsSet)]
              }, nativeSelectKey) : null]
            })
          });
        };
        Select$1.displayName = SELECT_NAME;
        var TRIGGER_NAME$5 = "SelectTrigger";
        var SelectTrigger$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            disabled = false,
            ...triggerProps
          } = props;
          const popperScope = usePopperScope$2(__scopeSelect);
          const context = useSelectContext(TRIGGER_NAME$5, __scopeSelect);
          const isDisabled = context.disabled || disabled;
          const composedRefs = useComposedRefs(forwardedRef, context.onTriggerChange);
          const getItems = useCollection$2(__scopeSelect);
          const pointerTypeRef = reactExports.useRef("touch");
          const [searchRef, handleTypeaheadSearch, resetTypeahead] = useTypeaheadSearch(search => {
            const enabledItems = getItems().filter(item => !item.disabled);
            const currentItem = enabledItems.find(item => item.value === context.value);
            const nextItem = findNextItem(enabledItems, search, currentItem);
            if (nextItem !== void 0) {
              context.onValueChange(nextItem.value);
            }
          });
          const handleOpen = pointerEvent => {
            if (!isDisabled) {
              context.onOpenChange(true);
              resetTypeahead();
            }
            if (pointerEvent) {
              context.triggerPointerDownPosRef.current = {
                x: Math.round(pointerEvent.pageX),
                y: Math.round(pointerEvent.pageY)
              };
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx(Anchor, {
            asChild: true,
            ...popperScope,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.button, {
              type: "button",
              role: "combobox",
              "aria-controls": context.contentId,
              "aria-expanded": context.open,
              "aria-required": context.required,
              "aria-autocomplete": "none",
              dir: context.dir,
              "data-state": context.open ? "open" : "closed",
              disabled: isDisabled,
              "data-disabled": isDisabled ? "" : void 0,
              "data-placeholder": shouldShowPlaceholder(context.value) ? "" : void 0,
              ...triggerProps,
              ref: composedRefs,
              onClick: composeEventHandlers(triggerProps.onClick, event => {
                event.currentTarget.focus();
                if (pointerTypeRef.current !== "mouse") {
                  handleOpen(event);
                }
              }),
              onPointerDown: composeEventHandlers(triggerProps.onPointerDown, event => {
                pointerTypeRef.current = event.pointerType;
                const target = event.target;
                if (target.hasPointerCapture(event.pointerId)) {
                  target.releasePointerCapture(event.pointerId);
                }
                if (event.button === 0 && event.ctrlKey === false && event.pointerType === "mouse") {
                  handleOpen(event);
                  event.preventDefault();
                }
              }),
              onKeyDown: composeEventHandlers(triggerProps.onKeyDown, event => {
                const isTypingAhead = searchRef.current !== "";
                const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
                if (!isModifierKey && event.key.length === 1) handleTypeaheadSearch(event.key);
                if (isTypingAhead && event.key === " ") return;
                if (OPEN_KEYS.includes(event.key)) {
                  handleOpen();
                  event.preventDefault();
                }
              })
            })
          });
        });
        SelectTrigger$1.displayName = TRIGGER_NAME$5;
        var VALUE_NAME = "SelectValue";
        var SelectValue$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            className,
            style,
            children,
            placeholder = "",
            ...valueProps
          } = props;
          const context = useSelectContext(VALUE_NAME, __scopeSelect);
          const {
            onValueNodeHasChildrenChange
          } = context;
          const hasChildren = children !== void 0;
          const composedRefs = useComposedRefs(forwardedRef, context.onValueNodeChange);
          useLayoutEffect2(() => {
            onValueNodeHasChildrenChange(hasChildren);
          }, [onValueNodeHasChildrenChange, hasChildren]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.span, {
            ...valueProps,
            ref: composedRefs,
            style: {
              pointerEvents: "none"
            },
            children: shouldShowPlaceholder(context.value) ? /* @__PURE__ */jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, {
              children: placeholder
            }) : children
          });
        });
        SelectValue$1.displayName = VALUE_NAME;
        var ICON_NAME = "SelectIcon";
        var SelectIcon = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            children,
            ...iconProps
          } = props;
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.span, {
            "aria-hidden": true,
            ...iconProps,
            ref: forwardedRef,
            children: children || "\u25BC"
          });
        });
        SelectIcon.displayName = ICON_NAME;
        var PORTAL_NAME$4 = "SelectPortal";
        var SelectPortal = props => {
          return /* @__PURE__ */jsxRuntimeExports.jsx(Portal$4, {
            asChild: true,
            ...props
          });
        };
        SelectPortal.displayName = PORTAL_NAME$4;
        var CONTENT_NAME$5 = "SelectContent";
        var SelectContent$1 = reactExports.forwardRef((props, forwardedRef) => {
          const context = useSelectContext(CONTENT_NAME$5, props.__scopeSelect);
          const [fragment, setFragment] = reactExports.useState();
          useLayoutEffect2(() => {
            setFragment(new DocumentFragment());
          }, []);
          if (!context.open) {
            const frag = fragment;
            return frag ? reactDomExports.createPortal(/* @__PURE__ */jsxRuntimeExports.jsx(SelectContentProvider, {
              scope: props.__scopeSelect,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Collection$2.Slot, {
                scope: props.__scopeSelect,
                children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                  children: props.children
                })
              })
            }), frag) : null;
          }
          return /* @__PURE__ */jsxRuntimeExports.jsx(SelectContentImpl, {
            ...props,
            ref: forwardedRef
          });
        });
        SelectContent$1.displayName = CONTENT_NAME$5;
        var CONTENT_MARGIN = 10;
        var [SelectContentProvider, useSelectContentContext] = createSelectContext(CONTENT_NAME$5);
        var CONTENT_IMPL_NAME = "SelectContentImpl";
        var Slot$3 = createSlot$3("SelectContent.RemoveScroll");
        var SelectContentImpl = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            position = "item-aligned",
            onCloseAutoFocus,
            onEscapeKeyDown,
            onPointerDownOutside,
            //
            // PopperContent props
            side,
            sideOffset,
            align,
            alignOffset,
            arrowPadding,
            collisionBoundary,
            collisionPadding,
            sticky,
            hideWhenDetached,
            avoidCollisions,
            //
            ...contentProps
          } = props;
          const context = useSelectContext(CONTENT_NAME$5, __scopeSelect);
          const [content, setContent] = reactExports.useState(null);
          const [viewport, setViewport] = reactExports.useState(null);
          const composedRefs = useComposedRefs(forwardedRef, node => setContent(node));
          const [selectedItem, setSelectedItem] = reactExports.useState(null);
          const [selectedItemText, setSelectedItemText] = reactExports.useState(null);
          const getItems = useCollection$2(__scopeSelect);
          const [isPositioned, setIsPositioned] = reactExports.useState(false);
          const firstValidItemFoundRef = reactExports.useRef(false);
          reactExports.useEffect(() => {
            if (content) return hideOthers(content);
          }, [content]);
          useFocusGuards();
          const focusFirst = reactExports.useCallback(candidates => {
            const [firstItem, ...restItems] = getItems().map(item => item.ref.current);
            const [lastItem] = restItems.slice(-1);
            const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
            for (const candidate of candidates) {
              if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
              candidate?.scrollIntoView({
                block: "nearest"
              });
              if (candidate === firstItem && viewport) viewport.scrollTop = 0;
              if (candidate === lastItem && viewport) viewport.scrollTop = viewport.scrollHeight;
              candidate?.focus();
              if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
            }
          }, [getItems, viewport]);
          const focusSelectedItem = reactExports.useCallback(() => focusFirst([selectedItem, content]), [focusFirst, selectedItem, content]);
          reactExports.useEffect(() => {
            if (isPositioned) {
              focusSelectedItem();
            }
          }, [isPositioned, focusSelectedItem]);
          const {
            onOpenChange,
            triggerPointerDownPosRef
          } = context;
          reactExports.useEffect(() => {
            if (content) {
              let pointerMoveDelta = {
                x: 0,
                y: 0
              };
              const handlePointerMove = event => {
                pointerMoveDelta = {
                  x: Math.abs(Math.round(event.pageX) - (triggerPointerDownPosRef.current?.x ?? 0)),
                  y: Math.abs(Math.round(event.pageY) - (triggerPointerDownPosRef.current?.y ?? 0))
                };
              };
              const handlePointerUp = event => {
                if (pointerMoveDelta.x <= 10 && pointerMoveDelta.y <= 10) {
                  event.preventDefault();
                } else {
                  if (!content.contains(event.target)) {
                    onOpenChange(false);
                  }
                }
                document.removeEventListener("pointermove", handlePointerMove);
                triggerPointerDownPosRef.current = null;
              };
              if (triggerPointerDownPosRef.current !== null) {
                document.addEventListener("pointermove", handlePointerMove);
                document.addEventListener("pointerup", handlePointerUp, {
                  capture: true,
                  once: true
                });
              }
              return () => {
                document.removeEventListener("pointermove", handlePointerMove);
                document.removeEventListener("pointerup", handlePointerUp, {
                  capture: true
                });
              };
            }
          }, [content, onOpenChange, triggerPointerDownPosRef]);
          reactExports.useEffect(() => {
            const close = () => onOpenChange(false);
            window.addEventListener("blur", close);
            window.addEventListener("resize", close);
            return () => {
              window.removeEventListener("blur", close);
              window.removeEventListener("resize", close);
            };
          }, [onOpenChange]);
          const [searchRef, handleTypeaheadSearch] = useTypeaheadSearch(search => {
            const enabledItems = getItems().filter(item => !item.disabled);
            const currentItem = enabledItems.find(item => item.ref.current === document.activeElement);
            const nextItem = findNextItem(enabledItems, search, currentItem);
            if (nextItem) {
              setTimeout(() => nextItem.ref.current.focus());
            }
          });
          const itemRefCallback = reactExports.useCallback((node, value, disabled) => {
            const isFirstValidItem = !firstValidItemFoundRef.current && !disabled;
            const isSelectedItem = context.value !== void 0 && context.value === value;
            if (isSelectedItem || isFirstValidItem) {
              setSelectedItem(node);
              if (isFirstValidItem) firstValidItemFoundRef.current = true;
            }
          }, [context.value]);
          const handleItemLeave = reactExports.useCallback(() => content?.focus(), [content]);
          const itemTextRefCallback = reactExports.useCallback((node, value, disabled) => {
            const isFirstValidItem = !firstValidItemFoundRef.current && !disabled;
            const isSelectedItem = context.value !== void 0 && context.value === value;
            if (isSelectedItem || isFirstValidItem) {
              setSelectedItemText(node);
            }
          }, [context.value]);
          const SelectPosition = position === "popper" ? SelectPopperPosition : SelectItemAlignedPosition;
          const popperContentProps = SelectPosition === SelectPopperPosition ? {
            side,
            sideOffset,
            align,
            alignOffset,
            arrowPadding,
            collisionBoundary,
            collisionPadding,
            sticky,
            hideWhenDetached,
            avoidCollisions
          } : {};
          return /* @__PURE__ */jsxRuntimeExports.jsx(SelectContentProvider, {
            scope: __scopeSelect,
            content,
            viewport,
            onViewportChange: setViewport,
            itemRefCallback,
            selectedItem,
            onItemLeave: handleItemLeave,
            itemTextRefCallback,
            focusSelectedItem,
            selectedItemText,
            position,
            isPositioned,
            searchRef,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(ReactRemoveScroll, {
              as: Slot$3,
              allowPinchZoom: true,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(FocusScope, {
                asChild: true,
                trapped: context.open,
                onMountAutoFocus: event => {
                  event.preventDefault();
                },
                onUnmountAutoFocus: composeEventHandlers(onCloseAutoFocus, event => {
                  context.trigger?.focus({
                    preventScroll: true
                  });
                  event.preventDefault();
                }),
                children: /* @__PURE__ */jsxRuntimeExports.jsx(DismissableLayer, {
                  asChild: true,
                  disableOutsidePointerEvents: true,
                  onEscapeKeyDown,
                  onPointerDownOutside,
                  onFocusOutside: event => event.preventDefault(),
                  onDismiss: () => context.onOpenChange(false),
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(SelectPosition, {
                    role: "listbox",
                    id: context.contentId,
                    "data-state": context.open ? "open" : "closed",
                    dir: context.dir,
                    onContextMenu: event => event.preventDefault(),
                    ...contentProps,
                    ...popperContentProps,
                    onPlaced: () => setIsPositioned(true),
                    ref: composedRefs,
                    style: {
                      // flex layout so we can place the scroll buttons properly
                      display: "flex",
                      flexDirection: "column",
                      // reset the outline by default as the content MAY get focused
                      outline: "none",
                      ...contentProps.style
                    },
                    onKeyDown: composeEventHandlers(contentProps.onKeyDown, event => {
                      const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
                      if (event.key === "Tab") event.preventDefault();
                      if (!isModifierKey && event.key.length === 1) handleTypeaheadSearch(event.key);
                      if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
                        const items = getItems().filter(item => !item.disabled);
                        let candidateNodes = items.map(item => item.ref.current);
                        if (["ArrowUp", "End"].includes(event.key)) {
                          candidateNodes = candidateNodes.slice().reverse();
                        }
                        if (["ArrowUp", "ArrowDown"].includes(event.key)) {
                          const currentElement = event.target;
                          const currentIndex = candidateNodes.indexOf(currentElement);
                          candidateNodes = candidateNodes.slice(currentIndex + 1);
                        }
                        setTimeout(() => focusFirst(candidateNodes));
                        event.preventDefault();
                      }
                    })
                  })
                })
              })
            })
          });
        });
        SelectContentImpl.displayName = CONTENT_IMPL_NAME;
        var ITEM_ALIGNED_POSITION_NAME = "SelectItemAlignedPosition";
        var SelectItemAlignedPosition = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            onPlaced,
            ...popperProps
          } = props;
          const context = useSelectContext(CONTENT_NAME$5, __scopeSelect);
          const contentContext = useSelectContentContext(CONTENT_NAME$5, __scopeSelect);
          const [contentWrapper, setContentWrapper] = reactExports.useState(null);
          const [content, setContent] = reactExports.useState(null);
          const composedRefs = useComposedRefs(forwardedRef, node => setContent(node));
          const getItems = useCollection$2(__scopeSelect);
          const shouldExpandOnScrollRef = reactExports.useRef(false);
          const shouldRepositionRef = reactExports.useRef(true);
          const {
            viewport,
            selectedItem,
            selectedItemText,
            focusSelectedItem
          } = contentContext;
          const position = reactExports.useCallback(() => {
            if (context.trigger && context.valueNode && contentWrapper && content && viewport && selectedItem && selectedItemText) {
              const triggerRect = context.trigger.getBoundingClientRect();
              const contentRect = content.getBoundingClientRect();
              const valueNodeRect = context.valueNode.getBoundingClientRect();
              const itemTextRect = selectedItemText.getBoundingClientRect();
              if (context.dir !== "rtl") {
                const itemTextOffset = itemTextRect.left - contentRect.left;
                const left = valueNodeRect.left - itemTextOffset;
                const leftDelta = triggerRect.left - left;
                const minContentWidth = triggerRect.width + leftDelta;
                const contentWidth = Math.max(minContentWidth, contentRect.width);
                const rightEdge = window.innerWidth - CONTENT_MARGIN;
                const clampedLeft = clamp$1(left, [CONTENT_MARGIN,
                // Prevents the content from going off the starting edge of the
                // viewport. It may still go off the ending edge, but this can be
                // controlled by the user since they may want to manage overflow in a
                // specific way.
                // https://github.com/radix-ui/primitives/issues/2049
                Math.max(CONTENT_MARGIN, rightEdge - contentWidth)]);
                contentWrapper.style.minWidth = minContentWidth + "px";
                contentWrapper.style.left = clampedLeft + "px";
              } else {
                const itemTextOffset = contentRect.right - itemTextRect.right;
                const right = window.innerWidth - valueNodeRect.right - itemTextOffset;
                const rightDelta = window.innerWidth - triggerRect.right - right;
                const minContentWidth = triggerRect.width + rightDelta;
                const contentWidth = Math.max(minContentWidth, contentRect.width);
                const leftEdge = window.innerWidth - CONTENT_MARGIN;
                const clampedRight = clamp$1(right, [CONTENT_MARGIN, Math.max(CONTENT_MARGIN, leftEdge - contentWidth)]);
                contentWrapper.style.minWidth = minContentWidth + "px";
                contentWrapper.style.right = clampedRight + "px";
              }
              const items = getItems();
              const availableHeight = window.innerHeight - CONTENT_MARGIN * 2;
              const itemsHeight = viewport.scrollHeight;
              const contentStyles = window.getComputedStyle(content);
              const contentBorderTopWidth = parseInt(contentStyles.borderTopWidth, 10);
              const contentPaddingTop = parseInt(contentStyles.paddingTop, 10);
              const contentBorderBottomWidth = parseInt(contentStyles.borderBottomWidth, 10);
              const contentPaddingBottom = parseInt(contentStyles.paddingBottom, 10);
              const fullContentHeight = contentBorderTopWidth + contentPaddingTop + itemsHeight + contentPaddingBottom + contentBorderBottomWidth;
              const minContentHeight = Math.min(selectedItem.offsetHeight * 5, fullContentHeight);
              const viewportStyles = window.getComputedStyle(viewport);
              const viewportPaddingTop = parseInt(viewportStyles.paddingTop, 10);
              const viewportPaddingBottom = parseInt(viewportStyles.paddingBottom, 10);
              const topEdgeToTriggerMiddle = triggerRect.top + triggerRect.height / 2 - CONTENT_MARGIN;
              const triggerMiddleToBottomEdge = availableHeight - topEdgeToTriggerMiddle;
              const selectedItemHalfHeight = selectedItem.offsetHeight / 2;
              const itemOffsetMiddle = selectedItem.offsetTop + selectedItemHalfHeight;
              const contentTopToItemMiddle = contentBorderTopWidth + contentPaddingTop + itemOffsetMiddle;
              const itemMiddleToContentBottom = fullContentHeight - contentTopToItemMiddle;
              const willAlignWithoutTopOverflow = contentTopToItemMiddle <= topEdgeToTriggerMiddle;
              if (willAlignWithoutTopOverflow) {
                const isLastItem = items.length > 0 && selectedItem === items[items.length - 1].ref.current;
                contentWrapper.style.bottom = "0px";
                const viewportOffsetBottom = content.clientHeight - viewport.offsetTop - viewport.offsetHeight;
                const clampedTriggerMiddleToBottomEdge = Math.max(triggerMiddleToBottomEdge, selectedItemHalfHeight + (
                // viewport might have padding bottom, include it to avoid a scrollable viewport
                isLastItem ? viewportPaddingBottom : 0) + viewportOffsetBottom + contentBorderBottomWidth);
                const height = contentTopToItemMiddle + clampedTriggerMiddleToBottomEdge;
                contentWrapper.style.height = height + "px";
              } else {
                const isFirstItem = items.length > 0 && selectedItem === items[0].ref.current;
                contentWrapper.style.top = "0px";
                const clampedTopEdgeToTriggerMiddle = Math.max(topEdgeToTriggerMiddle, contentBorderTopWidth + viewport.offsetTop + (
                // viewport might have padding top, include it to avoid a scrollable viewport
                isFirstItem ? viewportPaddingTop : 0) + selectedItemHalfHeight);
                const height = clampedTopEdgeToTriggerMiddle + itemMiddleToContentBottom;
                contentWrapper.style.height = height + "px";
                viewport.scrollTop = contentTopToItemMiddle - topEdgeToTriggerMiddle + viewport.offsetTop;
              }
              contentWrapper.style.margin = `${CONTENT_MARGIN}px 0`;
              contentWrapper.style.minHeight = minContentHeight + "px";
              contentWrapper.style.maxHeight = availableHeight + "px";
              onPlaced?.();
              requestAnimationFrame(() => shouldExpandOnScrollRef.current = true);
            }
          }, [getItems, context.trigger, context.valueNode, contentWrapper, content, viewport, selectedItem, selectedItemText, context.dir, onPlaced]);
          useLayoutEffect2(() => position(), [position]);
          const [contentZIndex, setContentZIndex] = reactExports.useState();
          useLayoutEffect2(() => {
            if (content) setContentZIndex(window.getComputedStyle(content).zIndex);
          }, [content]);
          const handleScrollButtonChange = reactExports.useCallback(node => {
            if (node && shouldRepositionRef.current === true) {
              position();
              focusSelectedItem?.();
              shouldRepositionRef.current = false;
            }
          }, [position, focusSelectedItem]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(SelectViewportProvider, {
            scope: __scopeSelect,
            contentWrapper,
            shouldExpandOnScrollRef,
            onScrollButtonChange: handleScrollButtonChange,
            children: /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              ref: setContentWrapper,
              style: {
                display: "flex",
                flexDirection: "column",
                position: "fixed",
                zIndex: contentZIndex
              },
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
                ...popperProps,
                ref: composedRefs,
                style: {
                  // When we get the height of the content, it includes borders. If we were to set
                  // the height without having `boxSizing: 'border-box'` it would be too big.
                  boxSizing: "border-box",
                  // We need to ensure the content doesn't get taller than the wrapper
                  maxHeight: "100%",
                  ...popperProps.style
                }
              })
            })
          });
        });
        SelectItemAlignedPosition.displayName = ITEM_ALIGNED_POSITION_NAME;
        var POPPER_POSITION_NAME = "SelectPopperPosition";
        var SelectPopperPosition = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            align = "start",
            collisionPadding = CONTENT_MARGIN,
            ...popperProps
          } = props;
          const popperScope = usePopperScope$2(__scopeSelect);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Content$2, {
            ...popperScope,
            ...popperProps,
            ref: forwardedRef,
            align,
            collisionPadding,
            style: {
              // Ensure border-box for floating-ui calculations
              boxSizing: "border-box",
              ...popperProps.style,
              // re-namespace exposed content custom properties
              ...{
                "--radix-select-content-transform-origin": "var(--radix-popper-transform-origin)",
                "--radix-select-content-available-width": "var(--radix-popper-available-width)",
                "--radix-select-content-available-height": "var(--radix-popper-available-height)",
                "--radix-select-trigger-width": "var(--radix-popper-anchor-width)",
                "--radix-select-trigger-height": "var(--radix-popper-anchor-height)"
              }
            }
          });
        });
        SelectPopperPosition.displayName = POPPER_POSITION_NAME;
        var [SelectViewportProvider, useSelectViewportContext] = createSelectContext(CONTENT_NAME$5, {});
        var VIEWPORT_NAME = "SelectViewport";
        var SelectViewport = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            nonce,
            ...viewportProps
          } = props;
          const contentContext = useSelectContentContext(VIEWPORT_NAME, __scopeSelect);
          const viewportContext = useSelectViewportContext(VIEWPORT_NAME, __scopeSelect);
          const composedRefs = useComposedRefs(forwardedRef, contentContext.onViewportChange);
          const prevScrollTopRef = reactExports.useRef(0);
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsx("style", {
              dangerouslySetInnerHTML: {
                __html: `[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}`
              },
              nonce
            }), /* @__PURE__ */jsxRuntimeExports.jsx(Collection$2.Slot, {
              scope: __scopeSelect,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
                "data-radix-select-viewport": "",
                role: "presentation",
                ...viewportProps,
                ref: composedRefs,
                style: {
                  // we use position: 'relative' here on the `viewport` so that when we call
                  // `selectedItem.offsetTop` in calculations, the offset is relative to the viewport
                  // (independent of the scrollUpButton).
                  position: "relative",
                  flex: 1,
                  // Viewport should only be scrollable in the vertical direction.
                  // This won't work in vertical writing modes, so we'll need to
                  // revisit this if/when that is supported
                  // https://developer.chrome.com/blog/vertical-form-controls
                  overflow: "hidden auto",
                  ...viewportProps.style
                },
                onScroll: composeEventHandlers(viewportProps.onScroll, event => {
                  const viewport = event.currentTarget;
                  const {
                    contentWrapper,
                    shouldExpandOnScrollRef
                  } = viewportContext;
                  if (shouldExpandOnScrollRef?.current && contentWrapper) {
                    const scrolledBy = Math.abs(prevScrollTopRef.current - viewport.scrollTop);
                    if (scrolledBy > 0) {
                      const availableHeight = window.innerHeight - CONTENT_MARGIN * 2;
                      const cssMinHeight = parseFloat(contentWrapper.style.minHeight);
                      const cssHeight = parseFloat(contentWrapper.style.height);
                      const prevHeight = Math.max(cssMinHeight, cssHeight);
                      if (prevHeight < availableHeight) {
                        const nextHeight = prevHeight + scrolledBy;
                        const clampedNextHeight = Math.min(availableHeight, nextHeight);
                        const heightDiff = nextHeight - clampedNextHeight;
                        contentWrapper.style.height = clampedNextHeight + "px";
                        if (contentWrapper.style.bottom === "0px") {
                          viewport.scrollTop = heightDiff > 0 ? heightDiff : 0;
                          contentWrapper.style.justifyContent = "flex-end";
                        }
                      }
                    }
                  }
                  prevScrollTopRef.current = viewport.scrollTop;
                })
              })
            })]
          });
        });
        SelectViewport.displayName = VIEWPORT_NAME;
        var GROUP_NAME$3 = "SelectGroup";
        var [SelectGroupContextProvider, useSelectGroupContext] = createSelectContext(GROUP_NAME$3);
        var SelectGroup = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            ...groupProps
          } = props;
          const groupId = useId();
          return /* @__PURE__ */jsxRuntimeExports.jsx(SelectGroupContextProvider, {
            scope: __scopeSelect,
            id: groupId,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
              role: "group",
              "aria-labelledby": groupId,
              ...groupProps,
              ref: forwardedRef
            })
          });
        });
        SelectGroup.displayName = GROUP_NAME$3;
        var LABEL_NAME$2 = "SelectLabel";
        var SelectLabel$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            ...labelProps
          } = props;
          const groupContext = useSelectGroupContext(LABEL_NAME$2, __scopeSelect);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            id: groupContext.id,
            ...labelProps,
            ref: forwardedRef
          });
        });
        SelectLabel$1.displayName = LABEL_NAME$2;
        var ITEM_NAME$3 = "SelectItem";
        var [SelectItemContextProvider, useSelectItemContext] = createSelectContext(ITEM_NAME$3);
        var SelectItem$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            value,
            disabled = false,
            textValue: textValueProp,
            ...itemProps
          } = props;
          const context = useSelectContext(ITEM_NAME$3, __scopeSelect);
          const contentContext = useSelectContentContext(ITEM_NAME$3, __scopeSelect);
          const isSelected = context.value === value;
          const [textValue, setTextValue] = reactExports.useState(textValueProp ?? "");
          const [isFocused, setIsFocused] = reactExports.useState(false);
          const composedRefs = useComposedRefs(forwardedRef, node => contentContext.itemRefCallback?.(node, value, disabled));
          const textId = useId();
          const pointerTypeRef = reactExports.useRef("touch");
          const handleSelect = () => {
            if (!disabled) {
              context.onValueChange(value);
              context.onOpenChange(false);
            }
          };
          if (value === "") {
            throw new Error("A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.");
          }
          return /* @__PURE__ */jsxRuntimeExports.jsx(SelectItemContextProvider, {
            scope: __scopeSelect,
            value,
            disabled,
            textId,
            isSelected,
            onItemTextChange: reactExports.useCallback(node => {
              setTextValue(prevTextValue => prevTextValue || (node?.textContent ?? "").trim());
            }, []),
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Collection$2.ItemSlot, {
              scope: __scopeSelect,
              value,
              disabled,
              textValue,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
                role: "option",
                "aria-labelledby": textId,
                "data-highlighted": isFocused ? "" : void 0,
                "aria-selected": isSelected && isFocused,
                "data-state": isSelected ? "checked" : "unchecked",
                "aria-disabled": disabled || void 0,
                "data-disabled": disabled ? "" : void 0,
                tabIndex: disabled ? void 0 : -1,
                ...itemProps,
                ref: composedRefs,
                onFocus: composeEventHandlers(itemProps.onFocus, () => setIsFocused(true)),
                onBlur: composeEventHandlers(itemProps.onBlur, () => setIsFocused(false)),
                onClick: composeEventHandlers(itemProps.onClick, () => {
                  if (pointerTypeRef.current !== "mouse") handleSelect();
                }),
                onPointerUp: composeEventHandlers(itemProps.onPointerUp, () => {
                  if (pointerTypeRef.current === "mouse") handleSelect();
                }),
                onPointerDown: composeEventHandlers(itemProps.onPointerDown, event => {
                  pointerTypeRef.current = event.pointerType;
                }),
                onPointerMove: composeEventHandlers(itemProps.onPointerMove, event => {
                  pointerTypeRef.current = event.pointerType;
                  if (disabled) {
                    contentContext.onItemLeave?.();
                  } else if (pointerTypeRef.current === "mouse") {
                    event.currentTarget.focus({
                      preventScroll: true
                    });
                  }
                }),
                onPointerLeave: composeEventHandlers(itemProps.onPointerLeave, event => {
                  if (event.currentTarget === document.activeElement) {
                    contentContext.onItemLeave?.();
                  }
                }),
                onKeyDown: composeEventHandlers(itemProps.onKeyDown, event => {
                  const isTypingAhead = contentContext.searchRef?.current !== "";
                  if (isTypingAhead && event.key === " ") return;
                  if (SELECTION_KEYS$1.includes(event.key)) handleSelect();
                  if (event.key === " ") event.preventDefault();
                })
              })
            })
          });
        });
        SelectItem$1.displayName = ITEM_NAME$3;
        var ITEM_TEXT_NAME = "SelectItemText";
        var SelectItemText = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            className,
            style,
            ...itemTextProps
          } = props;
          const context = useSelectContext(ITEM_TEXT_NAME, __scopeSelect);
          const contentContext = useSelectContentContext(ITEM_TEXT_NAME, __scopeSelect);
          const itemContext = useSelectItemContext(ITEM_TEXT_NAME, __scopeSelect);
          const nativeOptionsContext = useSelectNativeOptionsContext(ITEM_TEXT_NAME, __scopeSelect);
          const [itemTextNode, setItemTextNode] = reactExports.useState(null);
          const composedRefs = useComposedRefs(forwardedRef, node => setItemTextNode(node), itemContext.onItemTextChange, node => contentContext.itemTextRefCallback?.(node, itemContext.value, itemContext.disabled));
          const textContent = itemTextNode?.textContent;
          const nativeOption = reactExports.useMemo(() => /* @__PURE__ */jsxRuntimeExports.jsx("option", {
            value: itemContext.value,
            disabled: itemContext.disabled,
            children: textContent
          }, itemContext.value), [itemContext.disabled, itemContext.value, textContent]);
          const {
            onNativeOptionAdd,
            onNativeOptionRemove
          } = nativeOptionsContext;
          useLayoutEffect2(() => {
            onNativeOptionAdd(nativeOption);
            return () => onNativeOptionRemove(nativeOption);
          }, [onNativeOptionAdd, onNativeOptionRemove, nativeOption]);
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.span, {
              id: itemContext.textId,
              ...itemTextProps,
              ref: composedRefs
            }), itemContext.isSelected && context.valueNode && !context.valueNodeHasChildren ? reactDomExports.createPortal(itemTextProps.children, context.valueNode) : null]
          });
        });
        SelectItemText.displayName = ITEM_TEXT_NAME;
        var ITEM_INDICATOR_NAME$1 = "SelectItemIndicator";
        var SelectItemIndicator = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            ...itemIndicatorProps
          } = props;
          const itemContext = useSelectItemContext(ITEM_INDICATOR_NAME$1, __scopeSelect);
          return itemContext.isSelected ? /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.span, {
            "aria-hidden": true,
            ...itemIndicatorProps,
            ref: forwardedRef
          }) : null;
        });
        SelectItemIndicator.displayName = ITEM_INDICATOR_NAME$1;
        var SCROLL_UP_BUTTON_NAME = "SelectScrollUpButton";
        var SelectScrollUpButton$1 = reactExports.forwardRef((props, forwardedRef) => {
          const contentContext = useSelectContentContext(SCROLL_UP_BUTTON_NAME, props.__scopeSelect);
          const viewportContext = useSelectViewportContext(SCROLL_UP_BUTTON_NAME, props.__scopeSelect);
          const [canScrollUp, setCanScrollUp] = reactExports.useState(false);
          const composedRefs = useComposedRefs(forwardedRef, viewportContext.onScrollButtonChange);
          useLayoutEffect2(() => {
            if (contentContext.viewport && contentContext.isPositioned) {
              let handleScroll2 = function () {
                const canScrollUp2 = viewport.scrollTop > 0;
                setCanScrollUp(canScrollUp2);
              };
              const viewport = contentContext.viewport;
              handleScroll2();
              viewport.addEventListener("scroll", handleScroll2);
              return () => viewport.removeEventListener("scroll", handleScroll2);
            }
          }, [contentContext.viewport, contentContext.isPositioned]);
          return canScrollUp ? /* @__PURE__ */jsxRuntimeExports.jsx(SelectScrollButtonImpl, {
            ...props,
            ref: composedRefs,
            onAutoScroll: () => {
              const {
                viewport,
                selectedItem
              } = contentContext;
              if (viewport && selectedItem) {
                viewport.scrollTop = viewport.scrollTop - selectedItem.offsetHeight;
              }
            }
          }) : null;
        });
        SelectScrollUpButton$1.displayName = SCROLL_UP_BUTTON_NAME;
        var SCROLL_DOWN_BUTTON_NAME = "SelectScrollDownButton";
        var SelectScrollDownButton$1 = reactExports.forwardRef((props, forwardedRef) => {
          const contentContext = useSelectContentContext(SCROLL_DOWN_BUTTON_NAME, props.__scopeSelect);
          const viewportContext = useSelectViewportContext(SCROLL_DOWN_BUTTON_NAME, props.__scopeSelect);
          const [canScrollDown, setCanScrollDown] = reactExports.useState(false);
          const composedRefs = useComposedRefs(forwardedRef, viewportContext.onScrollButtonChange);
          useLayoutEffect2(() => {
            if (contentContext.viewport && contentContext.isPositioned) {
              let handleScroll2 = function () {
                const maxScroll = viewport.scrollHeight - viewport.clientHeight;
                const canScrollDown2 = Math.ceil(viewport.scrollTop) < maxScroll;
                setCanScrollDown(canScrollDown2);
              };
              const viewport = contentContext.viewport;
              handleScroll2();
              viewport.addEventListener("scroll", handleScroll2);
              return () => viewport.removeEventListener("scroll", handleScroll2);
            }
          }, [contentContext.viewport, contentContext.isPositioned]);
          return canScrollDown ? /* @__PURE__ */jsxRuntimeExports.jsx(SelectScrollButtonImpl, {
            ...props,
            ref: composedRefs,
            onAutoScroll: () => {
              const {
                viewport,
                selectedItem
              } = contentContext;
              if (viewport && selectedItem) {
                viewport.scrollTop = viewport.scrollTop + selectedItem.offsetHeight;
              }
            }
          }) : null;
        });
        SelectScrollDownButton$1.displayName = SCROLL_DOWN_BUTTON_NAME;
        var SelectScrollButtonImpl = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            onAutoScroll,
            ...scrollIndicatorProps
          } = props;
          const contentContext = useSelectContentContext("SelectScrollButton", __scopeSelect);
          const autoScrollTimerRef = reactExports.useRef(null);
          const getItems = useCollection$2(__scopeSelect);
          const clearAutoScrollTimer = reactExports.useCallback(() => {
            if (autoScrollTimerRef.current !== null) {
              window.clearInterval(autoScrollTimerRef.current);
              autoScrollTimerRef.current = null;
            }
          }, []);
          reactExports.useEffect(() => {
            return () => clearAutoScrollTimer();
          }, [clearAutoScrollTimer]);
          useLayoutEffect2(() => {
            const activeItem = getItems().find(item => item.ref.current === document.activeElement);
            activeItem?.ref.current?.scrollIntoView({
              block: "nearest"
            });
          }, [getItems]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            "aria-hidden": true,
            ...scrollIndicatorProps,
            ref: forwardedRef,
            style: {
              flexShrink: 0,
              ...scrollIndicatorProps.style
            },
            onPointerDown: composeEventHandlers(scrollIndicatorProps.onPointerDown, () => {
              if (autoScrollTimerRef.current === null) {
                autoScrollTimerRef.current = window.setInterval(onAutoScroll, 50);
              }
            }),
            onPointerMove: composeEventHandlers(scrollIndicatorProps.onPointerMove, () => {
              contentContext.onItemLeave?.();
              if (autoScrollTimerRef.current === null) {
                autoScrollTimerRef.current = window.setInterval(onAutoScroll, 50);
              }
            }),
            onPointerLeave: composeEventHandlers(scrollIndicatorProps.onPointerLeave, () => {
              clearAutoScrollTimer();
            })
          });
        });
        var SEPARATOR_NAME$2 = "SelectSeparator";
        var SelectSeparator$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            ...separatorProps
          } = props;
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            "aria-hidden": true,
            ...separatorProps,
            ref: forwardedRef
          });
        });
        SelectSeparator$1.displayName = SEPARATOR_NAME$2;
        var ARROW_NAME$3 = "SelectArrow";
        var SelectArrow = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSelect,
            ...arrowProps
          } = props;
          const popperScope = usePopperScope$2(__scopeSelect);
          const context = useSelectContext(ARROW_NAME$3, __scopeSelect);
          const contentContext = useSelectContentContext(ARROW_NAME$3, __scopeSelect);
          return context.open && contentContext.position === "popper" ? /* @__PURE__ */jsxRuntimeExports.jsx(Arrow, {
            ...popperScope,
            ...arrowProps,
            ref: forwardedRef
          }) : null;
        });
        SelectArrow.displayName = ARROW_NAME$3;
        var BUBBLE_INPUT_NAME$2 = "SelectBubbleInput";
        var SelectBubbleInput = reactExports.forwardRef(({
          __scopeSelect,
          value,
          ...props
        }, forwardedRef) => {
          const ref = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, ref);
          const prevValue = usePrevious(value);
          reactExports.useEffect(() => {
            const select = ref.current;
            if (!select) return;
            const selectProto = window.HTMLSelectElement.prototype;
            const descriptor = Object.getOwnPropertyDescriptor(selectProto, "value");
            const setValue = descriptor.set;
            if (prevValue !== value && setValue) {
              const event = new Event("change", {
                bubbles: true
              });
              setValue.call(select, value);
              select.dispatchEvent(event);
            }
          }, [prevValue, value]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.select, {
            ...props,
            style: {
              ...VISUALLY_HIDDEN_STYLES,
              ...props.style
            },
            ref: composedRefs,
            defaultValue: value
          });
        });
        SelectBubbleInput.displayName = BUBBLE_INPUT_NAME$2;
        function shouldShowPlaceholder(value) {
          return value === "" || value === void 0;
        }
        function useTypeaheadSearch(onSearchChange) {
          const handleSearchChange = useCallbackRef$1(onSearchChange);
          const searchRef = reactExports.useRef("");
          const timerRef = reactExports.useRef(0);
          const handleTypeaheadSearch = reactExports.useCallback(key => {
            const search = searchRef.current + key;
            handleSearchChange(search);
            (function updateSearch(value) {
              searchRef.current = value;
              window.clearTimeout(timerRef.current);
              if (value !== "") timerRef.current = window.setTimeout(() => updateSearch(""), 1e3);
            })(search);
          }, [handleSearchChange]);
          const resetTypeahead = reactExports.useCallback(() => {
            searchRef.current = "";
            window.clearTimeout(timerRef.current);
          }, []);
          reactExports.useEffect(() => {
            return () => window.clearTimeout(timerRef.current);
          }, []);
          return [searchRef, handleTypeaheadSearch, resetTypeahead];
        }
        function findNextItem(items, search, currentItem) {
          const isRepeated = search.length > 1 && Array.from(search).every(char => char === search[0]);
          const normalizedSearch = isRepeated ? search[0] : search;
          const currentItemIndex = currentItem ? items.indexOf(currentItem) : -1;
          let wrappedItems = wrapArray$2(items, Math.max(currentItemIndex, 0));
          const excludeCurrentItem = normalizedSearch.length === 1;
          if (excludeCurrentItem) wrappedItems = wrappedItems.filter(v => v !== currentItem);
          const nextItem = wrappedItems.find(item => item.textValue.toLowerCase().startsWith(normalizedSearch.toLowerCase()));
          return nextItem !== currentItem ? nextItem : void 0;
        }
        function wrapArray$2(array, startIndex) {
          return array.map((_, index) => array[(startIndex + index) % array.length]);
        }
        var Root2$3 = Select$1;
        var Trigger$4 = SelectTrigger$1;
        var Value = SelectValue$1;
        var Icon = SelectIcon;
        var Portal$3 = SelectPortal;
        var Content2$3 = SelectContent$1;
        var Viewport = SelectViewport;
        var Label$3 = SelectLabel$1;
        var Item$1 = SelectItem$1;
        var ItemText = SelectItemText;
        var ItemIndicator$1 = SelectItemIndicator;
        var ScrollUpButton = SelectScrollUpButton$1;
        var ScrollDownButton = SelectScrollDownButton$1;
        var Separator$3 = SelectSeparator$1;
        const Select = exports("S", Root2$3);
        const SelectValue = exports("b", Value);
        const SelectTrigger = exports("a", reactExports.forwardRef(({
          className,
          children,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsxs(Trigger$4, {
          ref,
          className: cn("flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
          ...props,
          children: [children, /* @__PURE__ */jsxRuntimeExports.jsx(Icon, {
            asChild: true,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(ChevronDown, {
              className: "h-4 w-4 opacity-50"
            })
          })]
        })));
        SelectTrigger.displayName = Trigger$4.displayName;
        const SelectScrollUpButton = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(ScrollUpButton, {
          ref,
          className: cn("flex cursor-default items-center justify-center py-1", className),
          ...props,
          children: /* @__PURE__ */jsxRuntimeExports.jsx(ChevronUp, {
            className: "h-4 w-4"
          })
        }));
        SelectScrollUpButton.displayName = ScrollUpButton.displayName;
        const SelectScrollDownButton = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(ScrollDownButton, {
          ref,
          className: cn("flex cursor-default items-center justify-center py-1", className),
          ...props,
          children: /* @__PURE__ */jsxRuntimeExports.jsx(ChevronDown, {
            className: "h-4 w-4"
          })
        }));
        SelectScrollDownButton.displayName = ScrollDownButton.displayName;
        const SelectContent = exports("d", reactExports.forwardRef(({
          className,
          children,
          position = "popper",
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Portal$3, {
          children: /* @__PURE__ */jsxRuntimeExports.jsxs(Content2$3, {
            ref,
            className: cn("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-900 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
            position,
            ...props,
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(SelectScrollUpButton, {}), /* @__PURE__ */jsxRuntimeExports.jsx(Viewport, {
              className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
              children
            }), /* @__PURE__ */jsxRuntimeExports.jsx(SelectScrollDownButton, {})]
          })
        })));
        SelectContent.displayName = Content2$3.displayName;
        const SelectLabel = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Label$3, {
          ref,
          className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className),
          ...props
        }));
        SelectLabel.displayName = Label$3.displayName;
        const SelectItem = exports("e", reactExports.forwardRef(({
          className,
          children,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsxs(Item$1, {
          ref,
          className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
          ...props,
          children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
            className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
            children: /* @__PURE__ */jsxRuntimeExports.jsx(ItemIndicator$1, {
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Check, {
                className: "h-4 w-4"
              })
            })
          }), /* @__PURE__ */jsxRuntimeExports.jsx(ItemText, {
            children
          })]
        })));
        SelectItem.displayName = Item$1.displayName;
        const SelectSeparator = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Separator$3, {
          ref,
          className: cn("-mx-1 my-1 h-px bg-gray-100", className),
          ...props
        }));
        SelectSeparator.displayName = Separator$3.displayName;
        function useStateMachine(initialState, machine) {
          return reactExports.useReducer((state, event) => {
            const nextState = machine[state][event];
            return nextState ?? state;
          }, initialState);
        }

        // src/presence.tsx
        var Presence = props => {
          const {
            present,
            children
          } = props;
          const presence = usePresence(present);
          const child = typeof children === "function" ? children({
            present: presence.isPresent
          }) : reactExports.Children.only(children);
          const ref = useComposedRefs(presence.ref, getElementRef$3(child));
          const forceMount = typeof children === "function";
          return forceMount || presence.isPresent ? reactExports.cloneElement(child, {
            ref
          }) : null;
        };
        Presence.displayName = "Presence";
        function usePresence(present) {
          const [node, setNode] = reactExports.useState();
          const stylesRef = reactExports.useRef(null);
          const prevPresentRef = reactExports.useRef(present);
          const prevAnimationNameRef = reactExports.useRef("none");
          const initialState = present ? "mounted" : "unmounted";
          const [state, send] = useStateMachine(initialState, {
            mounted: {
              UNMOUNT: "unmounted",
              ANIMATION_OUT: "unmountSuspended"
            },
            unmountSuspended: {
              MOUNT: "mounted",
              ANIMATION_END: "unmounted"
            },
            unmounted: {
              MOUNT: "mounted"
            }
          });
          reactExports.useEffect(() => {
            const currentAnimationName = getAnimationName(stylesRef.current);
            prevAnimationNameRef.current = state === "mounted" ? currentAnimationName : "none";
          }, [state]);
          useLayoutEffect2(() => {
            const styles = stylesRef.current;
            const wasPresent = prevPresentRef.current;
            const hasPresentChanged = wasPresent !== present;
            if (hasPresentChanged) {
              const prevAnimationName = prevAnimationNameRef.current;
              const currentAnimationName = getAnimationName(styles);
              if (present) {
                send("MOUNT");
              } else if (currentAnimationName === "none" || styles?.display === "none") {
                send("UNMOUNT");
              } else {
                const isAnimating = prevAnimationName !== currentAnimationName;
                if (wasPresent && isAnimating) {
                  send("ANIMATION_OUT");
                } else {
                  send("UNMOUNT");
                }
              }
              prevPresentRef.current = present;
            }
          }, [present, send]);
          useLayoutEffect2(() => {
            if (node) {
              let timeoutId;
              const ownerWindow = node.ownerDocument.defaultView ?? window;
              const handleAnimationEnd = event => {
                const currentAnimationName = getAnimationName(stylesRef.current);
                const isCurrentAnimation = currentAnimationName.includes(CSS.escape(event.animationName));
                if (event.target === node && isCurrentAnimation) {
                  send("ANIMATION_END");
                  if (!prevPresentRef.current) {
                    const currentFillMode = node.style.animationFillMode;
                    node.style.animationFillMode = "forwards";
                    timeoutId = ownerWindow.setTimeout(() => {
                      if (node.style.animationFillMode === "forwards") {
                        node.style.animationFillMode = currentFillMode;
                      }
                    });
                  }
                }
              };
              const handleAnimationStart = event => {
                if (event.target === node) {
                  prevAnimationNameRef.current = getAnimationName(stylesRef.current);
                }
              };
              node.addEventListener("animationstart", handleAnimationStart);
              node.addEventListener("animationcancel", handleAnimationEnd);
              node.addEventListener("animationend", handleAnimationEnd);
              return () => {
                ownerWindow.clearTimeout(timeoutId);
                node.removeEventListener("animationstart", handleAnimationStart);
                node.removeEventListener("animationcancel", handleAnimationEnd);
                node.removeEventListener("animationend", handleAnimationEnd);
              };
            } else {
              send("ANIMATION_END");
            }
          }, [node, send]);
          return {
            isPresent: ["mounted", "unmountSuspended"].includes(state),
            ref: reactExports.useCallback(node2 => {
              stylesRef.current = node2 ? getComputedStyle(node2) : null;
              setNode(node2);
            }, [])
          };
        }
        function getAnimationName(styles) {
          return styles?.animationName || "none";
        }
        function getElementRef$3(element) {
          let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
          let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.ref;
          }
          getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
          mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.props.ref;
          }
          return element.props.ref || element.ref;
        }

        // src/slot.tsx
        // @__NO_SIDE_EFFECTS__
        function createSlot$2(ownerName) {
          const SlotClone = /* @__PURE__ */createSlotClone$2(ownerName);
          const Slot2 = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            const childrenArray = reactExports.Children.toArray(children);
            const slottable = childrenArray.find(isSlottable$2);
            if (slottable) {
              const newElement = slottable.props.children;
              const newChildren = childrenArray.map(child => {
                if (child === slottable) {
                  if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
                  return reactExports.isValidElement(newElement) ? newElement.props.children : null;
                } else {
                  return child;
                }
              });
              return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
                ...slotProps,
                ref: forwardedRef,
                children: reactExports.isValidElement(newElement) ? reactExports.cloneElement(newElement, void 0, newChildren) : null
              });
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
              ...slotProps,
              ref: forwardedRef,
              children
            });
          });
          Slot2.displayName = `${ownerName}.Slot`;
          return Slot2;
        }
        // @__NO_SIDE_EFFECTS__
        function createSlotClone$2(ownerName) {
          const SlotClone = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            if (reactExports.isValidElement(children)) {
              const childrenRef = getElementRef$2(children);
              const props2 = mergeProps$2(slotProps, children.props);
              if (children.type !== reactExports.Fragment) {
                props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
              }
              return reactExports.cloneElement(children, props2);
            }
            return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
          });
          SlotClone.displayName = `${ownerName}.SlotClone`;
          return SlotClone;
        }
        var SLOTTABLE_IDENTIFIER$2 = Symbol("radix.slottable");
        function isSlottable$2(child) {
          return reactExports.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER$2;
        }
        function mergeProps$2(slotProps, childProps) {
          const overrideProps = {
            ...childProps
          };
          for (const propName in childProps) {
            const slotPropValue = slotProps[propName];
            const childPropValue = childProps[propName];
            const isHandler = /^on[A-Z]/.test(propName);
            if (isHandler) {
              if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args) => {
                  const result = childPropValue(...args);
                  slotPropValue(...args);
                  return result;
                };
              } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
              }
            } else if (propName === "style") {
              overrideProps[propName] = {
                ...slotPropValue,
                ...childPropValue
              };
            } else if (propName === "className") {
              overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
            }
          }
          return {
            ...slotProps,
            ...overrideProps
          };
        }
        function getElementRef$2(element) {
          let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
          let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.ref;
          }
          getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
          mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.props.ref;
          }
          return element.props.ref || element.ref;
        }
        var DIALOG_NAME = "Dialog";
        var [createDialogContext] = createContextScope$1(DIALOG_NAME);
        var [DialogProvider, useDialogContext] = createDialogContext(DIALOG_NAME);
        var Dialog$1 = props => {
          const {
            __scopeDialog,
            children,
            open: openProp,
            defaultOpen,
            onOpenChange,
            modal = true
          } = props;
          const triggerRef = reactExports.useRef(null);
          const contentRef = reactExports.useRef(null);
          const [open, setOpen] = useControllableState({
            prop: openProp,
            defaultProp: defaultOpen ?? false,
            onChange: onOpenChange,
            caller: DIALOG_NAME
          });
          return /* @__PURE__ */jsxRuntimeExports.jsx(DialogProvider, {
            scope: __scopeDialog,
            triggerRef,
            contentRef,
            contentId: useId(),
            titleId: useId(),
            descriptionId: useId(),
            open,
            onOpenChange: setOpen,
            onOpenToggle: reactExports.useCallback(() => setOpen(prevOpen => !prevOpen), [setOpen]),
            modal,
            children
          });
        };
        Dialog$1.displayName = DIALOG_NAME;
        var TRIGGER_NAME$4 = "DialogTrigger";
        var DialogTrigger$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDialog,
            ...triggerProps
          } = props;
          const context = useDialogContext(TRIGGER_NAME$4, __scopeDialog);
          const composedTriggerRef = useComposedRefs(forwardedRef, context.triggerRef);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.button, {
            type: "button",
            "aria-haspopup": "dialog",
            "aria-expanded": context.open,
            "aria-controls": context.contentId,
            "data-state": getState$3(context.open),
            ...triggerProps,
            ref: composedTriggerRef,
            onClick: composeEventHandlers(props.onClick, context.onOpenToggle)
          });
        });
        DialogTrigger$1.displayName = TRIGGER_NAME$4;
        var PORTAL_NAME$3 = "DialogPortal";
        var [PortalProvider$2, usePortalContext$2] = createDialogContext(PORTAL_NAME$3, {
          forceMount: void 0
        });
        var DialogPortal$1 = props => {
          const {
            __scopeDialog,
            forceMount,
            children,
            container
          } = props;
          const context = useDialogContext(PORTAL_NAME$3, __scopeDialog);
          return /* @__PURE__ */jsxRuntimeExports.jsx(PortalProvider$2, {
            scope: __scopeDialog,
            forceMount,
            children: reactExports.Children.map(children, child => /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
              present: forceMount || context.open,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Portal$4, {
                asChild: true,
                container,
                children: child
              })
            }))
          });
        };
        DialogPortal$1.displayName = PORTAL_NAME$3;
        var OVERLAY_NAME = "DialogOverlay";
        var DialogOverlay$1 = reactExports.forwardRef((props, forwardedRef) => {
          const portalContext = usePortalContext$2(OVERLAY_NAME, props.__scopeDialog);
          const {
            forceMount = portalContext.forceMount,
            ...overlayProps
          } = props;
          const context = useDialogContext(OVERLAY_NAME, props.__scopeDialog);
          return context.modal ? /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
            present: forceMount || context.open,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(DialogOverlayImpl, {
              ...overlayProps,
              ref: forwardedRef
            })
          }) : null;
        });
        DialogOverlay$1.displayName = OVERLAY_NAME;
        var Slot$2 = createSlot$2("DialogOverlay.RemoveScroll");
        var DialogOverlayImpl = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDialog,
            ...overlayProps
          } = props;
          const context = useDialogContext(OVERLAY_NAME, __scopeDialog);
          return (
            // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
            // ie. when `Overlay` and `Content` are siblings
            /* @__PURE__ */
            jsxRuntimeExports.jsx(ReactRemoveScroll, {
              as: Slot$2,
              allowPinchZoom: true,
              shards: [context.contentRef],
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
                "data-state": getState$3(context.open),
                ...overlayProps,
                ref: forwardedRef,
                style: {
                  pointerEvents: "auto",
                  ...overlayProps.style
                }
              })
            })
          );
        });
        var CONTENT_NAME$4 = "DialogContent";
        var DialogContent$1 = reactExports.forwardRef((props, forwardedRef) => {
          const portalContext = usePortalContext$2(CONTENT_NAME$4, props.__scopeDialog);
          const {
            forceMount = portalContext.forceMount,
            ...contentProps
          } = props;
          const context = useDialogContext(CONTENT_NAME$4, props.__scopeDialog);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
            present: forceMount || context.open,
            children: context.modal ? /* @__PURE__ */jsxRuntimeExports.jsx(DialogContentModal, {
              ...contentProps,
              ref: forwardedRef
            }) : /* @__PURE__ */jsxRuntimeExports.jsx(DialogContentNonModal, {
              ...contentProps,
              ref: forwardedRef
            })
          });
        });
        DialogContent$1.displayName = CONTENT_NAME$4;
        var DialogContentModal = reactExports.forwardRef((props, forwardedRef) => {
          const context = useDialogContext(CONTENT_NAME$4, props.__scopeDialog);
          const contentRef = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, context.contentRef, contentRef);
          reactExports.useEffect(() => {
            const content = contentRef.current;
            if (content) return hideOthers(content);
          }, []);
          return /* @__PURE__ */jsxRuntimeExports.jsx(DialogContentImpl, {
            ...props,
            ref: composedRefs,
            trapFocus: context.open,
            disableOutsidePointerEvents: true,
            onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, event => {
              event.preventDefault();
              context.triggerRef.current?.focus();
            }),
            onPointerDownOutside: composeEventHandlers(props.onPointerDownOutside, event => {
              const originalEvent = event.detail.originalEvent;
              const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
              const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
              if (isRightClick) event.preventDefault();
            }),
            onFocusOutside: composeEventHandlers(props.onFocusOutside, event => event.preventDefault())
          });
        });
        var DialogContentNonModal = reactExports.forwardRef((props, forwardedRef) => {
          const context = useDialogContext(CONTENT_NAME$4, props.__scopeDialog);
          const hasInteractedOutsideRef = reactExports.useRef(false);
          const hasPointerDownOutsideRef = reactExports.useRef(false);
          return /* @__PURE__ */jsxRuntimeExports.jsx(DialogContentImpl, {
            ...props,
            ref: forwardedRef,
            trapFocus: false,
            disableOutsidePointerEvents: false,
            onCloseAutoFocus: event => {
              props.onCloseAutoFocus?.(event);
              if (!event.defaultPrevented) {
                if (!hasInteractedOutsideRef.current) context.triggerRef.current?.focus();
                event.preventDefault();
              }
              hasInteractedOutsideRef.current = false;
              hasPointerDownOutsideRef.current = false;
            },
            onInteractOutside: event => {
              props.onInteractOutside?.(event);
              if (!event.defaultPrevented) {
                hasInteractedOutsideRef.current = true;
                if (event.detail.originalEvent.type === "pointerdown") {
                  hasPointerDownOutsideRef.current = true;
                }
              }
              const target = event.target;
              const targetIsTrigger = context.triggerRef.current?.contains(target);
              if (targetIsTrigger) event.preventDefault();
              if (event.detail.originalEvent.type === "focusin" && hasPointerDownOutsideRef.current) {
                event.preventDefault();
              }
            }
          });
        });
        var DialogContentImpl = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDialog,
            trapFocus,
            onOpenAutoFocus,
            onCloseAutoFocus,
            ...contentProps
          } = props;
          const context = useDialogContext(CONTENT_NAME$4, __scopeDialog);
          const contentRef = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, contentRef);
          useFocusGuards();
          return /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(FocusScope, {
              asChild: true,
              loop: true,
              trapped: trapFocus,
              onMountAutoFocus: onOpenAutoFocus,
              onUnmountAutoFocus: onCloseAutoFocus,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(DismissableLayer, {
                role: "dialog",
                id: context.contentId,
                "aria-describedby": context.descriptionId,
                "aria-labelledby": context.titleId,
                "data-state": getState$3(context.open),
                ...contentProps,
                ref: composedRefs,
                onDismiss: () => context.onOpenChange(false)
              })
            }), /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(TitleWarning, {
                titleId: context.titleId
              }), /* @__PURE__ */jsxRuntimeExports.jsx(DescriptionWarning, {
                contentRef,
                descriptionId: context.descriptionId
              })]
            })]
          });
        });
        var TITLE_NAME = "DialogTitle";
        var DialogTitle$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDialog,
            ...titleProps
          } = props;
          const context = useDialogContext(TITLE_NAME, __scopeDialog);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.h2, {
            id: context.titleId,
            ...titleProps,
            ref: forwardedRef
          });
        });
        DialogTitle$1.displayName = TITLE_NAME;
        var DESCRIPTION_NAME = "DialogDescription";
        var DialogDescription$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDialog,
            ...descriptionProps
          } = props;
          const context = useDialogContext(DESCRIPTION_NAME, __scopeDialog);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.p, {
            id: context.descriptionId,
            ...descriptionProps,
            ref: forwardedRef
          });
        });
        DialogDescription$1.displayName = DESCRIPTION_NAME;
        var CLOSE_NAME$1 = "DialogClose";
        var DialogClose = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDialog,
            ...closeProps
          } = props;
          const context = useDialogContext(CLOSE_NAME$1, __scopeDialog);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.button, {
            type: "button",
            ...closeProps,
            ref: forwardedRef,
            onClick: composeEventHandlers(props.onClick, () => context.onOpenChange(false))
          });
        });
        DialogClose.displayName = CLOSE_NAME$1;
        function getState$3(open) {
          return open ? "open" : "closed";
        }
        var TITLE_WARNING_NAME = "DialogTitleWarning";
        var [WarningProvider, useWarningContext] = createContext2(TITLE_WARNING_NAME, {
          contentName: CONTENT_NAME$4,
          titleName: TITLE_NAME,
          docsSlug: "dialog"
        });
        var TitleWarning = ({
          titleId
        }) => {
          const titleWarningContext = useWarningContext(TITLE_WARNING_NAME);
          const MESSAGE = `\`${titleWarningContext.contentName}\` requires a \`${titleWarningContext.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${titleWarningContext.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${titleWarningContext.docsSlug}`;
          reactExports.useEffect(() => {
            if (titleId) {
              const hasTitle = document.getElementById(titleId);
              if (!hasTitle) console.error(MESSAGE);
            }
          }, [MESSAGE, titleId]);
          return null;
        };
        var DESCRIPTION_WARNING_NAME = "DialogDescriptionWarning";
        var DescriptionWarning = ({
          contentRef,
          descriptionId
        }) => {
          const descriptionWarningContext = useWarningContext(DESCRIPTION_WARNING_NAME);
          const MESSAGE = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${descriptionWarningContext.contentName}}.`;
          reactExports.useEffect(() => {
            const describedById = contentRef.current?.getAttribute("aria-describedby");
            if (descriptionId && describedById) {
              const hasDescription = document.getElementById(descriptionId);
              if (!hasDescription) console.warn(MESSAGE);
            }
          }, [MESSAGE, contentRef, descriptionId]);
          return null;
        };
        var Root$5 = Dialog$1;
        var Trigger$3 = DialogTrigger$1;
        var Portal$2 = DialogPortal$1;
        var Overlay = DialogOverlay$1;
        var Content$1 = DialogContent$1;
        var Title = DialogTitle$1;
        var Description = DialogDescription$1;
        var Close = DialogClose;
        const Dialog = exports("D", Root$5);
        const DialogTrigger = exports("a7", Trigger$3);
        const DialogPortal = Portal$2;
        const DialogOverlay = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Overlay, {
          ref,
          className: cn("fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
          ...props
        }));
        DialogOverlay.displayName = Overlay.displayName;
        const DialogContent = exports("l", reactExports.forwardRef(({
          className,
          children,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsxs(DialogPortal, {
          children: [/* @__PURE__ */jsxRuntimeExports.jsx(DialogOverlay, {}), /* @__PURE__ */jsxRuntimeExports.jsxs(Content$1, {
            ref,
            className: cn("fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] sm:w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-3 sm:gap-4 border border-gray-200 bg-white p-4 sm:p-6 shadow-lg duration-200 max-h-[90vh] overflow-y-auto momentum-scroll rounded-lg sm:rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]", className),
            ...props,
            children: [children, /* @__PURE__ */jsxRuntimeExports.jsxs(Close, {
              className: "absolute right-3 sm:right-4 top-3 sm:top-4 rounded-sm opacity-70 ring-offset-white transition-all hover:opacity-100 active:scale-90 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500 min-w-[44px] min-h-[44px] flex items-center justify-center",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(X, {
                className: "h-5 w-5 sm:h-4 sm:w-4"
              }), /* @__PURE__ */jsxRuntimeExports.jsx("span", {
                className: "sr-only",
                children: "Close"
              })]
            })]
          })]
        })));
        DialogContent.displayName = Content$1.displayName;
        const DialogHeader = exports("m", ({
          className,
          ...props
        }) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
          className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
          ...props
        }));
        DialogHeader.displayName = "DialogHeader";
        const DialogFooter = exports("O", ({
          className,
          ...props
        }) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
          className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
          ...props
        }));
        DialogFooter.displayName = "DialogFooter";
        const DialogTitle = exports("n", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Title, {
          ref,
          className: cn("text-base sm:text-lg font-semibold leading-tight sm:leading-none tracking-tight text-gray-900 pr-8", className),
          ...props
        })));
        DialogTitle.displayName = Title.displayName;
        const DialogDescription = exports("G", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Description, {
          ref,
          className: cn("text-xs sm:text-sm text-gray-500 leading-relaxed", className),
          ...props
        })));
        DialogDescription.displayName = Description.displayName;

        // src/primitive.tsx
        var NODES$2 = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"];
        var Primitive$2 = NODES$2.reduce((primitive, node) => {
          const Slot = createSlot$6(`Primitive.${node}`);
          const Node = reactExports.forwardRef((props, forwardedRef) => {
            const {
              asChild,
              ...primitiveProps
            } = props;
            const Comp = asChild ? Slot : node;
            if (typeof window !== "undefined") {
              window[Symbol.for("radix-ui")] = true;
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(Comp, {
              ...primitiveProps,
              ref: forwardedRef
            });
          });
          Node.displayName = `Primitive.${node}`;
          return {
            ...primitive,
            [node]: Node
          };
        }, {});
        var NAME$1 = "Label";
        var Label$2 = reactExports.forwardRef((props, forwardedRef) => {
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$2.label, {
            ...props,
            ref: forwardedRef,
            onMouseDown: event => {
              const target = event.target;
              if (target.closest("button, input, select, textarea")) return;
              props.onMouseDown?.(event);
              if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
            }
          });
        });
        Label$2.displayName = NAME$1;
        var Root$4 = Label$2;
        const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
        const Label$1 = exports("L", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Root$4, {
          ref,
          className: cn(labelVariants(), className),
          ...props
        })));
        Label$1.displayName = Root$4.displayName;
        const Textarea = exports("T", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => {
          return /* @__PURE__ */jsxRuntimeExports.jsx("textarea", {
            className: cn("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className),
            ref,
            ...props
          });
        }));
        Textarea.displayName = "Textarea";
        const Avatar = exports("A", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => {
          return /* @__PURE__ */jsxRuntimeExports.jsx("span", {
            ref,
            className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
            ...props
          });
        }));
        Avatar.displayName = "Avatar";
        const AvatarImage = exports("p", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => {
          return /* @__PURE__ */jsxRuntimeExports.jsx("img", {
            ref,
            className: cn("aspect-square h-full w-full object-cover", className),
            ...props
          });
        }));
        AvatarImage.displayName = "AvatarImage";
        const AvatarFallback = exports("q", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => {
          return /* @__PURE__ */jsxRuntimeExports.jsx("span", {
            ref,
            className: cn("flex h-full w-full items-center justify-center rounded-full bg-gray-100", className),
            ...props
          });
        }));
        AvatarFallback.displayName = "AvatarFallback";
        const DEFAULT_THEMES = exports("Y", [{
          id: "modern",
          name: "Modern",
          description: "Clean and contemporary design with blue accents",
          isPremium: false,
          colors: {
            primary: "#2563eb",
            secondary: "#10b981",
            accent: "#f59e0b",
            background: "#ffffff",
            foreground: "#1f2937",
            muted: "#9ca3af"
          },
          fonts: {
            heading: "Inter",
            body: "Inter"
          }
        }, {
          id: "classic",
          name: "Classic",
          description: "Traditional and timeless styling",
          isPremium: false,
          colors: {
            primary: "#1e40af",
            secondary: "#059669",
            accent: "#dc2626",
            background: "#f9fafb",
            foreground: "#111827",
            muted: "#6b7280"
          },
          fonts: {
            heading: "Georgia",
            body: "Georgia"
          }
        }, {
          id: "minimal",
          name: "Minimal",
          description: "Simple and elegant monochrome design",
          isPremium: false,
          colors: {
            primary: "#000000",
            secondary: "#6b7280",
            accent: "#000000",
            background: "#ffffff",
            foreground: "#374151",
            muted: "#9ca3af"
          },
          fonts: {
            heading: "Helvetica",
            body: "Helvetica"
          }
        }, {
          id: "bold",
          name: "Bold",
          description: "Vibrant and energetic color scheme",
          isPremium: true,
          colors: {
            primary: "#dc2626",
            secondary: "#f59e0b",
            accent: "#7c2d12",
            background: "#fef2f2",
            foreground: "#1f2937",
            muted: "#f87171"
          },
          fonts: {
            heading: "Montserrat",
            body: "Open Sans"
          }
        }, {
          id: "elegant",
          name: "Elegant",
          description: "Sophisticated purple and violet tones",
          isPremium: true,
          colors: {
            primary: "#6366f1",
            secondary: "#8b5cf6",
            accent: "#c026d3",
            background: "#faf5ff",
            foreground: "#1e1b4b",
            muted: "#a78bfa"
          },
          fonts: {
            heading: "Playfair Display",
            body: "Lora"
          }
        }, {
          id: "ocean",
          name: "Ocean",
          description: "Calming blue and cyan palette",
          isPremium: true,
          colors: {
            primary: "#0891b2",
            secondary: "#06b6d4",
            accent: "#0e7490",
            background: "#ecfeff",
            foreground: "#164e63",
            muted: "#67e8f9"
          },
          fonts: {
            heading: "Roboto",
            body: "Roboto"
          }
        }, {
          id: "cosmic",
          name: "Cosmic",
          description: "Futuristic theme with 3D particle effects",
          isPremium: true,
          has3D: true,
          threeDEffect: "3d-particles",
          colors: {
            primary: "#8b5cf6",
            secondary: "#a78bfa",
            accent: "#c084fc",
            background: "#0f172a",
            foreground: "#e2e8f0",
            muted: "#6366f1"
          },
          fonts: {
            heading: "Orbitron",
            body: "Rajdhani"
          }
        }, {
          id: "luxe",
          name: "Luxe",
          description: "Premium gradient mesh with 3D sphere animation",
          isPremium: true,
          has3D: true,
          threeDEffect: "3d-mesh",
          colors: {
            primary: "#fbbf24",
            secondary: "#f59e0b",
            accent: "#d97706",
            background: "#1e1b4b",
            foreground: "#fef3c7",
            muted: "#fde68a"
          },
          fonts: {
            heading: "Playfair Display",
            body: "Crimson Pro"
          }
        }, {
          id: "neon",
          name: "Neon",
          description: "Vibrant theme with floating 3D geometry",
          isPremium: true,
          has3D: true,
          threeDEffect: "3d-floating",
          colors: {
            primary: "#ec4899",
            secondary: "#f472b6",
            accent: "#fb7185",
            background: "#18181b",
            foreground: "#fce7f3",
            muted: "#f9a8d4"
          },
          fonts: {
            heading: "Bungee",
            body: "Exo 2"
          }
        }, {
          id: "royal",
          name: "Royal",
          description: "Regal purple and gold with animated particles",
          isPremium: true,
          has3D: true,
          threeDEffect: "3d-particles",
          colors: {
            primary: "#7c3aed",
            secondary: "#a855f7",
            accent: "#fbbf24",
            background: "#1e1b4b",
            foreground: "#f3e8ff",
            muted: "#c4b5fd"
          },
          fonts: {
            heading: "Cinzel",
            body: "Cormorant Garamond"
          }
        }, {
          id: "aurora",
          name: "Aurora",
          description: "Northern lights inspired with gradient mesh",
          isPremium: true,
          has3D: true,
          threeDEffect: "3d-mesh",
          colors: {
            primary: "#10b981",
            secondary: "#34d399",
            accent: "#6ee7b7",
            background: "#0c4a6e",
            foreground: "#ecfdf5",
            muted: "#6ee7b7"
          },
          fonts: {
            heading: "Quicksand",
            body: "Nunito"
          }
        }]);
        const hexToHSL = hex => {
          const color = hex.replace("#", "");
          const r = parseInt(color.substring(0, 2), 16) / 255;
          const g = parseInt(color.substring(2, 4), 16) / 255;
          const b = parseInt(color.substring(4, 6), 16) / 255;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let h = 0;
          let s = 0;
          const l = (max + min) / 2;
          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
              case g:
                h = ((b - r) / d + 2) / 6;
                break;
              case b:
                h = ((r - g) / d + 4) / 6;
                break;
            }
          }
          return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
        };
        const applyTheme = exports("s", themeData => {
          if (!themeData) return;
          try {
            let theme;
            if (typeof themeData === "string") {
              theme = JSON.parse(themeData);
            } else {
              theme = themeData;
            }
            const root = document.documentElement;
            if (theme.colors) {
              const primaryColor = theme.colors.primary;
              const secondaryColor = theme.colors.secondary;
              const bgColor = theme.colors.background;
              const textColor = theme.colors.text || theme.colors.foreground;
              const accentColor = theme.colors.accent;
              if (primaryColor) root.style.setProperty("--theme-primary", hexToHSL(primaryColor));
              if (secondaryColor) root.style.setProperty("--theme-secondary", hexToHSL(secondaryColor));
              if (bgColor) root.style.setProperty("--theme-background", hexToHSL(bgColor));
              if (textColor) root.style.setProperty("--theme-text", hexToHSL(textColor));
              if (accentColor) root.style.setProperty("--theme-accent", hexToHSL(accentColor));
            }
            if (theme.fonts) {
              root.style.setProperty("--theme-font-heading", theme.fonts.heading);
              root.style.setProperty("--theme-font-body", theme.fonts.body);
              document.body.style.fontFamily = `${theme.fonts.body}, sans-serif`;
            }
            if (theme.borderRadius) {
              const borderRadiusMap = {
                none: "0",
                small: "0.25rem",
                medium: "0.5rem",
                large: "1rem",
                full: "9999px"
              };
              root.style.setProperty("--theme-border-radius", borderRadiusMap[theme.borderRadius] || "0.5rem");
            }
            if (theme.spacing) {
              const spacingMap = {
                compact: "0.5rem",
                normal: "1rem",
                spacious: "2rem"
              };
              root.style.setProperty("--theme-spacing", spacingMap[theme.spacing] || "1rem");
            }
          } catch (error) {
            console.error("Failed to apply theme:", error);
          }
        });
        const getCurrentTheme = exports("X", presetName => {
          const modern = DEFAULT_THEMES.find(t => t.id === "modern") || DEFAULT_THEMES[0];
          return modern;
        });
        const PasswordStrengthIndicator = exports("P", ({
          password
        }) => {
          const getPasswordStrength = pwd => {
            let strength2 = 0;
            if (pwd.length === 0) return 0;
            if (pwd.length < 12) return 0;
            if (pwd.length >= 12) strength2++;
            if (pwd.length >= 14) strength2++;
            if (pwd.length >= 16) strength2++;
            if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength2++;
            if (/\d/.test(pwd)) strength2++;
            if (/[^a-zA-Z\d]/.test(pwd)) strength2++;
            return Math.min(strength2, 5);
          };
          const strength = getPasswordStrength(password);
          const passwordTooShort = password.length > 0 && password.length < 12;
          const getStrengthLabel = str => {
            if (str === 0) return "";
            if (str <= 2) return "Weak";
            if (str === 3) return "Fair";
            if (str === 4) return "Good";
            return "Strong";
          };
          const getStrengthColor = str => {
            if (str <= 2) return "bg-red-500";
            if (str === 3) return "bg-yellow-500";
            if (str === 4) return "bg-blue-500";
            return "bg-green-500";
          };
          if (!password) return null;
          return /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
            className: "mt-2",
            children: [passwordTooShort && /* @__PURE__ */jsxRuntimeExports.jsx("p", {
              className: "text-xs text-red-600 font-medium mb-2",
              children: "⚠ Password must be at least 12 characters"
            }), /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "flex gap-1",
              children: [...Array(5)].map((_, i) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: `h-1.5 flex-1 rounded-full transition-all ${i < strength ? getStrengthColor(strength) : "bg-gray-200"}`
              }, i))
            }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
              className: "flex items-center justify-between mt-2",
              children: [/* @__PURE__ */jsxRuntimeExports.jsx("p", {
                className: `text-xs font-medium ${strength <= 2 ? "text-red-600" : strength === 3 ? "text-yellow-600" : strength === 4 ? "text-blue-600" : "text-green-600"}`,
                children: getStrengthLabel(strength)
              }), /* @__PURE__ */jsxRuntimeExports.jsxs("p", {
                className: "text-xs text-muted-foreground",
                children: [strength < 3 && "Try adding uppercase, numbers, and symbols", strength === 3 && "Add special characters for better security", strength >= 4 && "Great password!"]
              })]
            })]
          });
        });
        class ErrorBoundary extends reactExports.Component {
          state = {
            hasError: false,
            error: null,
            errorInfo: null
          };
          static getDerivedStateFromError(error) {
            return {
              hasError: true,
              error,
              errorInfo: null
            };
          }
          componentDidCatch(error, errorInfo) {
            console.error("Uncaught error:", error, errorInfo);
            this.setState({
              error,
              errorInfo
            });
          }
          handleReset = () => {
            this.setState({
              hasError: false,
              error: null,
              errorInfo: null
            });
          };
          render() {
            if (this.state.hasError) {
              if (this.props.fallback) {
                return this.props.fallback;
              }
              return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
                className: "min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                  className: "max-w-lg w-full bg-white rounded-lg shadow-lg p-8",
                  children: [/* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center gap-3 mb-6",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsx("div", {
                      className: "p-3 bg-red-100 rounded-full",
                      children: /* @__PURE__ */jsxRuntimeExports.jsx(CircleAlert, {
                        className: "h-8 w-8 text-red-600"
                      })
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx("h1", {
                        className: "text-2xl font-bold text-gray-900",
                        children: "Oops! Something went wrong"
                      }), /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                        className: "text-gray-600",
                        children: "We're sorry for the inconvenience"
                      })]
                    })]
                  }), false, /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                    className: "flex flex-col sm:flex-row gap-3",
                    children: [/* @__PURE__ */jsxRuntimeExports.jsxs("button", {
                      onClick: this.handleReset,
                      className: "flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(RefreshCcw, {
                        className: "h-5 w-5"
                      }), "Try Again"]
                    }), /* @__PURE__ */jsxRuntimeExports.jsxs("a", {
                      href: "/",
                      className: "flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors",
                      children: [/* @__PURE__ */jsxRuntimeExports.jsx(Home, {
                        className: "h-5 w-5"
                      }), "Go Home"]
                    })]
                  })]
                })
              });
            }
            return this.props.children;
          }
        }
        exports("E", ErrorBoundary);
        const sizeClasses = {
          sm: "h-4 w-4",
          md: "h-8 w-8",
          lg: "h-12 w-12",
          xl: "h-16 w-16"
        };
        function LoadingSpinner({
          size = "md",
          className,
          fullScreen = false
        }) {
          const spinner = /* @__PURE__ */jsxRuntimeExports.jsx(LoaderCircle, {
            className: cn("animate-spin text-blue-600", sizeClasses[size], className)
          });
          if (fullScreen) {
            return /* @__PURE__ */jsxRuntimeExports.jsx("div", {
              className: "fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50",
              children: /* @__PURE__ */jsxRuntimeExports.jsxs("div", {
                className: "text-center",
                children: [spinner, /* @__PURE__ */jsxRuntimeExports.jsx("p", {
                  className: "mt-4 text-gray-600 font-medium",
                  children: "Loading..."
                })]
              })
            });
          }
          return spinner;
        }

        // src/create-context.tsx
        function createContextScope(scopeName, createContextScopeDeps = []) {
          let defaultContexts = [];
          function createContext3(rootComponentName, defaultContext) {
            const BaseContext = reactExports.createContext(defaultContext);
            BaseContext.displayName = rootComponentName + "Context";
            const index = defaultContexts.length;
            defaultContexts = [...defaultContexts, defaultContext];
            const Provider = props => {
              const {
                scope,
                children,
                ...context
              } = props;
              const Context = scope?.[scopeName]?.[index] || BaseContext;
              const value = reactExports.useMemo(() => context, Object.values(context));
              return /* @__PURE__ */jsxRuntimeExports.jsx(Context.Provider, {
                value,
                children
              });
            };
            Provider.displayName = rootComponentName + "Provider";
            function useContext2(consumerName, scope) {
              const Context = scope?.[scopeName]?.[index] || BaseContext;
              const context = reactExports.useContext(Context);
              if (context) return context;
              if (defaultContext !== void 0) return defaultContext;
              throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
            }
            return [Provider, useContext2];
          }
          const createScope = () => {
            const scopeContexts = defaultContexts.map(defaultContext => {
              return reactExports.createContext(defaultContext);
            });
            return function useScope(scope) {
              const contexts = scope?.[scopeName] || scopeContexts;
              return reactExports.useMemo(() => ({
                [`__scope${scopeName}`]: {
                  ...scope,
                  [scopeName]: contexts
                }
              }), [scope, contexts]);
            };
          };
          createScope.scopeName = scopeName;
          return [createContext3, composeContextScopes(createScope, ...createContextScopeDeps)];
        }
        function composeContextScopes(...scopes) {
          const baseScope = scopes[0];
          if (scopes.length === 1) return baseScope;
          const createScope = () => {
            const scopeHooks = scopes.map(createScope2 => ({
              useScope: createScope2(),
              scopeName: createScope2.scopeName
            }));
            return function useComposedScopes(overrideScopes) {
              const nextScopes = scopeHooks.reduce((nextScopes2, {
                useScope,
                scopeName
              }) => {
                const scopeProps = useScope(overrideScopes);
                const currentScope = scopeProps[`__scope${scopeName}`];
                return {
                  ...nextScopes2,
                  ...currentScope
                };
              }, {});
              return reactExports.useMemo(() => ({
                [`__scope${baseScope.scopeName}`]: nextScopes
              }), [nextScopes]);
            };
          };
          createScope.scopeName = baseScope.scopeName;
          return createScope;
        }

        // src/primitive.tsx
        var NODES$1 = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"];
        var Primitive$1 = NODES$1.reduce((primitive, node) => {
          const Slot = createSlot$6(`Primitive.${node}`);
          const Node = reactExports.forwardRef((props, forwardedRef) => {
            const {
              asChild,
              ...primitiveProps
            } = props;
            const Comp = asChild ? Slot : node;
            if (typeof window !== "undefined") {
              window[Symbol.for("radix-ui")] = true;
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(Comp, {
              ...primitiveProps,
              ref: forwardedRef
            });
          });
          Node.displayName = `Primitive.${node}`;
          return {
            ...primitive,
            [node]: Node
          };
        }, {});
        var PROGRESS_NAME = "Progress";
        var DEFAULT_MAX = 100;
        var [createProgressContext] = createContextScope(PROGRESS_NAME);
        var [ProgressProvider, useProgressContext] = createProgressContext(PROGRESS_NAME);
        var Progress$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeProgress,
            value: valueProp = null,
            max: maxProp,
            getValueLabel = defaultGetValueLabel,
            ...progressProps
          } = props;
          if ((maxProp || maxProp === 0) && !isValidMaxNumber(maxProp)) {
            console.error(getInvalidMaxError(`${maxProp}`, "Progress"));
          }
          const max = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
          if (valueProp !== null && !isValidValueNumber(valueProp, max)) {
            console.error(getInvalidValueError(`${valueProp}`, "Progress"));
          }
          const value = isValidValueNumber(valueProp, max) ? valueProp : null;
          const valueLabel = isNumber(value) ? getValueLabel(value, max) : void 0;
          return /* @__PURE__ */jsxRuntimeExports.jsx(ProgressProvider, {
            scope: __scopeProgress,
            value,
            max,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$1.div, {
              "aria-valuemax": max,
              "aria-valuemin": 0,
              "aria-valuenow": isNumber(value) ? value : void 0,
              "aria-valuetext": valueLabel,
              role: "progressbar",
              "data-state": getProgressState(value, max),
              "data-value": value ?? void 0,
              "data-max": max,
              ...progressProps,
              ref: forwardedRef
            })
          });
        });
        Progress$1.displayName = PROGRESS_NAME;
        var INDICATOR_NAME$2 = "ProgressIndicator";
        var ProgressIndicator = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeProgress,
            ...indicatorProps
          } = props;
          const context = useProgressContext(INDICATOR_NAME$2, __scopeProgress);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$1.div, {
            "data-state": getProgressState(context.value, context.max),
            "data-value": context.value ?? void 0,
            "data-max": context.max,
            ...indicatorProps,
            ref: forwardedRef
          });
        });
        ProgressIndicator.displayName = INDICATOR_NAME$2;
        function defaultGetValueLabel(value, max) {
          return `${Math.round(value / max * 100)}%`;
        }
        function getProgressState(value, maxValue) {
          return value == null ? "indeterminate" : value === maxValue ? "complete" : "loading";
        }
        function isNumber(value) {
          return typeof value === "number";
        }
        function isValidMaxNumber(max) {
          return isNumber(max) && !isNaN(max) && max > 0;
        }
        function isValidValueNumber(value, max) {
          return isNumber(value) && !isNaN(value) && value <= max && value >= 0;
        }
        function getInvalidMaxError(propValue, componentName) {
          return `Invalid prop \`max\` of value \`${propValue}\` supplied to \`${componentName}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${DEFAULT_MAX}\`.`;
        }
        function getInvalidValueError(propValue, componentName) {
          return `Invalid prop \`value\` of value \`${propValue}\` supplied to \`${componentName}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${DEFAULT_MAX} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
        }
        var Root$3 = Progress$1;
        var Indicator = ProgressIndicator;
        const Progress = exports("v", reactExports.forwardRef(({
          className,
          value,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Root$3, {
          ref,
          className: cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className),
          ...props,
          children: /* @__PURE__ */jsxRuntimeExports.jsx(Indicator, {
            className: "h-full w-full flex-1 bg-primary transition-all",
            style: {
              transform: `translateX(-${100 - (value || 0)}%)`
            }
          })
        })));
        Progress.displayName = Root$3.displayName;
        var SWITCH_NAME = "Switch";
        var [createSwitchContext] = createContextScope$1(SWITCH_NAME);
        var [SwitchProvider, useSwitchContext] = createSwitchContext(SWITCH_NAME);
        var Switch$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSwitch,
            name,
            checked: checkedProp,
            defaultChecked,
            required,
            disabled,
            value = "on",
            onCheckedChange,
            form,
            ...switchProps
          } = props;
          const [button, setButton] = reactExports.useState(null);
          const composedRefs = useComposedRefs(forwardedRef, node => setButton(node));
          const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
          const isFormControl = button ? form || !!button.closest("form") : true;
          const [checked, setChecked] = useControllableState({
            prop: checkedProp,
            defaultProp: defaultChecked ?? false,
            onChange: onCheckedChange,
            caller: SWITCH_NAME
          });
          return /* @__PURE__ */jsxRuntimeExports.jsxs(SwitchProvider, {
            scope: __scopeSwitch,
            checked,
            disabled,
            children: [/* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.button, {
              type: "button",
              role: "switch",
              "aria-checked": checked,
              "aria-required": required,
              "data-state": getState$2(checked),
              "data-disabled": disabled ? "" : void 0,
              disabled,
              value,
              ...switchProps,
              ref: composedRefs,
              onClick: composeEventHandlers(props.onClick, event => {
                setChecked(prevChecked => !prevChecked);
                if (isFormControl) {
                  hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
                  if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
                }
              })
            }), isFormControl && /* @__PURE__ */jsxRuntimeExports.jsx(SwitchBubbleInput, {
              control: button,
              bubbles: !hasConsumerStoppedPropagationRef.current,
              name,
              value,
              checked,
              required,
              disabled,
              form,
              style: {
                transform: "translateX(-100%)"
              }
            })]
          });
        });
        Switch$1.displayName = SWITCH_NAME;
        var THUMB_NAME = "SwitchThumb";
        var SwitchThumb = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeSwitch,
            ...thumbProps
          } = props;
          const context = useSwitchContext(THUMB_NAME, __scopeSwitch);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.span, {
            "data-state": getState$2(context.checked),
            "data-disabled": context.disabled ? "" : void 0,
            ...thumbProps,
            ref: forwardedRef
          });
        });
        SwitchThumb.displayName = THUMB_NAME;
        var BUBBLE_INPUT_NAME$1 = "SwitchBubbleInput";
        var SwitchBubbleInput = reactExports.forwardRef(({
          __scopeSwitch,
          control,
          checked,
          bubbles = true,
          ...props
        }, forwardedRef) => {
          const ref = reactExports.useRef(null);
          const composedRefs = useComposedRefs(ref, forwardedRef);
          const prevChecked = usePrevious(checked);
          const controlSize = useSize(control);
          reactExports.useEffect(() => {
            const input = ref.current;
            if (!input) return;
            const inputProto = window.HTMLInputElement.prototype;
            const descriptor = Object.getOwnPropertyDescriptor(inputProto, "checked");
            const setChecked = descriptor.set;
            if (prevChecked !== checked && setChecked) {
              const event = new Event("click", {
                bubbles
              });
              setChecked.call(input, checked);
              input.dispatchEvent(event);
            }
          }, [prevChecked, checked, bubbles]);
          return /* @__PURE__ */jsxRuntimeExports.jsx("input", {
            type: "checkbox",
            "aria-hidden": true,
            defaultChecked: checked,
            ...props,
            tabIndex: -1,
            ref: composedRefs,
            style: {
              ...props.style,
              ...controlSize,
              position: "absolute",
              pointerEvents: "none",
              opacity: 0,
              margin: 0
            }
          });
        });
        SwitchBubbleInput.displayName = BUBBLE_INPUT_NAME$1;
        function getState$2(checked) {
          return checked ? "checked" : "unchecked";
        }
        var Root$2 = Switch$1;
        var Thumb = SwitchThumb;
        const Switch = exports("w", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Root$2, {
          className: cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
          ...props,
          ref,
          children: /* @__PURE__ */jsxRuntimeExports.jsx(Thumb, {
            className: cn("pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0")
          })
        })));
        Switch.displayName = Root$2.displayName;

        // src/primitive.tsx
        var NODES = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"];
        var Primitive = NODES.reduce((primitive, node) => {
          const Slot = createSlot$6(`Primitive.${node}`);
          const Node = reactExports.forwardRef((props, forwardedRef) => {
            const {
              asChild,
              ...primitiveProps
            } = props;
            const Comp = asChild ? Slot : node;
            if (typeof window !== "undefined") {
              window[Symbol.for("radix-ui")] = true;
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(Comp, {
              ...primitiveProps,
              ref: forwardedRef
            });
          });
          Node.displayName = `Primitive.${node}`;
          return {
            ...primitive,
            [node]: Node
          };
        }, {});

        // src/separator.tsx
        var NAME = "Separator";
        var DEFAULT_ORIENTATION = "horizontal";
        var ORIENTATIONS = ["horizontal", "vertical"];
        var Separator$2 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            decorative,
            orientation: orientationProp = DEFAULT_ORIENTATION,
            ...domProps
          } = props;
          const orientation = isValidOrientation(orientationProp) ? orientationProp : DEFAULT_ORIENTATION;
          const ariaOrientation = orientation === "vertical" ? orientation : void 0;
          const semanticProps = decorative ? {
            role: "none"
          } : {
            "aria-orientation": ariaOrientation,
            role: "separator"
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive.div, {
            "data-orientation": orientation,
            ...semanticProps,
            ...domProps,
            ref: forwardedRef
          });
        });
        Separator$2.displayName = NAME;
        function isValidOrientation(orientation) {
          return ORIENTATIONS.includes(orientation);
        }
        var Root$1 = Separator$2;
        const Separator$1 = exports("y", reactExports.forwardRef(({
          className,
          orientation = "horizontal",
          decorative = true,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Root$1, {
          ref,
          decorative,
          orientation,
          className: cn("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className),
          ...props
        })));
        Separator$1.displayName = Root$1.displayName;
        var CHECKBOX_NAME = "Checkbox";
        var [createCheckboxContext] = createContextScope$1(CHECKBOX_NAME);
        var [CheckboxProviderImpl, useCheckboxContext] = createCheckboxContext(CHECKBOX_NAME);
        function CheckboxProvider(props) {
          const {
            __scopeCheckbox,
            checked: checkedProp,
            children,
            defaultChecked,
            disabled,
            form,
            name,
            onCheckedChange,
            required,
            value = "on",
            // @ts-expect-error
            internal_do_not_use_render
          } = props;
          const [checked, setChecked] = useControllableState({
            prop: checkedProp,
            defaultProp: defaultChecked ?? false,
            onChange: onCheckedChange,
            caller: CHECKBOX_NAME
          });
          const [control, setControl] = reactExports.useState(null);
          const [bubbleInput, setBubbleInput] = reactExports.useState(null);
          const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
          const isFormControl = control ? !!form || !!control.closest("form") :
          // We set this to true by default so that events bubble to forms without JS (SSR)
          true;
          const context = {
            checked,
            disabled,
            setChecked,
            control,
            setControl,
            name,
            form,
            value,
            hasConsumerStoppedPropagationRef,
            required,
            defaultChecked: isIndeterminate$1(defaultChecked) ? false : defaultChecked,
            isFormControl,
            bubbleInput,
            setBubbleInput
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx(CheckboxProviderImpl, {
            scope: __scopeCheckbox,
            ...context,
            children: isFunction(internal_do_not_use_render) ? internal_do_not_use_render(context) : children
          });
        }
        var TRIGGER_NAME$3 = "CheckboxTrigger";
        var CheckboxTrigger = reactExports.forwardRef(({
          __scopeCheckbox,
          onKeyDown,
          onClick,
          ...checkboxProps
        }, forwardedRef) => {
          const {
            control,
            value,
            disabled,
            checked,
            required,
            setControl,
            setChecked,
            hasConsumerStoppedPropagationRef,
            isFormControl,
            bubbleInput
          } = useCheckboxContext(TRIGGER_NAME$3, __scopeCheckbox);
          const composedRefs = useComposedRefs(forwardedRef, setControl);
          const initialCheckedStateRef = reactExports.useRef(checked);
          reactExports.useEffect(() => {
            const form = control?.form;
            if (form) {
              const reset = () => setChecked(initialCheckedStateRef.current);
              form.addEventListener("reset", reset);
              return () => form.removeEventListener("reset", reset);
            }
          }, [control, setChecked]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.button, {
            type: "button",
            role: "checkbox",
            "aria-checked": isIndeterminate$1(checked) ? "mixed" : checked,
            "aria-required": required,
            "data-state": getState$1(checked),
            "data-disabled": disabled ? "" : void 0,
            disabled,
            value,
            ...checkboxProps,
            ref: composedRefs,
            onKeyDown: composeEventHandlers(onKeyDown, event => {
              if (event.key === "Enter") event.preventDefault();
            }),
            onClick: composeEventHandlers(onClick, event => {
              setChecked(prevChecked => isIndeterminate$1(prevChecked) ? true : !prevChecked);
              if (bubbleInput && isFormControl) {
                hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
                if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
              }
            })
          });
        });
        CheckboxTrigger.displayName = TRIGGER_NAME$3;
        var Checkbox$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeCheckbox,
            name,
            checked,
            defaultChecked,
            required,
            disabled,
            value,
            onCheckedChange,
            form,
            ...checkboxProps
          } = props;
          return /* @__PURE__ */jsxRuntimeExports.jsx(CheckboxProvider, {
            __scopeCheckbox,
            checked,
            defaultChecked,
            disabled,
            required,
            onCheckedChange,
            name,
            form,
            value,
            internal_do_not_use_render: ({
              isFormControl
            }) => /* @__PURE__ */jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, {
              children: [/* @__PURE__ */jsxRuntimeExports.jsx(CheckboxTrigger, {
                ...checkboxProps,
                ref: forwardedRef,
                __scopeCheckbox
              }), isFormControl && /* @__PURE__ */jsxRuntimeExports.jsx(CheckboxBubbleInput, {
                __scopeCheckbox
              })]
            })
          });
        });
        Checkbox$1.displayName = CHECKBOX_NAME;
        var INDICATOR_NAME$1 = "CheckboxIndicator";
        var CheckboxIndicator = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeCheckbox,
            forceMount,
            ...indicatorProps
          } = props;
          const context = useCheckboxContext(INDICATOR_NAME$1, __scopeCheckbox);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
            present: forceMount || isIndeterminate$1(context.checked) || context.checked === true,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.span, {
              "data-state": getState$1(context.checked),
              "data-disabled": context.disabled ? "" : void 0,
              ...indicatorProps,
              ref: forwardedRef,
              style: {
                pointerEvents: "none",
                ...props.style
              }
            })
          });
        });
        CheckboxIndicator.displayName = INDICATOR_NAME$1;
        var BUBBLE_INPUT_NAME = "CheckboxBubbleInput";
        var CheckboxBubbleInput = reactExports.forwardRef(({
          __scopeCheckbox,
          ...props
        }, forwardedRef) => {
          const {
            control,
            hasConsumerStoppedPropagationRef,
            checked,
            defaultChecked,
            required,
            disabled,
            name,
            value,
            form,
            bubbleInput,
            setBubbleInput
          } = useCheckboxContext(BUBBLE_INPUT_NAME, __scopeCheckbox);
          const composedRefs = useComposedRefs(forwardedRef, setBubbleInput);
          const prevChecked = usePrevious(checked);
          const controlSize = useSize(control);
          reactExports.useEffect(() => {
            const input = bubbleInput;
            if (!input) return;
            const inputProto = window.HTMLInputElement.prototype;
            const descriptor = Object.getOwnPropertyDescriptor(inputProto, "checked");
            const setChecked = descriptor.set;
            const bubbles = !hasConsumerStoppedPropagationRef.current;
            if (prevChecked !== checked && setChecked) {
              const event = new Event("click", {
                bubbles
              });
              input.indeterminate = isIndeterminate$1(checked);
              setChecked.call(input, isIndeterminate$1(checked) ? false : checked);
              input.dispatchEvent(event);
            }
          }, [bubbleInput, prevChecked, checked, hasConsumerStoppedPropagationRef]);
          const defaultCheckedRef = reactExports.useRef(isIndeterminate$1(checked) ? false : checked);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.input, {
            type: "checkbox",
            "aria-hidden": true,
            defaultChecked: defaultChecked ?? defaultCheckedRef.current,
            required,
            disabled,
            name,
            value,
            form,
            ...props,
            tabIndex: -1,
            ref: composedRefs,
            style: {
              ...props.style,
              ...controlSize,
              position: "absolute",
              pointerEvents: "none",
              opacity: 0,
              margin: 0,
              // We transform because the input is absolutely positioned but we have
              // rendered it **after** the button. This pulls it back to sit on top
              // of the button.
              transform: "translateX(-100%)"
            }
          });
        });
        CheckboxBubbleInput.displayName = BUBBLE_INPUT_NAME;
        function isFunction(value) {
          return typeof value === "function";
        }
        function isIndeterminate$1(checked) {
          return checked === "indeterminate";
        }
        function getState$1(checked) {
          return isIndeterminate$1(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
        }
        const Checkbox = exports("z", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Checkbox$1, {
          ref,
          className: cn("peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
          ...props,
          children: /* @__PURE__ */jsxRuntimeExports.jsx(CheckboxIndicator, {
            className: cn("flex items-center justify-center text-current"),
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Check, {
              className: "h-4 w-4"
            })
          })
        })));
        Checkbox.displayName = Checkbox$1.displayName;
        var ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
        var EVENT_OPTIONS = {
          bubbles: false,
          cancelable: true
        };
        var GROUP_NAME$2 = "RovingFocusGroup";
        var [Collection$1, useCollection$1, createCollectionScope$1] = createCollection(GROUP_NAME$2);
        var [createRovingFocusGroupContext, createRovingFocusGroupScope] = createContextScope$1(GROUP_NAME$2, [createCollectionScope$1]);
        var [RovingFocusProvider, useRovingFocusContext] = createRovingFocusGroupContext(GROUP_NAME$2);
        var RovingFocusGroup = reactExports.forwardRef((props, forwardedRef) => {
          return /* @__PURE__ */jsxRuntimeExports.jsx(Collection$1.Provider, {
            scope: props.__scopeRovingFocusGroup,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Collection$1.Slot, {
              scope: props.__scopeRovingFocusGroup,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(RovingFocusGroupImpl, {
                ...props,
                ref: forwardedRef
              })
            })
          });
        });
        RovingFocusGroup.displayName = GROUP_NAME$2;
        var RovingFocusGroupImpl = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeRovingFocusGroup,
            orientation,
            loop = false,
            dir,
            currentTabStopId: currentTabStopIdProp,
            defaultCurrentTabStopId,
            onCurrentTabStopIdChange,
            onEntryFocus,
            preventScrollOnEntryFocus = false,
            ...groupProps
          } = props;
          const ref = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, ref);
          const direction = useDirection(dir);
          const [currentTabStopId, setCurrentTabStopId] = useControllableState({
            prop: currentTabStopIdProp,
            defaultProp: defaultCurrentTabStopId ?? null,
            onChange: onCurrentTabStopIdChange,
            caller: GROUP_NAME$2
          });
          const [isTabbingBackOut, setIsTabbingBackOut] = reactExports.useState(false);
          const handleEntryFocus = useCallbackRef$1(onEntryFocus);
          const getItems = useCollection$1(__scopeRovingFocusGroup);
          const isClickFocusRef = reactExports.useRef(false);
          const [focusableItemsCount, setFocusableItemsCount] = reactExports.useState(0);
          reactExports.useEffect(() => {
            const node = ref.current;
            if (node) {
              node.addEventListener(ENTRY_FOCUS, handleEntryFocus);
              return () => node.removeEventListener(ENTRY_FOCUS, handleEntryFocus);
            }
          }, [handleEntryFocus]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(RovingFocusProvider, {
            scope: __scopeRovingFocusGroup,
            orientation,
            dir: direction,
            loop,
            currentTabStopId,
            onItemFocus: reactExports.useCallback(tabStopId => setCurrentTabStopId(tabStopId), [setCurrentTabStopId]),
            onItemShiftTab: reactExports.useCallback(() => setIsTabbingBackOut(true), []),
            onFocusableItemAdd: reactExports.useCallback(() => setFocusableItemsCount(prevCount => prevCount + 1), []),
            onFocusableItemRemove: reactExports.useCallback(() => setFocusableItemsCount(prevCount => prevCount - 1), []),
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
              tabIndex: isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0,
              "data-orientation": orientation,
              ...groupProps,
              ref: composedRefs,
              style: {
                outline: "none",
                ...props.style
              },
              onMouseDown: composeEventHandlers(props.onMouseDown, () => {
                isClickFocusRef.current = true;
              }),
              onFocus: composeEventHandlers(props.onFocus, event => {
                const isKeyboardFocus = !isClickFocusRef.current;
                if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
                  const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS);
                  event.currentTarget.dispatchEvent(entryFocusEvent);
                  if (!entryFocusEvent.defaultPrevented) {
                    const items = getItems().filter(item => item.focusable);
                    const activeItem = items.find(item => item.active);
                    const currentItem = items.find(item => item.id === currentTabStopId);
                    const candidateItems = [activeItem, currentItem, ...items].filter(Boolean);
                    const candidateNodes = candidateItems.map(item => item.ref.current);
                    focusFirst$1(candidateNodes, preventScrollOnEntryFocus);
                  }
                }
                isClickFocusRef.current = false;
              }),
              onBlur: composeEventHandlers(props.onBlur, () => setIsTabbingBackOut(false))
            })
          });
        });
        var ITEM_NAME$2 = "RovingFocusGroupItem";
        var RovingFocusGroupItem = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeRovingFocusGroup,
            focusable = true,
            active = false,
            tabStopId,
            children,
            ...itemProps
          } = props;
          const autoId = useId();
          const id = tabStopId || autoId;
          const context = useRovingFocusContext(ITEM_NAME$2, __scopeRovingFocusGroup);
          const isCurrentTabStop = context.currentTabStopId === id;
          const getItems = useCollection$1(__scopeRovingFocusGroup);
          const {
            onFocusableItemAdd,
            onFocusableItemRemove,
            currentTabStopId
          } = context;
          reactExports.useEffect(() => {
            if (focusable) {
              onFocusableItemAdd();
              return () => onFocusableItemRemove();
            }
          }, [focusable, onFocusableItemAdd, onFocusableItemRemove]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Collection$1.ItemSlot, {
            scope: __scopeRovingFocusGroup,
            id,
            focusable,
            active,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.span, {
              tabIndex: isCurrentTabStop ? 0 : -1,
              "data-orientation": context.orientation,
              ...itemProps,
              ref: forwardedRef,
              onMouseDown: composeEventHandlers(props.onMouseDown, event => {
                if (!focusable) event.preventDefault();else context.onItemFocus(id);
              }),
              onFocus: composeEventHandlers(props.onFocus, () => context.onItemFocus(id)),
              onKeyDown: composeEventHandlers(props.onKeyDown, event => {
                if (event.key === "Tab" && event.shiftKey) {
                  context.onItemShiftTab();
                  return;
                }
                if (event.target !== event.currentTarget) return;
                const focusIntent = getFocusIntent(event, context.orientation, context.dir);
                if (focusIntent !== void 0) {
                  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                  event.preventDefault();
                  const items = getItems().filter(item => item.focusable);
                  let candidateNodes = items.map(item => item.ref.current);
                  if (focusIntent === "last") candidateNodes.reverse();else if (focusIntent === "prev" || focusIntent === "next") {
                    if (focusIntent === "prev") candidateNodes.reverse();
                    const currentIndex = candidateNodes.indexOf(event.currentTarget);
                    candidateNodes = context.loop ? wrapArray$1(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
                  }
                  setTimeout(() => focusFirst$1(candidateNodes));
                }
              }),
              children: typeof children === "function" ? children({
                isCurrentTabStop,
                hasTabStop: currentTabStopId != null
              }) : children
            })
          });
        });
        RovingFocusGroupItem.displayName = ITEM_NAME$2;
        var MAP_KEY_TO_FOCUS_INTENT = {
          ArrowLeft: "prev",
          ArrowUp: "prev",
          ArrowRight: "next",
          ArrowDown: "next",
          PageUp: "first",
          Home: "first",
          PageDown: "last",
          End: "last"
        };
        function getDirectionAwareKey(key, dir) {
          if (dir !== "rtl") return key;
          return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
        }
        function getFocusIntent(event, orientation, dir) {
          const key = getDirectionAwareKey(event.key, dir);
          if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key)) return void 0;
          if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key)) return void 0;
          return MAP_KEY_TO_FOCUS_INTENT[key];
        }
        function focusFirst$1(candidates, preventScroll = false) {
          const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
          for (const candidate of candidates) {
            if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
            candidate.focus({
              preventScroll
            });
            if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
          }
        }
        function wrapArray$1(array, startIndex) {
          return array.map((_, index) => array[(startIndex + index) % array.length]);
        }
        var Root = RovingFocusGroup;
        var Item = RovingFocusGroupItem;
        var TABS_NAME = "Tabs";
        var [createTabsContext] = createContextScope$1(TABS_NAME, [createRovingFocusGroupScope]);
        var useRovingFocusGroupScope$1 = createRovingFocusGroupScope();
        var [TabsProvider, useTabsContext] = createTabsContext(TABS_NAME);
        var Tabs$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeTabs,
            value: valueProp,
            onValueChange,
            defaultValue,
            orientation = "horizontal",
            dir,
            activationMode = "automatic",
            ...tabsProps
          } = props;
          const direction = useDirection(dir);
          const [value, setValue] = useControllableState({
            prop: valueProp,
            onChange: onValueChange,
            defaultProp: defaultValue ?? "",
            caller: TABS_NAME
          });
          return /* @__PURE__ */jsxRuntimeExports.jsx(TabsProvider, {
            scope: __scopeTabs,
            baseId: useId(),
            value,
            onValueChange: setValue,
            orientation,
            dir: direction,
            activationMode,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
              dir: direction,
              "data-orientation": orientation,
              ...tabsProps,
              ref: forwardedRef
            })
          });
        });
        Tabs$1.displayName = TABS_NAME;
        var TAB_LIST_NAME = "TabsList";
        var TabsList$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeTabs,
            loop = true,
            ...listProps
          } = props;
          const context = useTabsContext(TAB_LIST_NAME, __scopeTabs);
          const rovingFocusGroupScope = useRovingFocusGroupScope$1(__scopeTabs);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Root, {
            asChild: true,
            ...rovingFocusGroupScope,
            orientation: context.orientation,
            dir: context.dir,
            loop,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
              role: "tablist",
              "aria-orientation": context.orientation,
              ...listProps,
              ref: forwardedRef
            })
          });
        });
        TabsList$1.displayName = TAB_LIST_NAME;
        var TRIGGER_NAME$2 = "TabsTrigger";
        var TabsTrigger$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeTabs,
            value,
            disabled = false,
            ...triggerProps
          } = props;
          const context = useTabsContext(TRIGGER_NAME$2, __scopeTabs);
          const rovingFocusGroupScope = useRovingFocusGroupScope$1(__scopeTabs);
          const triggerId = makeTriggerId(context.baseId, value);
          const contentId = makeContentId(context.baseId, value);
          const isSelected = value === context.value;
          return /* @__PURE__ */jsxRuntimeExports.jsx(Item, {
            asChild: true,
            ...rovingFocusGroupScope,
            focusable: !disabled,
            active: isSelected,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.button, {
              type: "button",
              role: "tab",
              "aria-selected": isSelected,
              "aria-controls": contentId,
              "data-state": isSelected ? "active" : "inactive",
              "data-disabled": disabled ? "" : void 0,
              disabled,
              id: triggerId,
              ...triggerProps,
              ref: forwardedRef,
              onMouseDown: composeEventHandlers(props.onMouseDown, event => {
                if (!disabled && event.button === 0 && event.ctrlKey === false) {
                  context.onValueChange(value);
                } else {
                  event.preventDefault();
                }
              }),
              onKeyDown: composeEventHandlers(props.onKeyDown, event => {
                if ([" ", "Enter"].includes(event.key)) context.onValueChange(value);
              }),
              onFocus: composeEventHandlers(props.onFocus, () => {
                const isAutomaticActivation = context.activationMode !== "manual";
                if (!isSelected && !disabled && isAutomaticActivation) {
                  context.onValueChange(value);
                }
              })
            })
          });
        });
        TabsTrigger$1.displayName = TRIGGER_NAME$2;
        var CONTENT_NAME$3 = "TabsContent";
        var TabsContent$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeTabs,
            value,
            forceMount,
            children,
            ...contentProps
          } = props;
          const context = useTabsContext(CONTENT_NAME$3, __scopeTabs);
          const triggerId = makeTriggerId(context.baseId, value);
          const contentId = makeContentId(context.baseId, value);
          const isSelected = value === context.value;
          const isMountAnimationPreventedRef = reactExports.useRef(isSelected);
          reactExports.useEffect(() => {
            const rAF = requestAnimationFrame(() => isMountAnimationPreventedRef.current = false);
            return () => cancelAnimationFrame(rAF);
          }, []);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
            present: forceMount || isSelected,
            children: ({
              present
            }) => /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
              "data-state": isSelected ? "active" : "inactive",
              "data-orientation": context.orientation,
              role: "tabpanel",
              "aria-labelledby": triggerId,
              hidden: !present,
              id: contentId,
              tabIndex: 0,
              ...contentProps,
              ref: forwardedRef,
              style: {
                ...props.style,
                animationDuration: isMountAnimationPreventedRef.current ? "0s" : void 0
              },
              children: present && children
            })
          });
        });
        TabsContent$1.displayName = CONTENT_NAME$3;
        function makeTriggerId(baseId, value) {
          return `${baseId}-trigger-${value}`;
        }
        function makeContentId(baseId, value) {
          return `${baseId}-content-${value}`;
        }
        var Root2$2 = Tabs$1;
        var List = TabsList$1;
        var Trigger$2 = TabsTrigger$1;
        var Content = TabsContent$1;
        const Tabs = exports("J", Root2$2);
        const TabsList = exports("K", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(List, {
          ref,
          className: cn("inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500", className),
          ...props
        })));
        TabsList.displayName = List.displayName;
        const TabsTrigger = exports("M", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Trigger$2, {
          ref,
          className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm", className),
          ...props
        })));
        TabsTrigger.displayName = Trigger$2.displayName;
        const TabsContent = exports("N", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Content, {
          ref,
          className: cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2", className),
          ...props
        })));
        TabsContent.displayName = Content.displayName;
        const alertVariants = cva("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", {
          variants: {
            variant: {
              default: "bg-background text-foreground",
              destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
            }
          },
          defaultVariants: {
            variant: "default"
          }
        });
        const Alert = exports("Q", reactExports.forwardRef(({
          className,
          variant,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
          ref,
          role: "alert",
          className: cn(alertVariants({
            variant
          }), className),
          ...props
        })));
        Alert.displayName = "Alert";
        const AlertTitle = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("h5", {
          ref,
          className: cn("mb-1 font-medium leading-none tracking-tight", className),
          ...props
        }));
        AlertTitle.displayName = "AlertTitle";
        const AlertDescription = exports("R", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
          ref,
          className: cn("text-sm [&_p]:leading-relaxed", className),
          ...props
        })));
        AlertDescription.displayName = "AlertDescription";

        // src/slot.tsx
        // @__NO_SIDE_EFFECTS__
        function createSlot$1(ownerName) {
          const SlotClone = /* @__PURE__ */createSlotClone$1(ownerName);
          const Slot2 = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            const childrenArray = reactExports.Children.toArray(children);
            const slottable = childrenArray.find(isSlottable$1);
            if (slottable) {
              const newElement = slottable.props.children;
              const newChildren = childrenArray.map(child => {
                if (child === slottable) {
                  if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
                  return reactExports.isValidElement(newElement) ? newElement.props.children : null;
                } else {
                  return child;
                }
              });
              return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
                ...slotProps,
                ref: forwardedRef,
                children: reactExports.isValidElement(newElement) ? reactExports.cloneElement(newElement, void 0, newChildren) : null
              });
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
              ...slotProps,
              ref: forwardedRef,
              children
            });
          });
          Slot2.displayName = `${ownerName}.Slot`;
          return Slot2;
        }
        // @__NO_SIDE_EFFECTS__
        function createSlotClone$1(ownerName) {
          const SlotClone = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            if (reactExports.isValidElement(children)) {
              const childrenRef = getElementRef$1(children);
              const props2 = mergeProps$1(slotProps, children.props);
              if (children.type !== reactExports.Fragment) {
                props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
              }
              return reactExports.cloneElement(children, props2);
            }
            return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
          });
          SlotClone.displayName = `${ownerName}.SlotClone`;
          return SlotClone;
        }
        var SLOTTABLE_IDENTIFIER$1 = Symbol("radix.slottable");
        function isSlottable$1(child) {
          return reactExports.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER$1;
        }
        function mergeProps$1(slotProps, childProps) {
          const overrideProps = {
            ...childProps
          };
          for (const propName in childProps) {
            const slotPropValue = slotProps[propName];
            const childPropValue = childProps[propName];
            const isHandler = /^on[A-Z]/.test(propName);
            if (isHandler) {
              if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args) => {
                  const result = childPropValue(...args);
                  slotPropValue(...args);
                  return result;
                };
              } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
              }
            } else if (propName === "style") {
              overrideProps[propName] = {
                ...slotPropValue,
                ...childPropValue
              };
            } else if (propName === "className") {
              overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
            }
          }
          return {
            ...slotProps,
            ...overrideProps
          };
        }
        function getElementRef$1(element) {
          let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
          let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.ref;
          }
          getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
          mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.props.ref;
          }
          return element.props.ref || element.ref;
        }
        var POPOVER_NAME = "Popover";
        var [createPopoverContext] = createContextScope$1(POPOVER_NAME, [createPopperScope]);
        var usePopperScope$1 = createPopperScope();
        var [PopoverProvider, usePopoverContext] = createPopoverContext(POPOVER_NAME);
        var Popover$1 = props => {
          const {
            __scopePopover,
            children,
            open: openProp,
            defaultOpen,
            onOpenChange,
            modal = false
          } = props;
          const popperScope = usePopperScope$1(__scopePopover);
          const triggerRef = reactExports.useRef(null);
          const [hasCustomAnchor, setHasCustomAnchor] = reactExports.useState(false);
          const [open, setOpen] = useControllableState({
            prop: openProp,
            defaultProp: defaultOpen ?? false,
            onChange: onOpenChange,
            caller: POPOVER_NAME
          });
          return /* @__PURE__ */jsxRuntimeExports.jsx(Root2$4, {
            ...popperScope,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(PopoverProvider, {
              scope: __scopePopover,
              contentId: useId(),
              triggerRef,
              open,
              onOpenChange: setOpen,
              onOpenToggle: reactExports.useCallback(() => setOpen(prevOpen => !prevOpen), [setOpen]),
              hasCustomAnchor,
              onCustomAnchorAdd: reactExports.useCallback(() => setHasCustomAnchor(true), []),
              onCustomAnchorRemove: reactExports.useCallback(() => setHasCustomAnchor(false), []),
              modal,
              children
            })
          });
        };
        Popover$1.displayName = POPOVER_NAME;
        var ANCHOR_NAME$1 = "PopoverAnchor";
        var PopoverAnchor = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopePopover,
            ...anchorProps
          } = props;
          const context = usePopoverContext(ANCHOR_NAME$1, __scopePopover);
          const popperScope = usePopperScope$1(__scopePopover);
          const {
            onCustomAnchorAdd,
            onCustomAnchorRemove
          } = context;
          reactExports.useEffect(() => {
            onCustomAnchorAdd();
            return () => onCustomAnchorRemove();
          }, [onCustomAnchorAdd, onCustomAnchorRemove]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Anchor, {
            ...popperScope,
            ...anchorProps,
            ref: forwardedRef
          });
        });
        PopoverAnchor.displayName = ANCHOR_NAME$1;
        var TRIGGER_NAME$1 = "PopoverTrigger";
        var PopoverTrigger$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopePopover,
            ...triggerProps
          } = props;
          const context = usePopoverContext(TRIGGER_NAME$1, __scopePopover);
          const popperScope = usePopperScope$1(__scopePopover);
          const composedTriggerRef = useComposedRefs(forwardedRef, context.triggerRef);
          const trigger = /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.button, {
            type: "button",
            "aria-haspopup": "dialog",
            "aria-expanded": context.open,
            "aria-controls": context.contentId,
            "data-state": getState(context.open),
            ...triggerProps,
            ref: composedTriggerRef,
            onClick: composeEventHandlers(props.onClick, context.onOpenToggle)
          });
          return context.hasCustomAnchor ? trigger : /* @__PURE__ */jsxRuntimeExports.jsx(Anchor, {
            asChild: true,
            ...popperScope,
            children: trigger
          });
        });
        PopoverTrigger$1.displayName = TRIGGER_NAME$1;
        var PORTAL_NAME$2 = "PopoverPortal";
        var [PortalProvider$1, usePortalContext$1] = createPopoverContext(PORTAL_NAME$2, {
          forceMount: void 0
        });
        var PopoverPortal = props => {
          const {
            __scopePopover,
            forceMount,
            children,
            container
          } = props;
          const context = usePopoverContext(PORTAL_NAME$2, __scopePopover);
          return /* @__PURE__ */jsxRuntimeExports.jsx(PortalProvider$1, {
            scope: __scopePopover,
            forceMount,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
              present: forceMount || context.open,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Portal$4, {
                asChild: true,
                container,
                children
              })
            })
          });
        };
        PopoverPortal.displayName = PORTAL_NAME$2;
        var CONTENT_NAME$2 = "PopoverContent";
        var PopoverContent$1 = reactExports.forwardRef((props, forwardedRef) => {
          const portalContext = usePortalContext$1(CONTENT_NAME$2, props.__scopePopover);
          const {
            forceMount = portalContext.forceMount,
            ...contentProps
          } = props;
          const context = usePopoverContext(CONTENT_NAME$2, props.__scopePopover);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
            present: forceMount || context.open,
            children: context.modal ? /* @__PURE__ */jsxRuntimeExports.jsx(PopoverContentModal, {
              ...contentProps,
              ref: forwardedRef
            }) : /* @__PURE__ */jsxRuntimeExports.jsx(PopoverContentNonModal, {
              ...contentProps,
              ref: forwardedRef
            })
          });
        });
        PopoverContent$1.displayName = CONTENT_NAME$2;
        var Slot$1 = createSlot$1("PopoverContent.RemoveScroll");
        var PopoverContentModal = reactExports.forwardRef((props, forwardedRef) => {
          const context = usePopoverContext(CONTENT_NAME$2, props.__scopePopover);
          const contentRef = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, contentRef);
          const isRightClickOutsideRef = reactExports.useRef(false);
          reactExports.useEffect(() => {
            const content = contentRef.current;
            if (content) return hideOthers(content);
          }, []);
          return /* @__PURE__ */jsxRuntimeExports.jsx(ReactRemoveScroll, {
            as: Slot$1,
            allowPinchZoom: true,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(PopoverContentImpl, {
              ...props,
              ref: composedRefs,
              trapFocus: context.open,
              disableOutsidePointerEvents: true,
              onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, event => {
                event.preventDefault();
                if (!isRightClickOutsideRef.current) context.triggerRef.current?.focus();
              }),
              onPointerDownOutside: composeEventHandlers(props.onPointerDownOutside, event => {
                const originalEvent = event.detail.originalEvent;
                const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
                const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
                isRightClickOutsideRef.current = isRightClick;
              }, {
                checkForDefaultPrevented: false
              }),
              onFocusOutside: composeEventHandlers(props.onFocusOutside, event => event.preventDefault(), {
                checkForDefaultPrevented: false
              })
            })
          });
        });
        var PopoverContentNonModal = reactExports.forwardRef((props, forwardedRef) => {
          const context = usePopoverContext(CONTENT_NAME$2, props.__scopePopover);
          const hasInteractedOutsideRef = reactExports.useRef(false);
          const hasPointerDownOutsideRef = reactExports.useRef(false);
          return /* @__PURE__ */jsxRuntimeExports.jsx(PopoverContentImpl, {
            ...props,
            ref: forwardedRef,
            trapFocus: false,
            disableOutsidePointerEvents: false,
            onCloseAutoFocus: event => {
              props.onCloseAutoFocus?.(event);
              if (!event.defaultPrevented) {
                if (!hasInteractedOutsideRef.current) context.triggerRef.current?.focus();
                event.preventDefault();
              }
              hasInteractedOutsideRef.current = false;
              hasPointerDownOutsideRef.current = false;
            },
            onInteractOutside: event => {
              props.onInteractOutside?.(event);
              if (!event.defaultPrevented) {
                hasInteractedOutsideRef.current = true;
                if (event.detail.originalEvent.type === "pointerdown") {
                  hasPointerDownOutsideRef.current = true;
                }
              }
              const target = event.target;
              const targetIsTrigger = context.triggerRef.current?.contains(target);
              if (targetIsTrigger) event.preventDefault();
              if (event.detail.originalEvent.type === "focusin" && hasPointerDownOutsideRef.current) {
                event.preventDefault();
              }
            }
          });
        });
        var PopoverContentImpl = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopePopover,
            trapFocus,
            onOpenAutoFocus,
            onCloseAutoFocus,
            disableOutsidePointerEvents,
            onEscapeKeyDown,
            onPointerDownOutside,
            onFocusOutside,
            onInteractOutside,
            ...contentProps
          } = props;
          const context = usePopoverContext(CONTENT_NAME$2, __scopePopover);
          const popperScope = usePopperScope$1(__scopePopover);
          useFocusGuards();
          return /* @__PURE__ */jsxRuntimeExports.jsx(FocusScope, {
            asChild: true,
            loop: true,
            trapped: trapFocus,
            onMountAutoFocus: onOpenAutoFocus,
            onUnmountAutoFocus: onCloseAutoFocus,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(DismissableLayer, {
              asChild: true,
              disableOutsidePointerEvents,
              onInteractOutside,
              onEscapeKeyDown,
              onPointerDownOutside,
              onFocusOutside,
              onDismiss: () => context.onOpenChange(false),
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Content$2, {
                "data-state": getState(context.open),
                role: "dialog",
                id: context.contentId,
                ...popperScope,
                ...contentProps,
                ref: forwardedRef,
                style: {
                  ...contentProps.style,
                  // re-namespace exposed content custom properties
                  ...{
                    "--radix-popover-content-transform-origin": "var(--radix-popper-transform-origin)",
                    "--radix-popover-content-available-width": "var(--radix-popper-available-width)",
                    "--radix-popover-content-available-height": "var(--radix-popper-available-height)",
                    "--radix-popover-trigger-width": "var(--radix-popper-anchor-width)",
                    "--radix-popover-trigger-height": "var(--radix-popper-anchor-height)"
                  }
                }
              })
            })
          });
        });
        var CLOSE_NAME = "PopoverClose";
        var PopoverClose = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopePopover,
            ...closeProps
          } = props;
          const context = usePopoverContext(CLOSE_NAME, __scopePopover);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.button, {
            type: "button",
            ...closeProps,
            ref: forwardedRef,
            onClick: composeEventHandlers(props.onClick, () => context.onOpenChange(false))
          });
        });
        PopoverClose.displayName = CLOSE_NAME;
        var ARROW_NAME$2 = "PopoverArrow";
        var PopoverArrow = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopePopover,
            ...arrowProps
          } = props;
          const popperScope = usePopperScope$1(__scopePopover);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Arrow, {
            ...popperScope,
            ...arrowProps,
            ref: forwardedRef
          });
        });
        PopoverArrow.displayName = ARROW_NAME$2;
        function getState(open) {
          return open ? "open" : "closed";
        }
        var Root2$1 = Popover$1;
        var Trigger$1 = PopoverTrigger$1;
        var Portal$1 = PopoverPortal;
        var Content2$2 = PopoverContent$1;
        const Popover = exports("U", Root2$1);
        const PopoverTrigger = exports("V", Trigger$1);
        const PopoverContent = exports("W", reactExports.forwardRef(({
          className,
          align = "center",
          sideOffset = 4,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Portal$1, {
          children: /* @__PURE__ */jsxRuntimeExports.jsx(Content2$2, {
            ref,
            align,
            sideOffset,
            className: cn("z-50 w-72 rounded-md border border-gray-200 bg-white p-4 text-gray-900 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
            ...props
          })
        })));
        PopoverContent.displayName = Content2$2.displayName;
        const Table = exports("Z", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("div", {
          className: "relative w-full overflow-auto",
          children: /* @__PURE__ */jsxRuntimeExports.jsx("table", {
            ref,
            className: cn("w-full caption-bottom text-sm", className),
            ...props
          })
        })));
        Table.displayName = "Table";
        const TableHeader = exports("_", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("thead", {
          ref,
          className: cn("[&_tr]:border-b", className),
          ...props
        })));
        TableHeader.displayName = "TableHeader";
        const TableBody = exports("a1", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("tbody", {
          ref,
          className: cn("[&_tr:last-child]:border-0", className),
          ...props
        })));
        TableBody.displayName = "TableBody";
        const TableFooter = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("tfoot", {
          ref,
          className: cn("border-t bg-gray-100/50 font-medium [&>tr]:last:border-b-0", className),
          ...props
        }));
        TableFooter.displayName = "TableFooter";
        const TableRow = exports("$", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("tr", {
          ref,
          className: cn("border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100", className),
          ...props
        })));
        TableRow.displayName = "TableRow";
        const TableHead = exports("a0", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("th", {
          ref,
          className: cn("h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0", className),
          ...props
        })));
        TableHead.displayName = "TableHead";
        const TableCell = exports("a2", reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("td", {
          ref,
          className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
          ...props
        })));
        TableCell.displayName = "TableCell";
        const TableCaption = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx("caption", {
          ref,
          className: cn("mt-4 text-sm text-gray-500", className),
          ...props
        }));
        TableCaption.displayName = "TableCaption";

        // src/slot.tsx
        // @__NO_SIDE_EFFECTS__
        function createSlot(ownerName) {
          const SlotClone = /* @__PURE__ */createSlotClone(ownerName);
          const Slot2 = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            const childrenArray = reactExports.Children.toArray(children);
            const slottable = childrenArray.find(isSlottable);
            if (slottable) {
              const newElement = slottable.props.children;
              const newChildren = childrenArray.map(child => {
                if (child === slottable) {
                  if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
                  return reactExports.isValidElement(newElement) ? newElement.props.children : null;
                } else {
                  return child;
                }
              });
              return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
                ...slotProps,
                ref: forwardedRef,
                children: reactExports.isValidElement(newElement) ? reactExports.cloneElement(newElement, void 0, newChildren) : null
              });
            }
            return /* @__PURE__ */jsxRuntimeExports.jsx(SlotClone, {
              ...slotProps,
              ref: forwardedRef,
              children
            });
          });
          Slot2.displayName = `${ownerName}.Slot`;
          return Slot2;
        }
        // @__NO_SIDE_EFFECTS__
        function createSlotClone(ownerName) {
          const SlotClone = reactExports.forwardRef((props, forwardedRef) => {
            const {
              children,
              ...slotProps
            } = props;
            if (reactExports.isValidElement(children)) {
              const childrenRef = getElementRef(children);
              const props2 = mergeProps(slotProps, children.props);
              if (children.type !== reactExports.Fragment) {
                props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
              }
              return reactExports.cloneElement(children, props2);
            }
            return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
          });
          SlotClone.displayName = `${ownerName}.SlotClone`;
          return SlotClone;
        }
        var SLOTTABLE_IDENTIFIER = Symbol("radix.slottable");
        function isSlottable(child) {
          return reactExports.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
        }
        function mergeProps(slotProps, childProps) {
          const overrideProps = {
            ...childProps
          };
          for (const propName in childProps) {
            const slotPropValue = slotProps[propName];
            const childPropValue = childProps[propName];
            const isHandler = /^on[A-Z]/.test(propName);
            if (isHandler) {
              if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args) => {
                  const result = childPropValue(...args);
                  slotPropValue(...args);
                  return result;
                };
              } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
              }
            } else if (propName === "style") {
              overrideProps[propName] = {
                ...slotPropValue,
                ...childPropValue
              };
            } else if (propName === "className") {
              overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
            }
          }
          return {
            ...slotProps,
            ...overrideProps
          };
        }
        function getElementRef(element) {
          let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
          let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.ref;
          }
          getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
          mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
          if (mayWarn) {
            return element.props.ref;
          }
          return element.props.ref || element.ref;
        }
        var SELECTION_KEYS = ["Enter", " "];
        var FIRST_KEYS = ["ArrowDown", "PageUp", "Home"];
        var LAST_KEYS = ["ArrowUp", "PageDown", "End"];
        var FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
        var SUB_OPEN_KEYS = {
          ltr: [...SELECTION_KEYS, "ArrowRight"],
          rtl: [...SELECTION_KEYS, "ArrowLeft"]
        };
        var SUB_CLOSE_KEYS = {
          ltr: ["ArrowLeft"],
          rtl: ["ArrowRight"]
        };
        var MENU_NAME = "Menu";
        var [Collection, useCollection, createCollectionScope] = createCollection(MENU_NAME);
        var [createMenuContext, createMenuScope] = createContextScope$1(MENU_NAME, [createCollectionScope, createPopperScope, createRovingFocusGroupScope]);
        var usePopperScope = createPopperScope();
        var useRovingFocusGroupScope = createRovingFocusGroupScope();
        var [MenuProvider, useMenuContext] = createMenuContext(MENU_NAME);
        var [MenuRootProvider, useMenuRootContext] = createMenuContext(MENU_NAME);
        var Menu = props => {
          const {
            __scopeMenu,
            open = false,
            children,
            dir,
            onOpenChange,
            modal = true
          } = props;
          const popperScope = usePopperScope(__scopeMenu);
          const [content, setContent] = reactExports.useState(null);
          const isUsingKeyboardRef = reactExports.useRef(false);
          const handleOpenChange = useCallbackRef$1(onOpenChange);
          const direction = useDirection(dir);
          reactExports.useEffect(() => {
            const handleKeyDown = () => {
              isUsingKeyboardRef.current = true;
              document.addEventListener("pointerdown", handlePointer, {
                capture: true,
                once: true
              });
              document.addEventListener("pointermove", handlePointer, {
                capture: true,
                once: true
              });
            };
            const handlePointer = () => isUsingKeyboardRef.current = false;
            document.addEventListener("keydown", handleKeyDown, {
              capture: true
            });
            return () => {
              document.removeEventListener("keydown", handleKeyDown, {
                capture: true
              });
              document.removeEventListener("pointerdown", handlePointer, {
                capture: true
              });
              document.removeEventListener("pointermove", handlePointer, {
                capture: true
              });
            };
          }, []);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Root2$4, {
            ...popperScope,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(MenuProvider, {
              scope: __scopeMenu,
              open,
              onOpenChange: handleOpenChange,
              content,
              onContentChange: setContent,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(MenuRootProvider, {
                scope: __scopeMenu,
                onClose: reactExports.useCallback(() => handleOpenChange(false), [handleOpenChange]),
                isUsingKeyboardRef,
                dir: direction,
                modal,
                children
              })
            })
          });
        };
        Menu.displayName = MENU_NAME;
        var ANCHOR_NAME = "MenuAnchor";
        var MenuAnchor = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeMenu,
            ...anchorProps
          } = props;
          const popperScope = usePopperScope(__scopeMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Anchor, {
            ...popperScope,
            ...anchorProps,
            ref: forwardedRef
          });
        });
        MenuAnchor.displayName = ANCHOR_NAME;
        var PORTAL_NAME$1 = "MenuPortal";
        var [PortalProvider, usePortalContext] = createMenuContext(PORTAL_NAME$1, {
          forceMount: void 0
        });
        var MenuPortal = props => {
          const {
            __scopeMenu,
            forceMount,
            children,
            container
          } = props;
          const context = useMenuContext(PORTAL_NAME$1, __scopeMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(PortalProvider, {
            scope: __scopeMenu,
            forceMount,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
              present: forceMount || context.open,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Portal$4, {
                asChild: true,
                container,
                children
              })
            })
          });
        };
        MenuPortal.displayName = PORTAL_NAME$1;
        var CONTENT_NAME$1 = "MenuContent";
        var [MenuContentProvider, useMenuContentContext] = createMenuContext(CONTENT_NAME$1);
        var MenuContent = reactExports.forwardRef((props, forwardedRef) => {
          const portalContext = usePortalContext(CONTENT_NAME$1, props.__scopeMenu);
          const {
            forceMount = portalContext.forceMount,
            ...contentProps
          } = props;
          const context = useMenuContext(CONTENT_NAME$1, props.__scopeMenu);
          const rootContext = useMenuRootContext(CONTENT_NAME$1, props.__scopeMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Collection.Provider, {
            scope: props.__scopeMenu,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
              present: forceMount || context.open,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Collection.Slot, {
                scope: props.__scopeMenu,
                children: rootContext.modal ? /* @__PURE__ */jsxRuntimeExports.jsx(MenuRootContentModal, {
                  ...contentProps,
                  ref: forwardedRef
                }) : /* @__PURE__ */jsxRuntimeExports.jsx(MenuRootContentNonModal, {
                  ...contentProps,
                  ref: forwardedRef
                })
              })
            })
          });
        });
        var MenuRootContentModal = reactExports.forwardRef((props, forwardedRef) => {
          const context = useMenuContext(CONTENT_NAME$1, props.__scopeMenu);
          const ref = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, ref);
          reactExports.useEffect(() => {
            const content = ref.current;
            if (content) return hideOthers(content);
          }, []);
          return /* @__PURE__ */jsxRuntimeExports.jsx(MenuContentImpl, {
            ...props,
            ref: composedRefs,
            trapFocus: context.open,
            disableOutsidePointerEvents: context.open,
            disableOutsideScroll: true,
            onFocusOutside: composeEventHandlers(props.onFocusOutside, event => event.preventDefault(), {
              checkForDefaultPrevented: false
            }),
            onDismiss: () => context.onOpenChange(false)
          });
        });
        var MenuRootContentNonModal = reactExports.forwardRef((props, forwardedRef) => {
          const context = useMenuContext(CONTENT_NAME$1, props.__scopeMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(MenuContentImpl, {
            ...props,
            ref: forwardedRef,
            trapFocus: false,
            disableOutsidePointerEvents: false,
            disableOutsideScroll: false,
            onDismiss: () => context.onOpenChange(false)
          });
        });
        var Slot = createSlot("MenuContent.ScrollLock");
        var MenuContentImpl = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeMenu,
            loop = false,
            trapFocus,
            onOpenAutoFocus,
            onCloseAutoFocus,
            disableOutsidePointerEvents,
            onEntryFocus,
            onEscapeKeyDown,
            onPointerDownOutside,
            onFocusOutside,
            onInteractOutside,
            onDismiss,
            disableOutsideScroll,
            ...contentProps
          } = props;
          const context = useMenuContext(CONTENT_NAME$1, __scopeMenu);
          const rootContext = useMenuRootContext(CONTENT_NAME$1, __scopeMenu);
          const popperScope = usePopperScope(__scopeMenu);
          const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu);
          const getItems = useCollection(__scopeMenu);
          const [currentItemId, setCurrentItemId] = reactExports.useState(null);
          const contentRef = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, contentRef, context.onContentChange);
          const timerRef = reactExports.useRef(0);
          const searchRef = reactExports.useRef("");
          const pointerGraceTimerRef = reactExports.useRef(0);
          const pointerGraceIntentRef = reactExports.useRef(null);
          const pointerDirRef = reactExports.useRef("right");
          const lastPointerXRef = reactExports.useRef(0);
          const ScrollLockWrapper = disableOutsideScroll ? ReactRemoveScroll : reactExports.Fragment;
          const scrollLockWrapperProps = disableOutsideScroll ? {
            as: Slot,
            allowPinchZoom: true
          } : void 0;
          const handleTypeaheadSearch = key => {
            const search = searchRef.current + key;
            const items = getItems().filter(item => !item.disabled);
            const currentItem = document.activeElement;
            const currentMatch = items.find(item => item.ref.current === currentItem)?.textValue;
            const values = items.map(item => item.textValue);
            const nextMatch = getNextMatch(values, search, currentMatch);
            const newItem = items.find(item => item.textValue === nextMatch)?.ref.current;
            (function updateSearch(value) {
              searchRef.current = value;
              window.clearTimeout(timerRef.current);
              if (value !== "") timerRef.current = window.setTimeout(() => updateSearch(""), 1e3);
            })(search);
            if (newItem) {
              setTimeout(() => newItem.focus());
            }
          };
          reactExports.useEffect(() => {
            return () => window.clearTimeout(timerRef.current);
          }, []);
          useFocusGuards();
          const isPointerMovingToSubmenu = reactExports.useCallback(event => {
            const isMovingTowards = pointerDirRef.current === pointerGraceIntentRef.current?.side;
            return isMovingTowards && isPointerInGraceArea(event, pointerGraceIntentRef.current?.area);
          }, []);
          return /* @__PURE__ */jsxRuntimeExports.jsx(MenuContentProvider, {
            scope: __scopeMenu,
            searchRef,
            onItemEnter: reactExports.useCallback(event => {
              if (isPointerMovingToSubmenu(event)) event.preventDefault();
            }, [isPointerMovingToSubmenu]),
            onItemLeave: reactExports.useCallback(event => {
              if (isPointerMovingToSubmenu(event)) return;
              contentRef.current?.focus();
              setCurrentItemId(null);
            }, [isPointerMovingToSubmenu]),
            onTriggerLeave: reactExports.useCallback(event => {
              if (isPointerMovingToSubmenu(event)) event.preventDefault();
            }, [isPointerMovingToSubmenu]),
            pointerGraceTimerRef,
            onPointerGraceIntentChange: reactExports.useCallback(intent => {
              pointerGraceIntentRef.current = intent;
            }, []),
            children: /* @__PURE__ */jsxRuntimeExports.jsx(ScrollLockWrapper, {
              ...scrollLockWrapperProps,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(FocusScope, {
                asChild: true,
                trapped: trapFocus,
                onMountAutoFocus: composeEventHandlers(onOpenAutoFocus, event => {
                  event.preventDefault();
                  contentRef.current?.focus({
                    preventScroll: true
                  });
                }),
                onUnmountAutoFocus: onCloseAutoFocus,
                children: /* @__PURE__ */jsxRuntimeExports.jsx(DismissableLayer, {
                  asChild: true,
                  disableOutsidePointerEvents,
                  onEscapeKeyDown,
                  onPointerDownOutside,
                  onFocusOutside,
                  onInteractOutside,
                  onDismiss,
                  children: /* @__PURE__ */jsxRuntimeExports.jsx(Root, {
                    asChild: true,
                    ...rovingFocusGroupScope,
                    dir: rootContext.dir,
                    orientation: "vertical",
                    loop,
                    currentTabStopId: currentItemId,
                    onCurrentTabStopIdChange: setCurrentItemId,
                    onEntryFocus: composeEventHandlers(onEntryFocus, event => {
                      if (!rootContext.isUsingKeyboardRef.current) event.preventDefault();
                    }),
                    preventScrollOnEntryFocus: true,
                    children: /* @__PURE__ */jsxRuntimeExports.jsx(Content$2, {
                      role: "menu",
                      "aria-orientation": "vertical",
                      "data-state": getOpenState(context.open),
                      "data-radix-menu-content": "",
                      dir: rootContext.dir,
                      ...popperScope,
                      ...contentProps,
                      ref: composedRefs,
                      style: {
                        outline: "none",
                        ...contentProps.style
                      },
                      onKeyDown: composeEventHandlers(contentProps.onKeyDown, event => {
                        const target = event.target;
                        const isKeyDownInside = target.closest("[data-radix-menu-content]") === event.currentTarget;
                        const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
                        const isCharacterKey = event.key.length === 1;
                        if (isKeyDownInside) {
                          if (event.key === "Tab") event.preventDefault();
                          if (!isModifierKey && isCharacterKey) handleTypeaheadSearch(event.key);
                        }
                        const content = contentRef.current;
                        if (event.target !== content) return;
                        if (!FIRST_LAST_KEYS.includes(event.key)) return;
                        event.preventDefault();
                        const items = getItems().filter(item => !item.disabled);
                        const candidateNodes = items.map(item => item.ref.current);
                        if (LAST_KEYS.includes(event.key)) candidateNodes.reverse();
                        focusFirst(candidateNodes);
                      }),
                      onBlur: composeEventHandlers(props.onBlur, event => {
                        if (!event.currentTarget.contains(event.target)) {
                          window.clearTimeout(timerRef.current);
                          searchRef.current = "";
                        }
                      }),
                      onPointerMove: composeEventHandlers(props.onPointerMove, whenMouse(event => {
                        const target = event.target;
                        const pointerXHasChanged = lastPointerXRef.current !== event.clientX;
                        if (event.currentTarget.contains(target) && pointerXHasChanged) {
                          const newDir = event.clientX > lastPointerXRef.current ? "right" : "left";
                          pointerDirRef.current = newDir;
                          lastPointerXRef.current = event.clientX;
                        }
                      }))
                    })
                  })
                })
              })
            })
          });
        });
        MenuContent.displayName = CONTENT_NAME$1;
        var GROUP_NAME$1 = "MenuGroup";
        var MenuGroup = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeMenu,
            ...groupProps
          } = props;
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            role: "group",
            ...groupProps,
            ref: forwardedRef
          });
        });
        MenuGroup.displayName = GROUP_NAME$1;
        var LABEL_NAME$1 = "MenuLabel";
        var MenuLabel = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeMenu,
            ...labelProps
          } = props;
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            ...labelProps,
            ref: forwardedRef
          });
        });
        MenuLabel.displayName = LABEL_NAME$1;
        var ITEM_NAME$1 = "MenuItem";
        var ITEM_SELECT = "menu.itemSelect";
        var MenuItem = reactExports.forwardRef((props, forwardedRef) => {
          const {
            disabled = false,
            onSelect,
            ...itemProps
          } = props;
          const ref = reactExports.useRef(null);
          const rootContext = useMenuRootContext(ITEM_NAME$1, props.__scopeMenu);
          const contentContext = useMenuContentContext(ITEM_NAME$1, props.__scopeMenu);
          const composedRefs = useComposedRefs(forwardedRef, ref);
          const isPointerDownRef = reactExports.useRef(false);
          const handleSelect = () => {
            const menuItem = ref.current;
            if (!disabled && menuItem) {
              const itemSelectEvent = new CustomEvent(ITEM_SELECT, {
                bubbles: true,
                cancelable: true
              });
              menuItem.addEventListener(ITEM_SELECT, event => onSelect?.(event), {
                once: true
              });
              dispatchDiscreteCustomEvent(menuItem, itemSelectEvent);
              if (itemSelectEvent.defaultPrevented) {
                isPointerDownRef.current = false;
              } else {
                rootContext.onClose();
              }
            }
          };
          return /* @__PURE__ */jsxRuntimeExports.jsx(MenuItemImpl, {
            ...itemProps,
            ref: composedRefs,
            disabled,
            onClick: composeEventHandlers(props.onClick, handleSelect),
            onPointerDown: event => {
              props.onPointerDown?.(event);
              isPointerDownRef.current = true;
            },
            onPointerUp: composeEventHandlers(props.onPointerUp, event => {
              if (!isPointerDownRef.current) event.currentTarget?.click();
            }),
            onKeyDown: composeEventHandlers(props.onKeyDown, event => {
              const isTypingAhead = contentContext.searchRef.current !== "";
              if (disabled || isTypingAhead && event.key === " ") return;
              if (SELECTION_KEYS.includes(event.key)) {
                event.currentTarget.click();
                event.preventDefault();
              }
            })
          });
        });
        MenuItem.displayName = ITEM_NAME$1;
        var MenuItemImpl = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeMenu,
            disabled = false,
            textValue,
            ...itemProps
          } = props;
          const contentContext = useMenuContentContext(ITEM_NAME$1, __scopeMenu);
          const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu);
          const ref = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, ref);
          const [isFocused, setIsFocused] = reactExports.useState(false);
          const [textContent, setTextContent] = reactExports.useState("");
          reactExports.useEffect(() => {
            const menuItem = ref.current;
            if (menuItem) {
              setTextContent((menuItem.textContent ?? "").trim());
            }
          }, [itemProps.children]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Collection.ItemSlot, {
            scope: __scopeMenu,
            disabled,
            textValue: textValue ?? textContent,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Item, {
              asChild: true,
              ...rovingFocusGroupScope,
              focusable: !disabled,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
                role: "menuitem",
                "data-highlighted": isFocused ? "" : void 0,
                "aria-disabled": disabled || void 0,
                "data-disabled": disabled ? "" : void 0,
                ...itemProps,
                ref: composedRefs,
                onPointerMove: composeEventHandlers(props.onPointerMove, whenMouse(event => {
                  if (disabled) {
                    contentContext.onItemLeave(event);
                  } else {
                    contentContext.onItemEnter(event);
                    if (!event.defaultPrevented) {
                      const item = event.currentTarget;
                      item.focus({
                        preventScroll: true
                      });
                    }
                  }
                })),
                onPointerLeave: composeEventHandlers(props.onPointerLeave, whenMouse(event => contentContext.onItemLeave(event))),
                onFocus: composeEventHandlers(props.onFocus, () => setIsFocused(true)),
                onBlur: composeEventHandlers(props.onBlur, () => setIsFocused(false))
              })
            })
          });
        });
        var CHECKBOX_ITEM_NAME$1 = "MenuCheckboxItem";
        var MenuCheckboxItem = reactExports.forwardRef((props, forwardedRef) => {
          const {
            checked = false,
            onCheckedChange,
            ...checkboxItemProps
          } = props;
          return /* @__PURE__ */jsxRuntimeExports.jsx(ItemIndicatorProvider, {
            scope: props.__scopeMenu,
            checked,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(MenuItem, {
              role: "menuitemcheckbox",
              "aria-checked": isIndeterminate(checked) ? "mixed" : checked,
              ...checkboxItemProps,
              ref: forwardedRef,
              "data-state": getCheckedState(checked),
              onSelect: composeEventHandlers(checkboxItemProps.onSelect, () => onCheckedChange?.(isIndeterminate(checked) ? true : !checked), {
                checkForDefaultPrevented: false
              })
            })
          });
        });
        MenuCheckboxItem.displayName = CHECKBOX_ITEM_NAME$1;
        var RADIO_GROUP_NAME$1 = "MenuRadioGroup";
        var [RadioGroupProvider, useRadioGroupContext] = createMenuContext(RADIO_GROUP_NAME$1, {
          value: void 0,
          onValueChange: () => {}
        });
        var MenuRadioGroup = reactExports.forwardRef((props, forwardedRef) => {
          const {
            value,
            onValueChange,
            ...groupProps
          } = props;
          const handleValueChange = useCallbackRef$1(onValueChange);
          return /* @__PURE__ */jsxRuntimeExports.jsx(RadioGroupProvider, {
            scope: props.__scopeMenu,
            value,
            onValueChange: handleValueChange,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(MenuGroup, {
              ...groupProps,
              ref: forwardedRef
            })
          });
        });
        MenuRadioGroup.displayName = RADIO_GROUP_NAME$1;
        var RADIO_ITEM_NAME$1 = "MenuRadioItem";
        var MenuRadioItem = reactExports.forwardRef((props, forwardedRef) => {
          const {
            value,
            ...radioItemProps
          } = props;
          const context = useRadioGroupContext(RADIO_ITEM_NAME$1, props.__scopeMenu);
          const checked = value === context.value;
          return /* @__PURE__ */jsxRuntimeExports.jsx(ItemIndicatorProvider, {
            scope: props.__scopeMenu,
            checked,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(MenuItem, {
              role: "menuitemradio",
              "aria-checked": checked,
              ...radioItemProps,
              ref: forwardedRef,
              "data-state": getCheckedState(checked),
              onSelect: composeEventHandlers(radioItemProps.onSelect, () => context.onValueChange?.(value), {
                checkForDefaultPrevented: false
              })
            })
          });
        });
        MenuRadioItem.displayName = RADIO_ITEM_NAME$1;
        var ITEM_INDICATOR_NAME = "MenuItemIndicator";
        var [ItemIndicatorProvider, useItemIndicatorContext] = createMenuContext(ITEM_INDICATOR_NAME, {
          checked: false
        });
        var MenuItemIndicator = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeMenu,
            forceMount,
            ...itemIndicatorProps
          } = props;
          const indicatorContext = useItemIndicatorContext(ITEM_INDICATOR_NAME, __scopeMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
            present: forceMount || isIndeterminate(indicatorContext.checked) || indicatorContext.checked === true,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.span, {
              ...itemIndicatorProps,
              ref: forwardedRef,
              "data-state": getCheckedState(indicatorContext.checked)
            })
          });
        });
        MenuItemIndicator.displayName = ITEM_INDICATOR_NAME;
        var SEPARATOR_NAME$1 = "MenuSeparator";
        var MenuSeparator = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeMenu,
            ...separatorProps
          } = props;
          return /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.div, {
            role: "separator",
            "aria-orientation": "horizontal",
            ...separatorProps,
            ref: forwardedRef
          });
        });
        MenuSeparator.displayName = SEPARATOR_NAME$1;
        var ARROW_NAME$1 = "MenuArrow";
        var MenuArrow = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeMenu,
            ...arrowProps
          } = props;
          const popperScope = usePopperScope(__scopeMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Arrow, {
            ...popperScope,
            ...arrowProps,
            ref: forwardedRef
          });
        });
        MenuArrow.displayName = ARROW_NAME$1;
        var SUB_NAME = "MenuSub";
        var [MenuSubProvider, useMenuSubContext] = createMenuContext(SUB_NAME);
        var SUB_TRIGGER_NAME$1 = "MenuSubTrigger";
        var MenuSubTrigger = reactExports.forwardRef((props, forwardedRef) => {
          const context = useMenuContext(SUB_TRIGGER_NAME$1, props.__scopeMenu);
          const rootContext = useMenuRootContext(SUB_TRIGGER_NAME$1, props.__scopeMenu);
          const subContext = useMenuSubContext(SUB_TRIGGER_NAME$1, props.__scopeMenu);
          const contentContext = useMenuContentContext(SUB_TRIGGER_NAME$1, props.__scopeMenu);
          const openTimerRef = reactExports.useRef(null);
          const {
            pointerGraceTimerRef,
            onPointerGraceIntentChange
          } = contentContext;
          const scope = {
            __scopeMenu: props.__scopeMenu
          };
          const clearOpenTimer = reactExports.useCallback(() => {
            if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
            openTimerRef.current = null;
          }, []);
          reactExports.useEffect(() => clearOpenTimer, [clearOpenTimer]);
          reactExports.useEffect(() => {
            const pointerGraceTimer = pointerGraceTimerRef.current;
            return () => {
              window.clearTimeout(pointerGraceTimer);
              onPointerGraceIntentChange(null);
            };
          }, [pointerGraceTimerRef, onPointerGraceIntentChange]);
          return /* @__PURE__ */jsxRuntimeExports.jsx(MenuAnchor, {
            asChild: true,
            ...scope,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(MenuItemImpl, {
              id: subContext.triggerId,
              "aria-haspopup": "menu",
              "aria-expanded": context.open,
              "aria-controls": subContext.contentId,
              "data-state": getOpenState(context.open),
              ...props,
              ref: composeRefs(forwardedRef, subContext.onTriggerChange),
              onClick: event => {
                props.onClick?.(event);
                if (props.disabled || event.defaultPrevented) return;
                event.currentTarget.focus();
                if (!context.open) context.onOpenChange(true);
              },
              onPointerMove: composeEventHandlers(props.onPointerMove, whenMouse(event => {
                contentContext.onItemEnter(event);
                if (event.defaultPrevented) return;
                if (!props.disabled && !context.open && !openTimerRef.current) {
                  contentContext.onPointerGraceIntentChange(null);
                  openTimerRef.current = window.setTimeout(() => {
                    context.onOpenChange(true);
                    clearOpenTimer();
                  }, 100);
                }
              })),
              onPointerLeave: composeEventHandlers(props.onPointerLeave, whenMouse(event => {
                clearOpenTimer();
                const contentRect = context.content?.getBoundingClientRect();
                if (contentRect) {
                  const side = context.content?.dataset.side;
                  const rightSide = side === "right";
                  const bleed = rightSide ? -5 : 5;
                  const contentNearEdge = contentRect[rightSide ? "left" : "right"];
                  const contentFarEdge = contentRect[rightSide ? "right" : "left"];
                  contentContext.onPointerGraceIntentChange({
                    area: [
                    // Apply a bleed on clientX to ensure that our exit point is
                    // consistently within polygon bounds
                    {
                      x: event.clientX + bleed,
                      y: event.clientY
                    }, {
                      x: contentNearEdge,
                      y: contentRect.top
                    }, {
                      x: contentFarEdge,
                      y: contentRect.top
                    }, {
                      x: contentFarEdge,
                      y: contentRect.bottom
                    }, {
                      x: contentNearEdge,
                      y: contentRect.bottom
                    }],
                    side
                  });
                  window.clearTimeout(pointerGraceTimerRef.current);
                  pointerGraceTimerRef.current = window.setTimeout(() => contentContext.onPointerGraceIntentChange(null), 300);
                } else {
                  contentContext.onTriggerLeave(event);
                  if (event.defaultPrevented) return;
                  contentContext.onPointerGraceIntentChange(null);
                }
              })),
              onKeyDown: composeEventHandlers(props.onKeyDown, event => {
                const isTypingAhead = contentContext.searchRef.current !== "";
                if (props.disabled || isTypingAhead && event.key === " ") return;
                if (SUB_OPEN_KEYS[rootContext.dir].includes(event.key)) {
                  context.onOpenChange(true);
                  context.content?.focus();
                  event.preventDefault();
                }
              })
            })
          });
        });
        MenuSubTrigger.displayName = SUB_TRIGGER_NAME$1;
        var SUB_CONTENT_NAME$1 = "MenuSubContent";
        var MenuSubContent = reactExports.forwardRef((props, forwardedRef) => {
          const portalContext = usePortalContext(CONTENT_NAME$1, props.__scopeMenu);
          const {
            forceMount = portalContext.forceMount,
            ...subContentProps
          } = props;
          const context = useMenuContext(CONTENT_NAME$1, props.__scopeMenu);
          const rootContext = useMenuRootContext(CONTENT_NAME$1, props.__scopeMenu);
          const subContext = useMenuSubContext(SUB_CONTENT_NAME$1, props.__scopeMenu);
          const ref = reactExports.useRef(null);
          const composedRefs = useComposedRefs(forwardedRef, ref);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Collection.Provider, {
            scope: props.__scopeMenu,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Presence, {
              present: forceMount || context.open,
              children: /* @__PURE__ */jsxRuntimeExports.jsx(Collection.Slot, {
                scope: props.__scopeMenu,
                children: /* @__PURE__ */jsxRuntimeExports.jsx(MenuContentImpl, {
                  id: subContext.contentId,
                  "aria-labelledby": subContext.triggerId,
                  ...subContentProps,
                  ref: composedRefs,
                  align: "start",
                  side: rootContext.dir === "rtl" ? "left" : "right",
                  disableOutsidePointerEvents: false,
                  disableOutsideScroll: false,
                  trapFocus: false,
                  onOpenAutoFocus: event => {
                    if (rootContext.isUsingKeyboardRef.current) ref.current?.focus();
                    event.preventDefault();
                  },
                  onCloseAutoFocus: event => event.preventDefault(),
                  onFocusOutside: composeEventHandlers(props.onFocusOutside, event => {
                    if (event.target !== subContext.trigger) context.onOpenChange(false);
                  }),
                  onEscapeKeyDown: composeEventHandlers(props.onEscapeKeyDown, event => {
                    rootContext.onClose();
                    event.preventDefault();
                  }),
                  onKeyDown: composeEventHandlers(props.onKeyDown, event => {
                    const isKeyDownInside = event.currentTarget.contains(event.target);
                    const isCloseKey = SUB_CLOSE_KEYS[rootContext.dir].includes(event.key);
                    if (isKeyDownInside && isCloseKey) {
                      context.onOpenChange(false);
                      subContext.trigger?.focus();
                      event.preventDefault();
                    }
                  })
                })
              })
            })
          });
        });
        MenuSubContent.displayName = SUB_CONTENT_NAME$1;
        function getOpenState(open) {
          return open ? "open" : "closed";
        }
        function isIndeterminate(checked) {
          return checked === "indeterminate";
        }
        function getCheckedState(checked) {
          return isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
        }
        function focusFirst(candidates) {
          const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
          for (const candidate of candidates) {
            if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
            candidate.focus();
            if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
          }
        }
        function wrapArray(array, startIndex) {
          return array.map((_, index) => array[(startIndex + index) % array.length]);
        }
        function getNextMatch(values, search, currentMatch) {
          const isRepeated = search.length > 1 && Array.from(search).every(char => char === search[0]);
          const normalizedSearch = isRepeated ? search[0] : search;
          const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
          let wrappedValues = wrapArray(values, Math.max(currentMatchIndex, 0));
          const excludeCurrentMatch = normalizedSearch.length === 1;
          if (excludeCurrentMatch) wrappedValues = wrappedValues.filter(v => v !== currentMatch);
          const nextMatch = wrappedValues.find(value => value.toLowerCase().startsWith(normalizedSearch.toLowerCase()));
          return nextMatch !== currentMatch ? nextMatch : void 0;
        }
        function isPointInPolygon(point, polygon) {
          const {
            x,
            y
          } = point;
          let inside = false;
          for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const ii = polygon[i];
            const jj = polygon[j];
            const xi = ii.x;
            const yi = ii.y;
            const xj = jj.x;
            const yj = jj.y;
            const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
            if (intersect) inside = !inside;
          }
          return inside;
        }
        function isPointerInGraceArea(event, area) {
          if (!area) return false;
          const cursorPos = {
            x: event.clientX,
            y: event.clientY
          };
          return isPointInPolygon(cursorPos, area);
        }
        function whenMouse(handler) {
          return event => event.pointerType === "mouse" ? handler(event) : void 0;
        }
        var Root3 = Menu;
        var Anchor2 = MenuAnchor;
        var Portal = MenuPortal;
        var Content2$1 = MenuContent;
        var Group = MenuGroup;
        var Label = MenuLabel;
        var Item2$1 = MenuItem;
        var CheckboxItem = MenuCheckboxItem;
        var RadioGroup = MenuRadioGroup;
        var RadioItem = MenuRadioItem;
        var ItemIndicator = MenuItemIndicator;
        var Separator = MenuSeparator;
        var Arrow2 = MenuArrow;
        var SubTrigger = MenuSubTrigger;
        var SubContent = MenuSubContent;
        var DROPDOWN_MENU_NAME = "DropdownMenu";
        var [createDropdownMenuContext] = createContextScope$1(DROPDOWN_MENU_NAME, [createMenuScope]);
        var useMenuScope = createMenuScope();
        var [DropdownMenuProvider, useDropdownMenuContext] = createDropdownMenuContext(DROPDOWN_MENU_NAME);
        var DropdownMenu$1 = props => {
          const {
            __scopeDropdownMenu,
            children,
            dir,
            open: openProp,
            defaultOpen,
            onOpenChange,
            modal = true
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          const triggerRef = reactExports.useRef(null);
          const [open, setOpen] = useControllableState({
            prop: openProp,
            defaultProp: defaultOpen ?? false,
            onChange: onOpenChange,
            caller: DROPDOWN_MENU_NAME
          });
          return /* @__PURE__ */jsxRuntimeExports.jsx(DropdownMenuProvider, {
            scope: __scopeDropdownMenu,
            triggerId: useId(),
            triggerRef,
            contentId: useId(),
            open,
            onOpenChange: setOpen,
            onOpenToggle: reactExports.useCallback(() => setOpen(prevOpen => !prevOpen), [setOpen]),
            modal,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Root3, {
              ...menuScope,
              open,
              onOpenChange: setOpen,
              dir,
              modal,
              children
            })
          });
        };
        DropdownMenu$1.displayName = DROPDOWN_MENU_NAME;
        var TRIGGER_NAME = "DropdownMenuTrigger";
        var DropdownMenuTrigger$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            disabled = false,
            ...triggerProps
          } = props;
          const context = useDropdownMenuContext(TRIGGER_NAME, __scopeDropdownMenu);
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Anchor2, {
            asChild: true,
            ...menuScope,
            children: /* @__PURE__ */jsxRuntimeExports.jsx(Primitive$3.button, {
              type: "button",
              id: context.triggerId,
              "aria-haspopup": "menu",
              "aria-expanded": context.open,
              "aria-controls": context.open ? context.contentId : void 0,
              "data-state": context.open ? "open" : "closed",
              "data-disabled": disabled ? "" : void 0,
              disabled,
              ...triggerProps,
              ref: composeRefs(forwardedRef, context.triggerRef),
              onPointerDown: composeEventHandlers(props.onPointerDown, event => {
                if (!disabled && event.button === 0 && event.ctrlKey === false) {
                  context.onOpenToggle();
                  if (!context.open) event.preventDefault();
                }
              }),
              onKeyDown: composeEventHandlers(props.onKeyDown, event => {
                if (disabled) return;
                if (["Enter", " "].includes(event.key)) context.onOpenToggle();
                if (event.key === "ArrowDown") context.onOpenChange(true);
                if (["Enter", " ", "ArrowDown"].includes(event.key)) event.preventDefault();
              })
            })
          });
        });
        DropdownMenuTrigger$1.displayName = TRIGGER_NAME;
        var PORTAL_NAME = "DropdownMenuPortal";
        var DropdownMenuPortal = props => {
          const {
            __scopeDropdownMenu,
            ...portalProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Portal, {
            ...menuScope,
            ...portalProps
          });
        };
        DropdownMenuPortal.displayName = PORTAL_NAME;
        var CONTENT_NAME = "DropdownMenuContent";
        var DropdownMenuContent$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...contentProps
          } = props;
          const context = useDropdownMenuContext(CONTENT_NAME, __scopeDropdownMenu);
          const menuScope = useMenuScope(__scopeDropdownMenu);
          const hasInteractedOutsideRef = reactExports.useRef(false);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Content2$1, {
            id: context.contentId,
            "aria-labelledby": context.triggerId,
            ...menuScope,
            ...contentProps,
            ref: forwardedRef,
            onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, event => {
              if (!hasInteractedOutsideRef.current) context.triggerRef.current?.focus();
              hasInteractedOutsideRef.current = false;
              event.preventDefault();
            }),
            onInteractOutside: composeEventHandlers(props.onInteractOutside, event => {
              const originalEvent = event.detail.originalEvent;
              const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
              const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
              if (!context.modal || isRightClick) hasInteractedOutsideRef.current = true;
            }),
            style: {
              ...props.style,
              // re-namespace exposed content custom properties
              ...{
                "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
                "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
                "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
                "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
                "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
              }
            }
          });
        });
        DropdownMenuContent$1.displayName = CONTENT_NAME;
        var GROUP_NAME = "DropdownMenuGroup";
        var DropdownMenuGroup = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...groupProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Group, {
            ...menuScope,
            ...groupProps,
            ref: forwardedRef
          });
        });
        DropdownMenuGroup.displayName = GROUP_NAME;
        var LABEL_NAME = "DropdownMenuLabel";
        var DropdownMenuLabel$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...labelProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Label, {
            ...menuScope,
            ...labelProps,
            ref: forwardedRef
          });
        });
        DropdownMenuLabel$1.displayName = LABEL_NAME;
        var ITEM_NAME = "DropdownMenuItem";
        var DropdownMenuItem$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...itemProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Item2$1, {
            ...menuScope,
            ...itemProps,
            ref: forwardedRef
          });
        });
        DropdownMenuItem$1.displayName = ITEM_NAME;
        var CHECKBOX_ITEM_NAME = "DropdownMenuCheckboxItem";
        var DropdownMenuCheckboxItem$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...checkboxItemProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(CheckboxItem, {
            ...menuScope,
            ...checkboxItemProps,
            ref: forwardedRef
          });
        });
        DropdownMenuCheckboxItem$1.displayName = CHECKBOX_ITEM_NAME;
        var RADIO_GROUP_NAME = "DropdownMenuRadioGroup";
        var DropdownMenuRadioGroup = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...radioGroupProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(RadioGroup, {
            ...menuScope,
            ...radioGroupProps,
            ref: forwardedRef
          });
        });
        DropdownMenuRadioGroup.displayName = RADIO_GROUP_NAME;
        var RADIO_ITEM_NAME = "DropdownMenuRadioItem";
        var DropdownMenuRadioItem$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...radioItemProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(RadioItem, {
            ...menuScope,
            ...radioItemProps,
            ref: forwardedRef
          });
        });
        DropdownMenuRadioItem$1.displayName = RADIO_ITEM_NAME;
        var INDICATOR_NAME = "DropdownMenuItemIndicator";
        var DropdownMenuItemIndicator = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...itemIndicatorProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(ItemIndicator, {
            ...menuScope,
            ...itemIndicatorProps,
            ref: forwardedRef
          });
        });
        DropdownMenuItemIndicator.displayName = INDICATOR_NAME;
        var SEPARATOR_NAME = "DropdownMenuSeparator";
        var DropdownMenuSeparator$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...separatorProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Separator, {
            ...menuScope,
            ...separatorProps,
            ref: forwardedRef
          });
        });
        DropdownMenuSeparator$1.displayName = SEPARATOR_NAME;
        var ARROW_NAME = "DropdownMenuArrow";
        var DropdownMenuArrow = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...arrowProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(Arrow2, {
            ...menuScope,
            ...arrowProps,
            ref: forwardedRef
          });
        });
        DropdownMenuArrow.displayName = ARROW_NAME;
        var SUB_TRIGGER_NAME = "DropdownMenuSubTrigger";
        var DropdownMenuSubTrigger$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...subTriggerProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(SubTrigger, {
            ...menuScope,
            ...subTriggerProps,
            ref: forwardedRef
          });
        });
        DropdownMenuSubTrigger$1.displayName = SUB_TRIGGER_NAME;
        var SUB_CONTENT_NAME = "DropdownMenuSubContent";
        var DropdownMenuSubContent$1 = reactExports.forwardRef((props, forwardedRef) => {
          const {
            __scopeDropdownMenu,
            ...subContentProps
          } = props;
          const menuScope = useMenuScope(__scopeDropdownMenu);
          return /* @__PURE__ */jsxRuntimeExports.jsx(SubContent, {
            ...menuScope,
            ...subContentProps,
            ref: forwardedRef,
            style: {
              ...props.style,
              // re-namespace exposed content custom properties
              ...{
                "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
                "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
                "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
                "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
                "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
              }
            }
          });
        });
        DropdownMenuSubContent$1.displayName = SUB_CONTENT_NAME;
        var Root2 = DropdownMenu$1;
        var Trigger = DropdownMenuTrigger$1;
        var Portal2 = DropdownMenuPortal;
        var Content2 = DropdownMenuContent$1;
        var Label2 = DropdownMenuLabel$1;
        var Item2 = DropdownMenuItem$1;
        var CheckboxItem2 = DropdownMenuCheckboxItem$1;
        var RadioItem2 = DropdownMenuRadioItem$1;
        var ItemIndicator2 = DropdownMenuItemIndicator;
        var Separator2 = DropdownMenuSeparator$1;
        var SubTrigger2 = DropdownMenuSubTrigger$1;
        var SubContent2 = DropdownMenuSubContent$1;
        const DropdownMenu = exports("a3", Root2);
        const DropdownMenuTrigger = exports("a4", Trigger);
        const DropdownMenuSubTrigger = reactExports.forwardRef(({
          className,
          inset,
          children,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(SubTrigger2, {
          ref,
          className: cn("flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-gray-100 data-[state=open]:bg-gray-100", inset && "pl-8", className),
          ...props,
          children
        }));
        DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
        const DropdownMenuSubContent = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(SubContent2, {
          ref,
          className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
          ...props
        }));
        DropdownMenuSubContent.displayName = SubContent2.displayName;
        const DropdownMenuContent = exports("a5", reactExports.forwardRef(({
          className,
          sideOffset = 4,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Portal2, {
          children: /* @__PURE__ */jsxRuntimeExports.jsx(Content2, {
            ref,
            sideOffset,
            className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
            ...props
          })
        })));
        DropdownMenuContent.displayName = Content2.displayName;
        const DropdownMenuItem = exports("a6", reactExports.forwardRef(({
          className,
          inset,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Item2, {
          ref,
          className: cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", inset && "pl-8", className),
          ...props
        })));
        DropdownMenuItem.displayName = Item2.displayName;
        const DropdownMenuCheckboxItem = reactExports.forwardRef(({
          className,
          children,
          checked,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsxs(CheckboxItem2, {
          ref,
          className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
          checked,
          ...props,
          children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
            className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
            children: /* @__PURE__ */jsxRuntimeExports.jsx(ItemIndicator2, {
              children: /* @__PURE__ */jsxRuntimeExports.jsx("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "h-4 w-4",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("polyline", {
                  points: "20 6 9 17 4 12"
                })
              })
            })
          }), children]
        }));
        DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
        const DropdownMenuRadioItem = reactExports.forwardRef(({
          className,
          children,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsxs(RadioItem2, {
          ref,
          className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
          ...props,
          children: [/* @__PURE__ */jsxRuntimeExports.jsx("span", {
            className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
            children: /* @__PURE__ */jsxRuntimeExports.jsx(ItemIndicator2, {
              children: /* @__PURE__ */jsxRuntimeExports.jsx("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                viewBox: "0 0 24 24",
                fill: "currentColor",
                className: "h-2 w-2",
                children: /* @__PURE__ */jsxRuntimeExports.jsx("circle", {
                  cx: "12",
                  cy: "12",
                  r: "12"
                })
              })
            })
          }), children]
        }));
        DropdownMenuRadioItem.displayName = RadioItem2.displayName;
        const DropdownMenuLabel = reactExports.forwardRef(({
          className,
          inset,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Label2, {
          ref,
          className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
          ...props
        }));
        DropdownMenuLabel.displayName = Label2.displayName;
        const DropdownMenuSeparator = reactExports.forwardRef(({
          className,
          ...props
        }, ref) => /* @__PURE__ */jsxRuntimeExports.jsx(Separator2, {
          ref,
          className: cn("-mx-1 my-1 h-px bg-gray-200", className),
          ...props
        }));
        DropdownMenuSeparator.displayName = Separator2.displayName;
      }
    };
  });
})();
