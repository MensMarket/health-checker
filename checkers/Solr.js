/**
 * Created by lmiranda on 3/15/16.
 */
module.exports = (function () {

    var q = require('q');
    var request = require('request');

    var EC2 = require('../utils/EC2');
    var CheckerResult = require('../utils/CheckerResult');

    function getSolrInstances() {
        return new EC2().getInstanceByTag([
            {
                Key: 'opsworks:stack',
                Value: 'Solr - Slave'
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
        var coreDataUrl = 'http://' + instance.PublicIpAddress + '/solr/admin/cores?wt=json';
        var messages = [];
        var failCount = 0;


        request(coreDataUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                var cores = data.status;

                for (var core in cores) {
                    var status = cores[core];
                    var lastModifiedDate = new Date(status.index.lastModified);
                    var diffDate = new Date();

                    diffDate.setMinutes(diffDate.getTime() - 15);

                    if (lastModifiedDate.getTime() < diffDate.getTime()) {
                        messages.push('core ' + core + ' is out of date');
                        failCount++;
                    } else {
                        messages.push('core ' + core + ' last index: ' + lastModifiedDate.toLocaleString());
                    }
                }

                if (failCount > 0) {
                    defer.reject(messages);
                } else {
                    defer.resolve(messages)
                }
            }
        });

        return defer.promise;
    }

    function doCheck() {
        var defer = q.defer();

        getSolrInstances().then(function (instances) {
            if (!instances.length) {
                return;
            }

            var checks = [];
            var results = [];

            instances.forEach(function (item) {

                var checkerResult = new CheckerResult();

                checkerResult.setName(getInstanceName(item));

                var check = checkInstance(item).then(function (messages) {
                    checkerResult.setStatus(CheckerResult.STATUS_OK);
                    checkerResult.setMessage(messages);

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