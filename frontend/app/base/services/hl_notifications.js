angular.module('app.services').service('HLNotifications', HLNotifications);

HLNotifications.$inject = ['$state', 'LocalStorage'];
function HLNotifications($state, LocalStorage) {
    var storage = new LocalStorage('notificationTab');

    var timestamp = storage.getObjectValue('timestamp', false);
    var dateNow = new Date();
    var sendNotification = false;

    setInterval(function() {
        dateNow = new Date();
        timestamp = storage.getObjectValue('timestamp', false);

        if (!timestamp || timestamp < dateNow.getTime() - 3000) {
            storage.putObjectValue('timestamp', dateNow.getTime());
            sendNotification = true;
            setInterval(function() {
                storage.putObjectValue('timestamp', dateNow.getTime());
            }, 1000);
        }
    }, 2000);

    this.send = function(data) {
        if (sendNotification) {
            if (!('Notification' in window)) {
                toastr.error('This browser does not support desktop notification');
            } else if (Notification.permission === 'granted') {
                _makeNotification(data);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission(function(permission) {
                    if (permission === 'granted') {
                        _makeNotification(data);
                    }
                });
            }
        }
    };

    function _makeNotification(data) {
        var notification = new Notification(data.title, {body: data.body});

        notification.onclick = function() {
            if ('link' in data) {
                if ('id' in data.link) {
                    $state.go(data.link.view, {id: data.link.id}, {reload: true});
                } else {
                    $state.go(data.link.view, {reload: true});
                }
            }
            ga('send', 'event', 'Caller info', 'Open', 'Popup');
        };
    }
}
