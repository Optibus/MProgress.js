(function() {
    "use strict";
    /**
     * Helpers
     */
    var $$utils$$Utils = {
        extend: function(newObj, targetObj) {
            targetObj = JSON.parse(JSON.stringify(targetObj));
            if (typeof newObj === 'string') {
                return targetObj;
            }

            var key, value;
            for (var key in newObj) {
                value = newObj[key];
                if (newObj.hasOwnProperty(key) && value !== undefined) {
                    targetObj[key] = value;
                }
            }

            return targetObj;
        },

        /**
         * Queues a function to be executed.
         */

        queue: (function() {
            var pending = [];

            function next() {
                var fn = pending.shift();
                if (fn) {
                    fn(next);
                }
                }

                return function(fn) {
                    pending.push(fn);
                    if (pending.length == 1) next();
                };
            })(),

            /**
             * Applies css properties to an element, similar to the jQuery 
             * setcss method.
             *
             * While this helper does assist with vendor prefixed property names, it 
             * does not perform any manipulation of values prior to setting styles.
             */
            setcss: (function() {
                var cssPrefixes = [ 'Webkit', 'O', 'Moz', 'ms' ],
                cssProps    = {};

                function camelCase(string) {
                    return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function(match, letter) {
                        return letter.toUpperCase();
                    });
                }

                function getVendorProp(name) {
                    var style = document.body.style;
                    if (name in style) return name;

                    var i = cssPrefixes.length,
                    capName = name.charAt(0).toUpperCase() + name.slice(1),
                    vendorName;
                    while (i--) {
                        vendorName = cssPrefixes[i] + capName;
                        if (vendorName in style) return vendorName;
                    }

                    return name;
                }

                function getStyleProp(name) {
                    name = camelCase(name);
                    return cssProps[name] || (cssProps[name] = getVendorProp(name));
                }

                function applyCss(element, prop, value) {
                    prop = getStyleProp(prop);
                    element.style[prop] = value;
                }

                return function(element, properties) {
                    var args = arguments,
                    prop, 
                    value;

                    if (args.length == 2) {
                        for (prop in properties) {
                            value = properties[prop];
                            if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
                        }
                    } else {
                        applyCss(element, args[1], args[2]);
                    }
                }
            })(),

            clamp: function(n, min, max) {
                if (n < min) return min;
                if (n > max) return max;
                return n;
            },

            /**
             * converts a percentage (`0..1`) to a bar translateX
             * percentage (`-100%..0%`).
             */
            toBarPerc: function(n) {
                return (-1 + n) * 100;
            },

            hasClass: function(element, name) {
                var list = typeof element == 'string' ? element : $$utils$$Utils.classList(element);
                return list.indexOf(' ' + name + ' ') >= 0;
            },

            addClass: function(element, name) {
                var oldList = $$utils$$Utils.classList(element),
                newList = oldList + name;

                if ($$utils$$Utils.hasClass(oldList, name)) return; 

                // Trim the opening space.
                element.className = newList.substring(1);
            },

            removeClass: function(element, name) {
                var oldList = $$utils$$Utils.classList(element),
                newList;

                if (!$$utils$$Utils.hasClass(element, name)) return;

                // Replace the class name.
                newList = oldList.replace(' ' + name + ' ', ' ');

                // Trim the opening and closing spaces.
                element.className = newList.substring(1, newList.length - 1);
            },

            showEl: function(element) {
                $$utils$$Utils.setcss(element, {
                    display: 'block'
                });
            },

            hideEl: function(element) {
                $$utils$$Utils.setcss(element, {
                    display: 'none'
                });
            },

            classList: function(element) {
                return (' ' + (element.className || '') + ' ').replace(/\s+/gi, ' ');
            },

            /**
             * Removes an element from the DOM.
             */
            removeElement: function(element) {
                element && element.parentNode && element.parentNode.removeChild(element);
            }
    };

    var $$utils$$default = $$utils$$Utils;
    (function(root, factory) {
        // UMD
        if (typeof define === 'function' && define.amd) {
            define(factory);
        } else if (typeof exports === 'object') {
            module.exports = factory();
        } else {
            root.Mprogress = factory();
        }

    })(typeof window !== 'undefined' ? window : this, function() {


        'use strict';

        var SETTINGS = {
            template: 1,
            parent: 'body',
            start: false,

            minimum: 0.08,
            easing: 'ease',
            positionUsing: '',
            speed: 200,
            trickle: true,
            trickleRate: 0.02,
            trickleSpeed: 800
        };

        var TPL_UNKOWN_ID = '99';
        var SPEED_ANIMATION_SHOW = 500;
        var SPEED_ANIMATION_HIDE = 1500;
        var SELECTOR_BAR = '[role="mpbar"]';
        var SELECTOR_BUFFER = '[role="bufferBar"]';
        var SELECTOR_DASHED = '[role="dashed"]';

        var renderTemplate = {

            determinate:    '<div class="deter-bar" role="mpbar1">'+
                                '<div class="peg"></div>'+
                            '</div>'+
                            '<div class="bar-bg"></div>',

            buffer:         '<div class="deter-bar" role="mpbar2">'+
                                '<div class="peg"></div>'+
                            '</div>'+
                            '<div class="buffer-bg" role="bufferBar"></div>' +
                            '<div class="mp-ui-dashed" role="dashed"></div>',

            indeterminate:  '<div class="indeter-bar" role="mpbar3">'+
                            '</div>'+ 
                            '<div class="bar-bg"></div>', 

            query:          '<div class="query-bar" role="mpbar4">'+
                                '<div class="peg"></div>'+
                            '</div>'+ 
                            '<div class="bar-bg"></div>'
        };

        var cacheStore = {};

        var Mprogress = function(opt) {
            var options = $$utils$$default.extend(opt, SETTINGS);
            var idName  = options.parent + options.template;
            var data    = cacheStore[idName] || '';

            if(!data){
                data = new MProgress(options);
                cacheStore[idName] = data;
            }
            
            if(typeof opt === 'string' && typeof data[opt] === 'function') {
                // using like: Mprogress('start');
                data[opt]();
            } else if (options['start']) {
                data.start();
            }

            return data;
        };

        var MProgress = function(options){
            this.options = options || {};
            this.status = null; //Last number
            this.bufferStatus = null;
        };


        MProgress.prototype = {

            version : '0.1.0',

            constructor: MProgress,

            /**
             * Shows the progress bar.
             * This is the same as setting the status to 0%, except that it doesn't go backwards.
             *
             *     MProgress.start();
             *
             */
            start: function() {
                if (!this.status && !this._isBufferStyle()) this.set(0);

                /**
                 * indeterminate and query just have 'start' and 'end' method 
                 */
                if (this._isIndeterminateStyle() || this._isQueryStyle()) {
                    return this;
                }

                var that = this;
                // buffer show front dashed scroll
                if ( this._isBufferStyle() && !this.bufferStatus ) {
                    
                    var progress = this._render();
                    var dashed   = progress.querySelector(SELECTOR_DASHED);
                    var bar = progress.querySelector(this._getCurrSelector());

                    $$utils$$default.hideEl(bar);
                    $$utils$$default.hideEl(dashed);
                    this.setBuffer(0).setBuffer(1);

                    setTimeout(function(){
                        $$utils$$default.showEl(dashed);
                        $$utils$$default.showEl(bar);

                        that.set(0).setBuffer(0);
                    }, SPEED_ANIMATION_SHOW);
                }

                function work() {
                    setTimeout(function() {
                        if (!that.status) return;
                        that._trickle();
                        work();
                    }, that.options.trickleSpeed);
                };

                if (this.options.trickle) work();

                return this;
            },

             /**
             * Hides the progress bar.
             * This is the *sort of* the same as setting the status to 100%, with the
             * difference being `end()` makes some placebo effect of some realistic motion.
             *
             *     MProgress.end();
             *
             * If `true` is passed, it will show the progress bar even if its hidden.
             *
             *     MProgress.end(true);
             */
            end: function(force) {
                if (!force && !this.status) return this;

                var that    = this;
                var speed   = this.options.speed;
                var progress = this._getRenderedId();

                if (this._isBufferStyle() && force) {
                    return this.set(0).set(1);
                }

                if (this._isIndeterminateStyle()) {

                    // force end
                    if(!this._isRendered() && force) {
                        this.set(0);
                        progress = this._getRenderedId();
                        speed = SPEED_ANIMATION_SHOW;
                    }
                    // Fade out
                    $$utils$$default.setcss(progress, { 
                        transition: 'none', 
                        opacity: 1 
                    });
                    progress.offsetWidth; /* Repaint */

                    setTimeout(function() {
                        $$utils$$default.setcss(progress, { 
                            transition: 'all ' + speed + 'ms linear', 
                            opacity: 0 
                        });
                        setTimeout(function() {
                            that._remove();
                        }, speed);
                    }, speed);

                    return this;
                }

                if (this._isQueryStyle()) {
                    // add one more animation and remove it
                    if (this._isRendered()) {
                        var bar = progress.querySelector(this._getCurrSelector());
                        $$utils$$default.addClass(bar, 'end');

                        setTimeout(function(){
                            that._remove();
                        }, SPEED_ANIMATION_HIDE);

                        return this;
                    } else if(force) {
                        this.set(0);
                        progress = this._getRenderedId();
                        setTimeout(function(){
                            that._remove();
                        }, SPEED_ANIMATION_HIDE);
                        return this;
                    }

                }

                return this.inc(0.3 + 0.5 * Math.random()).set(1);
            },

            /**
             * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
             *
             *     MProgress.set(0.4);
             *     MProgress.set(1.0);
             */
            set: function(n) {
                n = $$utils$$default.clamp(n, this.options.minimum, 1);
                this.status = (n === 1 ? null : n);

                this._setProgress(this._getCurrSelector(), n);

                return this;
            },

            setBuffer: function(n) {
                n = $$utils$$default.clamp(n, this.options.minimum, 1);
                this.bufferStatus = (n === 1 ? null : n);

                this._setProgress(SELECTOR_BUFFER, n);

                return this;
            },

             /**
             * Increments by a random amount.
             */
            inc: function(amount) {
                var n = this.status;
                var bn = this.bufferStatus;

                if (!n) {
                    return this.start();
                } else {
                    n = this._getRandomNum(n, amount);
                    if ( this._isBufferStyle()) {
                        bn = this._getRandomNum( bn > n ? bn : n + 0.1, amount);
                        this.setBuffer(bn);
                    }
                    return this.set(n);
                }
            },

            _trickle: function() {
                return this.inc(Math.random() * this.options.trickleRate);
            },
            /**
             * (Internal) renders the progress bar markup based on the `template`
             * 
             */
            _render: function(noFromStart) {
                if (this._isRendered()) {
                    return this._getRenderedId();
                }

                var progress = document.createElement('div');
                var currTpl  = this._getCurrTemplate() || '';
                var MParent  = document.querySelector(this.options.parent);
                var fromStart;
                
                progress.id = this._getRenderedId(true);
                progress.className = 'ui-mprogress';
                progress.innerHTML = currTpl;

                if (!this._isIndeterminateStyle() && !this._isQueryStyle()) {

                    // Default: fromstart
                    if (!noFromStart) {
                        fromStart = !this._isStarted(); 
                    }

                    var bar      = progress.querySelector(this._getCurrSelector());
                    var perc     = fromStart ? '-100' : $$utils$$default.toBarPerc(this.status || 0);

                    $$utils$$default.setcss(bar, {
                        transition: 'all 0 linear',
                        transform: 'translate3d(' + perc + '%,0,0)'
                    });



                    if ( this._isBufferStyle() ) {
                        var buffer  = progress.querySelector(SELECTOR_BUFFER),
                        bufferPerc = fromStart ? '-100' : $$utils$$default.toBarPerc(this.bufferStatus || 0);
                        $$utils$$default.setcss(buffer, {
                            transition: 'all 0 linear',
                            transform: 'translate3d(' + bufferPerc + '%,0,0)'
                        });
                    }

                }

                if (MParent != document.body) {
                    $$utils$$default.addClass(MParent, 'mprogress-custom-parent');
                }

                MParent.appendChild(progress);
                return progress;
            },

            /**
             * Removes the element. Opposite of _render().
             */
            _remove: function() {
                var progress = this._getRenderedId(),
                MParent   = document.querySelector(this.options.parent);

                // stop this proccess if the progress was allready removed
                if (!MParent) return;

                if (MParent != document.body) {
                    $$utils$$default.removeClass(MParent, 'mprogress-custom-parent');
                }

                // clear cache 
                var idName  = this.options.parent + this.options.template;
                if  (cacheStore[idName]) {
                    cacheStore[idName] = null;
                }

                if (progress) {
                    this.status = null;
                    this.bufferStatus = null;
                    $$utils$$default.removeElement(progress);
                }
            },

            /**
             * interior method 
             *
             */
            _setProgress: function(barSelector, n){
                var progress = this._render();
                var bar      = progress.querySelector(barSelector);
                var speed    = this.options.speed;
                var ease     = this.options.easing;
                var that     = this;

                progress.offsetWidth; /* Repaint */ 

                /**
                 * indeterminate and query just has 'start' and 'end' method 
                 */

                if (this._isIndeterminateStyle() || this._isQueryStyle()) {
                    return this;
                }

                $$utils$$default.queue(function(next) {
                    // Set positionUsing if it hasn't already been set
                    if (that.options.positionUsing === '') that.options.positionUsing = that._getPositioningCSS();

                    // Add transition
                    $$utils$$default.setcss(bar, that._barPositionCSS(n, speed, ease));

                    if (n === 1) {
                        // Fade out
                        $$utils$$default.setcss(progress, { 
                            transition: 'none', 
                            opacity: 1 
                        });
                        progress.offsetWidth; /* Repaint */

                        setTimeout(function() {
                            $$utils$$default.setcss(progress, { 
                                transition: 'all ' + speed + 'ms linear', 
                                opacity: 0 
                            });
                            setTimeout(function() {
                                that._remove();
                                next();
                            }, speed);
                        }, speed);
                    } else {
                        setTimeout(next, speed);
                    }
                });


            },

            _getCurrSelector: function(){
                var tplType = this._getCurrTplId();

                if (tplType !== TPL_UNKOWN_ID) {
                    return '[role="mpbar' + tplType + '"]' 
                } else {
                    return SELECTOR_BAR; 
                }
            },

            _isStarted : function() {
                return typeof this.status === 'number';
            },

            _getRandomNum: function(n, amount) {
                if (typeof amount !== 'number') {
                    amount = (1 - n) * $$utils$$default.clamp(Math.random() * n, 0.1, 0.95);
                }

                n = $$utils$$default.clamp(n + amount, 0, 0.994); 

                return n;
            },

            /**
             * Checks if the progress bar is rendered.
             */
            _isRendered: function() {

                return !!this._getRenderedId();
            },

            _getRenderedId: function(getId) {

                var tplType = this._getCurrTplId();
                var idName = 'mprogress' + tplType;

                if(!getId){
                    return document.getElementById(idName);
                } else {
                    return idName;
                }
            },

            _isBufferStyle: function() {
                return this._getCurrTplId() === 2;
            }, 

            _isIndeterminateStyle: function() {
                return this._getCurrTplId() === 3;
            },

            _isQueryStyle: function() {
                return this._getCurrTplId() === 4;
            },

            _getCurrTplId: function() {
                var tplType = ~~this.options.template || 1;
                if (typeof tplType === 'number') {
                    return tplType;
                } else {
                    return TPL_UNKOWN_ID;
                } 

            },

            _getCurrTemplate: function() {
                var tplType = this.options.template || 1,
                tplNameArr = ['determinate', 'buffer', 'indeterminate', 'query'],
                tplKey;

                if (typeof ~~tplType === 'number') {
                    tplKey = tplNameArr[tplType - 1];
                    return renderTemplate[tplKey] || '';
                }

                if (typeof tplType === 'string') {
                    return template;
                }
            },

            /**
             * Determine which positioning CSS rule to use.
             */
            _getPositioningCSS: function() {
                // Sniff on document.body.style
                var bodyStyle = document.body.style;

                // Sniff prefixes
                var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
                    ('MozTransform' in bodyStyle) ? 'Moz' :
                    ('msTransform' in bodyStyle) ? 'ms' :
                    ('OTransform' in bodyStyle) ? 'O' : '';

                if (vendorPrefix + 'Perspective' in bodyStyle) {
                    // Modern browsers with 3D support, e.g. Webkit, IE10
                    return 'translate3d';
                } else if (vendorPrefix + 'Transform' in bodyStyle) {
                    // Browsers without 3D support, e.g. IE9
                    return 'translate';
                } else {
                    // Browsers without translate() support, e.g. IE7-8
                    return 'margin';
                }
            },

            /**
             * (Internal) returns the correct CSS for changing the bar's
             * position given an n percentage, and speed and ease from Settings
             */
            _barPositionCSS: function(n, speed, ease) {
                var barCSS;

                if (this.options.positionUsing === 'translate3d') {
                    barCSS = { transform: 'translate3d('+$$utils$$default.toBarPerc(n)+'%,0,0)' };
                } else if (this.options.positionUsing === 'translate') {
                    barCSS = { transform: 'translate('+$$utils$$default.toBarPerc(n)+'%,0)' };
                } else {
                    barCSS = { 'margin-left': $$utils$$default.toBarPerc(n)+'%' };
                }

                barCSS.transition = 'all '+speed+'ms '+ease;

                return barCSS;
            }

        };

        /**
         * Waits for all supplied jQuery or Zepto promises and
         * increases the progress as the promises resolve.
         * 
         * @param $promise jQuery or Zepto Promise
         */
        (function() {
            var initial = 0, current = 0;

            MProgress.prototype.promise = function($promise) {
                if (!$promise || $promise.state() == "resolved") {
                    return this;
                }

                var that = this;

                if (current == 0) {
                    that.start();
                }

                initial++;
                current++;

                $promise.always(function() {
                    current--;
                    if (current == 0) {
                        initial = 0;
                        that.end();
                    } else {
                        that.set((initial - current) / initial);
                    }
                });

                return this;
            };

        })();

        return Mprogress;
    });
}).call(this);