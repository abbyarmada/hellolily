from .lily_search import LilySearch
from django.forms.models import model_to_dict

from lily.accounts.models import Account


def search_number(tenant_id, number):
    search = LilySearch(
        tenant_id=tenant_id,
        model_type='accounts_account',
        size=1,
    )

    # Try to find an account with the given phone number.
    search.filter_query('phone_numbers.number:"%s"' % number)

    hits, facets, total, took = search.do_search()
    if hits:
        account = Account.objects.get(pk=hits[0].get('id'))
        contacts = [model_to_dict(contact) for contact in account.contacts.all()]

        if contacts:
            return {
                'data': {
                    'account': hits[0],
                    'contacts': contacts
                },
            }
        else:
            return {
                'data': {
                    'account': hits[0]
                },
            }

    else:
        search = LilySearch(
            tenant_id=tenant_id,
            model_type='contacts_contact',
            size=1,
        )

        # Try to find a contact with the given phone number.
        search.filter_query('phone_numbers.number:"%s"' % number)

        hits, facets, total, took = search.do_search()
        if hits:
            if hits[0].get('accounts'):
                # If the contact has accounts, return the first one.
                return {
                    'data': {
                        'account': hits[0].get('accounts')[0],
                        'contacts': [hits[0]]
                    },
                }
            else:
                return {
                    'data': {
                        'contacts': [hits[0]]
                    },
                }

    return {}
