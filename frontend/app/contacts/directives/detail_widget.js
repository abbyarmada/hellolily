angular.module('app.contacts.directives').directive('contactDetailWidget', contactDetailWidget);

function contactDetailWidget() {
    return {
        restrict: 'E',
        scope: {
            contact: '=',
            height: '=',
            updateCallback: '&',
        },
        templateUrl: 'contacts/directives/detail_widget.html',
        controller: ContactDetailWidgetController,
        controllerAs: 'vm',
        bindToController: true,
    };
}

ContactDetailWidgetController.$inject = ['Settings'];
function ContactDetailWidgetController(Settings) {
    var vm = this;

    vm.settings = Settings;

    vm.updateModel = updateModel;

    function updateModel(data, field) {
        return vm.updateCallback()(data, field);
    }
}

