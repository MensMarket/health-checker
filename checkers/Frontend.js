/**
 * Created by lmiranda on 3/21/16.
 */
module.exports = services = (function () {

    var q = require('q');
    var request = require('request');

    var EC2 = require('../utils/EC2');
    var CheckerResult = require('../utils/CheckerResult');

    function getInstances() {
        return new EC2().getInstanceByTag([
            {
                Key: 'opsworks:stack',
                Value: 'Store'
            }
        ]);
    }

    function getInstanceName(instance) {
        var name = null;

        if (instance.Tags) {
            instance.Tags.forEach(function (tag) {
                if (tag.Key == 'Name') {
                    name = tag.Value;
                }
            });
        }

        return name;
    }

    function checkInstance(instance) {
        var defer = q.defer();
        var coreDataUrl = 'http://' + instance.PublicIpAddress + '/elb-probe';
        var messages = [];
        var failCount = 0;


        request(coreDataUrl, function (error, response, body) {
            if (response.statusCode !== 200) {
                messages.push('service status: ' + response.statusCode);
                failCount++;
            }

            if (failCount > 0) {
                defer.reject(messages);
            } else {
                defer.resolve()
            }
        });

        return defer.promise;
    }

    function doCheck() {
        var defer = q.defer();

        getInstances().then(function (instances) {
            if (!instances.length) {
                return;
            }

            var checks = [];
            var results = [];

            instances.forEach(function (item) {

                var checkerResult = new CheckerResult();

                checkerResult.setName(getInstanceName(item));

                var check = checkInstance(item).then(function () {
                    checkerResult.setStatus(CheckerResult.STATUS_OK);
                    checkerResult.setMessage(null);

                    results.push(checkerResult);
                }).fail(function (error) {
                    checkerResult.setStatus(CheckerResult.STATUS_NOK);
                    checkerResult.setMessage(error);

                    results.push(checkerResult);
                });

                checks.push(check);
            });

            q.all(checks).then(function () {
                defer.resolve(results)
            });
        });

        return defer.promise;
    }

    return {
        check: doCheck
    };

})();