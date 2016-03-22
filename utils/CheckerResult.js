/**
 * Created by lmiranda on 3/15/16.
 */
function CheckerResult() {
    this.name = null;
    this.timestamp = +(new Date());
    this.status = null;
    this.message = null;
}

CheckerResult.STATUS_NOK = 0;
CheckerResult.STATUS_OK = 1;

CheckerResult.prototype.setName = function (name) {
    this.name = name;
};

CheckerResult.prototype.setTimestamp = function (timestamp) {
    this.timestamp = timestamp;
};

CheckerResult.prototype.setStatus = function (status) {
    this.status = status;
};

CheckerResult.prototype.setMessage = function (message) {
    this.message = message;
};

module.exports = CheckerResult;