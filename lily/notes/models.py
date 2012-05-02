from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.db import models
from django.template.defaultfilters import truncatewords
from django.utils.translation import ugettext as _

from lily.utils.models import Deleted


class Note(Deleted):
    """
    Note model, simple text fields to store text about another model for everyone to see.
    """
    note = models.TextField(verbose_name=_('note'))
    author = models.ForeignKey('users.CustomUser', verbose_name=_('author'))
    
    content_type = models.ForeignKey(ContentType)
    object_id  = models.PositiveIntegerField()
    subject = generic.GenericForeignKey('content_type','object_id')
    
    def __unicode__(self):
        return truncatewords(self.note, 5)

    class Meta:
        ordering = ['-created']
        verbose_name = _('note')
        verbose_name_plural = _('notes')