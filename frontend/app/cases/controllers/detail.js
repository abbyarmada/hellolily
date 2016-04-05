angular.module('app.cases').config(caseConfig);

caseConfig.$inject = ['$stateProvider'];
function caseConfig($stateProvider) {
    $stateProvider.state('base.cases.detail', {
        url: '/{id:[0-9]{1,}}',
        views: {
            '@': {
                templateUrl: 'cases/controllers/detail.html',
                controller: CaseDetailController,
                controllerAs: 'vm',
            },
        },
        ncyBreadcrumb: {
            label: '{{ case.subject }}',
        },
        resolve: {
            caseItem: ['Case', '$stateParams', function(Case, $stateParams) {
                var id = $stateParams.id;
                return Case.get({id: id}).$promise;
            }],
        },
    });
}

angular.module('app.cases').controller('CaseDetailController', CaseDetailController);

CaseDetailController.$inject = ['$scope', 'Settings', 'Account', 'CaseStatuses', 'caseItem', 'Contact',
    'UserTeams', 'HLResource', 'Tenant'];
function CaseDetailController($scope, Settings, Account, CaseStatuses, caseItem, Contact,
                              UserTeams, HLResource, Tenant) {
    var vm = this;

    Settings.page.setAllTitles('detail', caseItem.subject, caseItem.contact, caseItem.account);

    vm.case = caseItem;
    vm.caseStatuses = CaseStatuses.query();

    vm.getPriorityDisplay = getPriorityDisplay;
    vm.changeCaseStatus = changeCaseStatus;
    vm.assignCase = assignCase;
    vm.updateModel = updateModel;

    activate();

    //////

    function activate() {
        var assignedToGroups = [];
        var caseEnd;

        if (vm.case.account) {
            Account.get({id: vm.case.account.id}).$promise.then(function(account) {
                vm.account = account;
            });
        }

        if (vm.case.contact) {
            Contact.get({id: vm.case.contact.id}).$promise.then(function(contact) {
                vm.contact = contact;
            });
        }

        angular.forEach(vm.case.assigned_to_groups, function(response) {
            UserTeams.get({id: response.id}).$promise.then(function(team) {
                assignedToGroups.push(team);
            });
        });

        Tenant.query({}, function(tenant) {
            vm.tenant = tenant;
        });

        vm.case.assigned_to_groups = assignedToGroups;

        vm.caseStart = moment(vm.case.created).subtract(2, 'days').format('YYYY-MM-DD');

        if (vm.case.status.status === 'Closed') {
            caseEnd = moment(vm.case.modified);
        } else {
            caseEnd = moment();
        }

        vm.caseEnd = caseEnd.add(2, 'days').format('YYYY-MM-DD');
    }

    /**
     *
     * @returns {string}: A string which states what label should be displayed
     */
    function getPriorityDisplay() {
        var label = '';

        if (vm.case.is_archived) {
            label = 'label-default';
        } else {
            switch (vm.case.priority) {
                case 0:
                    label = 'label-success';
                    break;
                case 1:
                    label = 'label-info';
                    break;
                case 2:
                    label = 'label-warning';
                    break;
                case 3:
                    label = 'label-danger';
                    break;
                default :
                    label = 'label-info';
                    break;
            }
        }

        return label;
    }

    function updateModel(data, field) {
        var args = HLResource.createArgs(data, field, vm.case);

        return HLResource.patch('Case', args).$promise;
    }

    function changeCaseStatus(status) {
        vm.case.status = status;

        return updateModel(status.id, 'status');
    }

    function assignCase() {
        vm.case.assigned_to = currentUser;
        vm.case.assigned_to.full_name = currentUser.fullName;

        return updateModel(currentUser.id, 'assigned_to');
    }

    $scope.$watch('vm.case.is_archived', function(newValue, oldValue) {
        if (newValue !== oldValue) {
            updateModel(vm.case.is_archived, 'is_archived');
        }
    });
}
