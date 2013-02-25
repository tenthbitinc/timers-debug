
var TimersDebug = function TimersDebug() {
    this.oldSetTimeout = setTimeout;
    this.oldClearTimeout = clearTimeout;
    this.oldSetInterval = setInterval;
    this.oldClearInterval = clearInterval;
    this.enabled = false;
    this.uniqueIDs = {};
    this.uniqueSequence = 0;
};

module.timerDebugGlobal = null;

module.exports.enable = function (shouldEnable) {
    if (!module.timerDebugGlobal) {
        module.timerDebugGlobal = new TimersDebug();
    }
    module.timerDebugGlobal.enable(shouldEnable);
};

module.exports.debug = function () {
    if (module.timerDebugGlobal && module.timerDebugGlobal.enabled) {
        module.timerDebugGlobal.debug();
    } else {
        console.log('called timers-debug.debug() but timer debugging is not enabled');
    }
};

TimersDebug.prototype.enable = function (shouldEnable) {
    if (this.enabled == shouldEnable) {
        return;
    }


    if (shouldEnable) {
        setTimeout = this.setTimeout.bind(this);
        clearTimeout = this.clearTimeout.bind(this);
        setInterval = this.setInterval.bind(this);
        clearInterval = this.clearInterval.bind(this);
        this.enabled = true;
    } else {
        setTimeout = this.oldSetTimeout;
        clearTimeout = this.oldClearTimeout;
        setInterval = this.oldSetInterval;
        clearInterval = this.oldClearInterval;
        this.enabled = false;
    }
};

TimersDebug.prototype.setTimeout = function (f, t) {
    var self = this;

    var uniqueID = null;
    var timerID = this.oldSetTimeout(function () {
        console.log('timeoutFired ' + uniqueID);
        self.retireUniqueIDForTimer(timerID);
        f();
    }, t);
    uniqueID = this.uniqueIDForTimer(timerID);
    console.log('setTimeout ' + uniqueID);
    return timerID;
};

TimersDebug.prototype.clearTimeout = function (timerID) {
    var uniqueID = this.uniqueIDForTimer(timerID);
    console.log('clearTimeout ' + uniqueID);
    this.retireUniqueIDForTimer(timerID);
    return this.oldClearTimeout(timerID);
};

TimersDebug.prototype.setInterval = function (f, t) {
    var timerID = this.oldSetInterval(f, t);
    var uniqueID = this.uniqueIDForTimer(timerID);
    console.log('setInterval ' + uniqueID);
    return timerID;
};

TimersDebug.prototype.clearInterval = function (timerID) {
    var uniqueID = this.uniqueIDForTimer(timerID);
    console.log('clearInterval ' + uniqueID);
    this.retireUniqueIDForTimer(timerID);
    return this.oldClearInterval(timerID);
};

TimersDebug.prototype.uniqueIDForTimer = function (timerID) {
    if (timerID.debugUniqueID) {
        return timerID.debugUniqueID;
    }

    this.uniqueSequence += 1;
    var uniqueID = this.uniqueSequence;
    timerID.debugUniqueID = uniqueID;
    this.uniqueIDs[uniqueID] = {
        'timer': timerID,
        'stack': (new Error()).stack
    };
    return uniqueID;
};

TimersDebug.prototype.retireUniqueIDForTimer = function (timerID) {
    if (!timerID.debugUniqueID) {
        return;
    }
    var uniqueID =  timerID.debugUniqueID;
    delete timerID['debugUniqueID'];
    delete this.uniqueIDs[uniqueID];
};

TimersDebug.prototype.debug = function () {
    var activeTimers = [];
    var uniqueID;
    for (uniqueID in this.uniqueIDs) {
        if (this.uniqueIDs.hasOwnProperty(uniqueID)) {
            activeTimers.push([uniqueID, this.uniqueIDs[uniqueID].stack]);
        }
    }
    if (activeTimers.length) {
        activeTimers.forEach(function (activeTimer) {
            console.log('active timer #' + activeTimer[1], activeTimer[1]);
        });
    } else {
        console.log('No active timers found');
    }
};
