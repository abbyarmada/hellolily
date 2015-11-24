angular.module('app.contacts').config(contactsConfig);

contactsConfig.$inject = ['$stateProvider'];
function contactsConfig($stateProvider) {
    $stateProvider.state('base.contacts', {
        url: '/contacts',
        views: {
            '@': {
                templateUrl: 'contacts/controllers/list.html',
                controller: ContactListController,
            },
        },
        ncyBreadcrumb: {
            label: 'Contacts',
        },
    });
}

angular.module('app.contacts').controller('ContactListController', ContactListController);

ContactListController.$inject = ['$scope', '$window', 'Settings', 'Contact', 'LocalStorage', 'ContactTest'];
function ContactListController($scope, $window, Settings, Contact, LocalStorage, ContactTest) {
    var storage = LocalStorage('contactList');

    Settings.page.setAllTitles('list', 'contacts');

    /**
     * table object: stores all the information to correctly display the table
     */
    $scope.table = {
        page: 1,  // current page of pagination: 1-index
        pageSize: 20,  // number of items per page
        totalItems: 0, // total number of items
        filter: storage.get('filter', ''),  // search filter
        order: storage.get('order', {
            ascending: true,
            column: 'modified',  // string: current sorted column
        }),
        visibility: storage.get('visibility', {
            name: true,
            contactInformation: true,
            worksAt: true,
            created: true,
            modified: true,
            tags: true,
        })};

    $scope.deleteContact = function(contact) {
        if (confirm('Are you sure?')) {
            ContactTest.delete({
                id: contact.id,
            }, function() {  // On success
                var index = $scope.table.items.indexOf(contact);
                $scope.table.items.splice(index, 1);
            }, function() {  // On error
                alert('something went wrong.');
            });
        }
    };

    /**
     * updateTableSettings() puts the scope variables in local storage
     */
    function updateTableSettings() {
        storage.put('filter', $scope.table.filter);
        storage.put('order', $scope.table.order);
        storage.put('visibility', $scope.table.visibility);
    }

    /**
     * updateContacts() reloads the contacts through a service
     *
     * Updates table.items and table.totalItems
     */
    function updateContacts() {
        var sort = $scope.table.order.column;
        if ($scope.table.order.ascending) {
            sort = '-'.concat(sort);
        }

        Contact.search({
            q: $scope.table.filter,
            page: $scope.table.page - 1,
            size: $scope.table.pageSize,
            sort: sort,
        }, function(data) {  // On success
            $scope.table.items = data.contacts;
            $scope.table.totalItems = data.total;
        });
    }

    /**
     * Watches the model info from the table that, when changed,
     * needs a new set of contacts
     */
    $scope.$watchGroup([
        'table.page',
        'table.order.column',
        'table.order.ascending',
        'table.filter',
    ], function() {
        updateTableSettings();
        updateContacts();
    });

    /**
     * Watches the model info from the table that, when changed,
     * needs to store the info to the cache
     */
    $scope.$watchCollection('table.visibility', function() {
        updateTableSettings();
    });

    /**
     * setFilter() sets the filter of the table
     *
     * @param queryString string: string that will be set as the new filter on the table
     */
    $scope.setFilter = function(queryString) {
        $scope.table.filter = queryString;
    };

    /**
     * exportToCsv() creates an export link and opens it
     */
    $scope.exportToCsv = function() {
        var getParams = '';

        // If there is a filter, add it
        if ($scope.table.filter) {
            getParams += '&export_filter=' + $scope.table.filter;
        }

        // Add all visible columns
        angular.forEach($scope.table.visibility, function(value, key) {
            if (value) {
                getParams += '&export_columns=' + key;
            }
        });

        // Setup url
        var url = '/contacts/export/';
        if (getParams) {
            url += '?' + getParams.substr(1);
        }

        // Open url
        $window.open(url);
    };
}
