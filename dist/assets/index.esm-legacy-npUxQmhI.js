;
(function () {
  System.register(['./index.esm-legacy-Bq5xrBGm.js'], function (exports, module) {
    'use strict';

    var registerVersion;
    return {
      setters: [module => {
        registerVersion = module.r;
        exports({
          FirebaseError: module.F,
          _DEFAULT_ENTRY_NAME: module.D,
          _addComponent: module._,
          _apps: module.a,
          _components: module.b,
          _getProvider: module.c,
          _registerComponent: module.d,
          _serverApps: module.e,
          getApp: module.g,
          initializeApp: module.i,
          registerVersion: module.r
        });
      }],
      execute: function () {
        var name = "firebase";
        var version = "12.6.0";

        /**
         * @license
         * Copyright 2020 Google LLC
         *
         * Licensed under the Apache License, Version 2.0 (the "License");
         * you may not use this file except in compliance with the License.
         * You may obtain a copy of the License at
         *
         *   http://www.apache.org/licenses/LICENSE-2.0
         *
         * Unless required by applicable law or agreed to in writing, software
         * distributed under the License is distributed on an "AS IS" BASIS,
         * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
         * See the License for the specific language governing permissions and
         * limitations under the License.
         */
        registerVersion(name, version, 'app');
      }
    };
  });
})();
