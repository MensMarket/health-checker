/**
 * Created by lmiranda on 3/15/16.
 */
var AWS = require('aws-sdk');
var q = require('Q');

function hasTags(instanceTags, tags) {
    var tagsFound = 0;

    for (var it = 0; it < instanceTags.length; it++) {
        var instanceTag = JSON.stringify(instanceTags[it]);
        for (var t = 0; t < tags.length; t++) {
            if (instanceTag == JSON.stringify(tags[t])) {
                tagsFound++;
            }
        }
    }

    return tagsFound == tags.length;
}

function EC2() {
    this.service = new AWS.EC2({
        region: 'sa-east-1'
    });
}

EC2.prototype.getInstanceByTag = function (tags) {
    var defer = q.defer();
    var foundInstances = [];

    this.service.describeInstances(function (error, data) {
        if (error) {
            console.log(error); // an error occurred
        } else {
            var reservations = data.Reservations;
            if (reservations.length > 0) {
                for (var r = 0; r < reservations.length; r++) {
                    var instances = reservations[r].Instances;
                    for (var i = 0; i < instances.length; i++) {
                        var current = instances[i];
                        if (current.State.Name != 'running') {
                            continue;
                        }

                        if (hasTags(current.Tags, tags)) {
                            foundInstances.push(current);
                        }
                    }
                }

                defer.resolve(foundInstances);
            }
        }
    });

    return defer.promise;
};

module.exports = EC2;