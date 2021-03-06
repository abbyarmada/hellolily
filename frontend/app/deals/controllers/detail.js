angular.module('app.deals').config(dealsConfig);

dealsConfig.$inject = ['$stateProvider'];
function dealsConfig($stateProvider) {
    $stateProvider.state('base.deals.detail', {
        parent: 'base.deals',
        url: '/{id:int}',
        views: {
            '@': {
                templateUrl: 'deals/controllers/detail.html',
                controller: DealDetailController,
                controllerAs: 'vm',
            },
        },
        ncyBreadcrumb: {
            label: '{{ deal.name }}',
        },
        resolve: {
            currentDeal: ['Deal', '$stateParams', function(Deal, $stateParams) {
                var id = $stateParams.id;
                return Deal.get({id: id}).$promise;
            }],
            dealContact: ['Contact', 'currentDeal', function(Contact, currentDeal) {
                var contact;

                if (currentDeal.contact) {
                    contact = Contact.get({id: currentDeal.contact.id}).$promise;
                }

                return contact;
            }],
            user: ['User', function(User) {
                return User.me().$promise;
            }],
        },
    });
}

angular.module('app.deals').controller('DealDetailController', DealDetailController);

DealDetailController.$inject = ['$compile', '$scope', '$state', '$templateCache', 'Account', 'Contact', 'Deal',
    'HLResource', 'HLUtils', 'Settings', 'Tenant', 'currentDeal', 'dealContact', 'user'];
function DealDetailController($compile, $scope, $state, $templateCache, Account, Contact, Deal,
                              HLResource, HLUtils, Settings, Tenant, currentDeal, dealContact, user) {
    var vm = this;

    Settings.page.setAllTitles('detail', currentDeal.name, currentDeal.contact, currentDeal.account);
    Settings.page.toolbar.data = {
        model: 'Deal',
        object: currentDeal,
        field: 'name',
        updateCallback: updateModel,
    };

    vm.deal = currentDeal;
    vm.deal.contact = dealContact;
    vm.currentUser = user;

    vm.changeState = changeState;
    vm.updateModel = updateModel;

    activate();

    //////

    function activate() {
        if (vm.deal.account) {
            Account.get({id: vm.deal.account.id}).$promise.then(function(account) {
                vm.account = account;
            });
        }

        if (vm.deal.contact) {
            Contact.get({id: vm.deal.contact.id}).$promise.then(function(contact) {
                vm.contact = contact;
            });
        }

        Deal.getNextSteps(function(response) {
            angular.forEach(response.results, function(nextStep) {
                if (nextStep.name === 'None') {
                    vm.noneStep = nextStep;
                }
            });
        });

        Deal.getWhyLost(function(response) {
            vm.whyLostChoices = response.results;
        });

        Deal.getStatuses(function(response) {
            vm.statusChoices = response.results;

            vm.lostStatus = Deal.lostStatus;
            vm.wonStatus = Deal.wonStatus;
        });

        Tenant.query({}, function(tenant) {
            vm.tenant = tenant;
        });
    }

    function updateModel(data, field) {
        var nextStepDate;
        var args = HLResource.createArgs(data, field, vm.deal);
        var patchPromise;

        if (args.hasOwnProperty('next_step')) {
            if (vm.deal.next_step.date_increment !== 0) {
                // Update next step date based on next step.
                nextStepDate = HLUtils.addBusinessDays(vm.deal.next_step.date_increment);
                nextStepDate = moment(nextStepDate).format('YYYY-MM-DD');

                vm.deal.next_step_date = nextStepDate;
                args.next_step_date = nextStepDate;
            } else if (angular.equals(vm.deal.next_step, vm.noneStep)) {
                // None step is selected, so clear the next step date.
                vm.deal.next_step_date = null;
                args.next_step_date = null;
            }
        }

        if (args.hasOwnProperty('status')) {
            if (vm.deal.status.id === vm.lostStatus.id) {
                // If the status is 'Lost', set the next step to 'None'.
                vm.deal.next_step = vm.noneStep;
                vm.deal.next_step_date = null;

                args.next_step = vm.noneStep;
                args.next_step_date = null;
            } else {
                vm.deal.why_lost = null;

                args.why_lost = null;
            }
        }

        if (args.hasOwnProperty('customer_id')) {
            vm.deal.account.customer_id = args.customer_id;

            // Updating an object through another object (e.g. account through deal) is ugly.
            // So just do a separate Account.patch. Not using the HLResource.patch because we want to display
            // a custom message.
            return Account.patch(args, function() {
                toastr.success('I\'ve updated the customer ID for you!', 'Done');
            });
        }

        if (field === 'name') {
            Settings.page.setAllTitles('detail', data, vm.deal.contact, vm.deal.account);
        }

        patchPromise = HLResource.patch('Deal', args).$promise;

        patchPromise.then(function() {
            if (args.hasOwnProperty('amount_once') || args.hasOwnProperty('amount_recurring')) {
                $state.go($state.current, {}, {reload: true});
            }
        });

        return patchPromise;
    }

    /**
     * Change the state of a deal.
     */
    function changeState(status) {
        var args;

        // For now we'll use a separate function to update the status,
        // since the buttons and the value in the list need to be equal.
        vm.deal.status = status;

        // TODO: Should this be done in the API?
        if (['Won', 'Lost'].indexOf(status[1]) > -1) {
            vm.deal.closed_date = moment().format();
        } else {
            vm.deal.closed_date = null;
        }

        args = {
            id: vm.deal.id,
            status: vm.deal.status,
            closed_date: vm.deal.closed_date,
        };

        if (vm.deal.status.id === vm.lostStatus.id && vm.whyLostChoices.length > 0) {
            // If the status is 'Lost' we want to provide a reason why the deal was lost.
            whyLost(args);
        } else {
            updateModel(args);
        }
    }

    $scope.$watch('vm.deal.is_archived', function(newValue, oldValue) {
        if (newValue !== oldValue) {
            updateModel(vm.deal.is_archived, 'is_archived');
        }
    });

    function whyLost(args) {
        swal({
            title: messages.alerts.deals.title,
            html: $compile($templateCache.get('deals/controllers/whylost.html'))($scope),
            showCancelButton: true,
            showCloseButton: true,
        }).then(function(isConfirm) {
            if (isConfirm) {
                vm.deal.why_lost = vm.whyLost;
                args.why_lost = vm.whyLost.id;

                updateModel(args);
            }
        }).done();
    }
}
